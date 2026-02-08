import { NextResponse } from "next/server";

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];

export async function GET() {
  const url = "https://api.binance.com/api/v3/ticker/price";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ error: "Price feed unavailable" }, { status: 503 });
  }

  const all = (await res.json()) as Array<{ symbol: string; price: string }>;
  const filtered = all
    .filter((x) => SYMBOLS.includes(x.symbol))
    .map((x) => ({ symbol: x.symbol, price: Number(x.price) }));

  return NextResponse.json({ data: filtered, source: "binance" });
}
