import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;

  const body = await req.json();
  const schema = z.object({
    asset: z.literal("USDT"),
    amount: z.number().positive(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { asset, amount } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const acc = await tx.account.findUnique({ where: { userId } });
      if (!acc) throw new Error("Account not found");
      if (acc.usdtCash < amount) throw new Error("Insufficient USDT");

      await tx.account.update({
        where: { userId },
        data: { usdtCash: acc.usdtCash - amount },
      });

      await tx.withdrawal.create({
        data: {
          userId,
          asset,
          amount,
          status: "PENDING",
          note: "EDUCATIONAL DEMO: simulated withdrawal (no real funds).",
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Withdrawal failed" }, { status: 400 });
  }
}
