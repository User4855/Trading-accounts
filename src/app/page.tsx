"use client";

import useSWR from "swr";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export default function Home() {
  const { data: session, status } = useSession();
  const { data: me, mutate: mutateMe } = useSWR(session ? "/api/me" : null, fetcher, { refreshInterval: 3000 });
  const { data: prices } = useSWR("/api/prices", fetcher, { refreshInterval: 2000 });

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [qty, setQty] = useState(0.01);
  const [msg, setMsg] = useState<string | null>(null);

  if (status === "loading") return <div className="container">Loading…</div>;
  if (!session) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: 720, margin: "40px auto" }}>
          <h2>Demo Trading App</h2>
          <p className="small">Please <a href="/login" style={{ color: "#0b63c7" }}>login</a> to use paper trading.</p>
        </div>
      </div>
    );
  }

  const priceMap: Record<string, number> = {};
  (prices?.data ?? []).forEach((p: any) => (priceMap[p.symbol] = p.price));

  const cash = me?.account?.usdtCash ?? 0;

  const positions = (me?.positions ?? []).map((p: any) => {
    const mark = priceMap[p.symbol] ?? 0;
    const pnl = (mark - p.avgPrice) * p.qty;
    const value = mark * p.qty;
    return { ...p, mark, pnl, value };
  });

  const equity = cash + positions.reduce((s: number, p: any) => s + p.value, 0);
  const totalPnl = positions.reduce((s: number, p: any) => s + p.pnl, 0);

  async function trade(side: "BUY" | "SELL") {
    setMsg(null);
    const res = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, side, qty }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(j.error ?? "Trade failed");
      return;
    }
    setMsg(`${side} filled @ ${fmt(j.price)} (${symbol})`);
    mutateMe();
  }

  return (
    <div className="container">
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>Welcome, {(session.user as any)?.name ?? "Trader"}</h2>
            <div className="small">Paper trading • Prices: Binance public feed</div>
          </div>
          <button className="btn2" onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</button>
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <div className="card" style={{ flex: 1, minWidth: 220 }}>
            <div className="small">USDT Cash</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(cash)} USDT</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 220 }}>
            <div className="small">Equity</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(equity)} USDT</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 220 }}>
            <div className="small">Unrealized PnL</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(totalPnl)} USDT</div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>Trade (Market • instant fill)</h3>
          <div className="row">
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"].map((s) => (
                <option key={s} value={s}>
                  {s} (price: {priceMap[s] ? fmt(priceMap[s]) : "…"})
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.0001"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              style={{ width: 160 }}
            />

            <button className="btn" onClick={() => trade("BUY")}>Buy</button>
            <button className="btn2" onClick={() => trade("SELL")}>Sell</button>
          </div>
          {msg && <p className="small" style={{ marginTop: 10 }}>{msg}</p>}
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <div className="card" style={{ flex: 1, minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>Positions</h3>
            <table>
              <thead>
                <tr>
                  <th>Symbol</th><th>Qty</th><th>Avg</th><th>Mark</th><th>PnL</th>
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 && (
                  <tr><td colSpan={5} className="small">No positions yet.</td></tr>
                )}
                {positions.map((p: any) => (
                  <tr key={p.symbol}>
                    <td>{p.symbol}</td>
                    <td>{fmt(p.qty)}</td>
                    <td>{fmt(p.avgPrice)}</td>
                    <td>{fmt(p.mark)}</td>
                    <td>{fmt(p.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ flex: 1, minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>Recent Trades</h3>
            <table>
              <thead>
                <tr>
                  <th>Time</th><th>Side</th><th>Symbol</th><th>Qty</th><th>Price</th>
                </tr>
              </thead>
              <tbody>
                {(me?.trades ?? []).length === 0 && (
                  <tr><td colSpan={5} className="small">No trades yet.</td></tr>
                )}
                {(me?.trades ?? []).map((t: any) => (
                  <tr key={t.id}>
                    <td className="small">{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{t.side}</td>
                    <td>{t.symbol}</td>
                    <td>{fmt(t.qty)}</td>
                    <td>{fmt(t.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="small" style={{ marginTop: 14 }}>
          Educational demo only. No real funds, no real exchange connection, no withdrawals.
        </p>
      </div>
    </div>
  );
}
