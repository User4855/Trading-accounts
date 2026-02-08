"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) setErr("Invalid credentials");
    else r.push("/");
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
        <h2>Login</h2>
        <div className="row">
          <input style={{ flex: 1 }} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={{ flex: 1 }} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={submit}>Sign in</button>{" "}
          <button className="btn2" onClick={() => r.push("/register")}>Create account</button>
        </div>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </div>
    </div>
  );
}
