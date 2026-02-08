"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const r = useRouter();
  const [name, setName] = useState("Domagoj Miksa");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Registration failed");
      return;
    }
    r.push("/login");
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
        <h2>Register (Demo)</h2>
        <p className="small">Creates a demo account with 100,000 USDT paper balance.</p>
        <div className="row">
          <input style={{ flex: 1 }} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input style={{ flex: 1 }} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={{ flex: 1 }} type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={submit}>Create account</button>{" "}
          <button className="btn2" onClick={() => r.push("/login")}>Go to login</button>
        </div>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </div>
    </div>
  );
}
