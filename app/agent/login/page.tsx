"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AgentLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Email and password required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/agent/loginAgent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Redirect to agent dashboard
      router.push("/agent/agentDashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-sm">
            💬
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Agent Login</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your agent account</p>
        </div>

        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
              placeholder="rahul@company.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-colors placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-colors placeholder:text-slate-400"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-mono">⚠ {error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-200 text-white font-medium text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Admin?{" "}
          <a href="/login" className="text-emerald-600 hover:underline">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}