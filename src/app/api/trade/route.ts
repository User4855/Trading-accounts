import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function getPrice(symbol: string): Promise<number> {
  const res = await fetch(
    "https://api.binance.com/api/v3/ticker/price?symbol=" + symbol,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Price feed unavailable");
  const data = (await res.json()) as { symbol: string; price: string };
  return Number(data.price);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const body = await req.json();
  const schema = z.object({
    symbol: z.string().regex(/^[A-Z0-9]{3,15}$/),
    side: z.enum(["BUY", "SELL"]),
    qty: z.number().positive(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { symbol, side, qty } = parsed.data;

  const allowed = new Set(["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"]);
  if (!allowed.has(symbol)) return NextResponse.json({ error: "Symbol not allowed" }, { status: 400 });

  const price = await getPrice(symbol);
  const notional = qty * price;

  const account = await prisma.account.findUnique({ where: { userId } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const acc = await tx.account.findUnique({ where: { userId } });
      if (!acc) throw new Error("Account not found");

      const pos = await tx.position.findUnique({
        where: { userId_symbol: { userId, symbol } },
      });

      if (side === "BUY") {
        if (acc.usdtCash < notional) throw new Error("Insufficient USDT");

        const newQty = (pos?.qty ?? 0) + qty;
        const newAvg = pos
          ? ((pos.qty * pos.avgPrice) + (qty * price)) / newQty
          : price;

        await tx.account.update({
          where: { userId },
          data: { usdtCash: acc.usdtCash - notional },
        });

        await tx.position.upsert({
          where: { userId_symbol: { userId, symbol } },
          create: { userId, symbol, qty: newQty, avgPrice: newAvg },
          update: { qty: newQty, avgPrice: newAvg },
        });
      } else {
        const curQty = pos?.qty ?? 0;
        if (curQty < qty) throw new Error("Insufficient position");

        const newQty = curQty - qty;

        await tx.account.update({
          where: { userId },
          data: { usdtCash: acc.usdtCash + notional },
        });

        if (newQty === 0) {
          await tx.position.delete({ where: { userId_symbol: { userId, symbol } } });
        } else {
          await tx.position.update({
            where: { userId_symbol: { userId, symbol } },
            data: { qty: newQty },
          });
        }
      }

      await tx.trade.create({
        data: { userId, side, symbol, qty, price, notional },
      });

      return { price, notional };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Trade failed" }, { status: 400 });
  }
}
