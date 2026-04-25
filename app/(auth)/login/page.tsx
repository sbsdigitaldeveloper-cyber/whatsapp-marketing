"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, LogIn, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/authentication/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setMessage(data.error || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("user_name", data.name ?? "");
      localStorage.setItem("user_id", String(data.userId ?? ""));
      localStorage.setItem("email", data.email ?? "");

      if (data.role === "super_admin") {
        router.push("/super-admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setMessage("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    // Note: AuthLayout background handle kar raha hai, hum yahan sirf Card pe focus karenge
    <div className="max-w-[440px] w-full flex flex-col gap-8 animate-in fade-in zoom-in duration-500">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl rotate-3 hover:rotate-0 transition-all duration-500">
          <ShieldCheck className="text-green-400" size={32} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">SBS whatsapp Marketing Platform</h1>
          <div className="h-1 w-8 bg-green-500 mx-auto rounded-full mt-1" />
        </div>
      </div>

      {/* ── Modern SaaS Login Card ── */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-gray-100 p-8 md:p-12 relative overflow-hidden">
        
        {/* Decorative element inside card */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

        <div className="mb-8 text-center md:text-left relative z-10">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Welcome back</h2>
          <p className="text-sm text-gray-400 mt-3 font-medium">Continue to your marketing workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors" />
              <input
                type="email"
                placeholder="name@company.com"
                required
                className="w-full bg-gray-50/50 border border-gray-200 px-11 py-3.5 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/5 focus:border-green-500 outline-none transition-all text-sm placeholder:text-gray-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
              <Link href="#" className="text-[10px] font-bold text-green-600 hover:underline">Forgot?</Link>
            </div>
            <div className="relative group">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors" />
              <input
                type="password"
                placeholder="••••••••"
                required
                className="w-full bg-gray-50/50 border border-gray-200 px-11 py-3.5 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/5 focus:border-green-500 outline-none transition-all text-sm placeholder:text-gray-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-bold mt-2 shadow-xl shadow-gray-200 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Sign In to Dashboard
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {message && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-center animate-shake">
            <p className="text-xs font-bold text-red-500">{message}</p>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-gray-50 text-center">
          <p className="text-sm text-gray-400 font-medium">
            New to Platform?{" "}
            <Link href="/register" className="text-green-600 font-bold hover:text-green-700 transition-colors underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

     
    </div>
  );
}