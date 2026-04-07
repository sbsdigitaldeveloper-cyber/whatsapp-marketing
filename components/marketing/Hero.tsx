// components/landing/Hero.tsx
"use client";

import Link from "next/link";
import { ArrowRight, Zap, Shield } from "lucide-react";
import { useEffect, useState } from "react";

export default function Hero() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check karo user logged in hai ya nahi
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_user="));
    setIsLoggedIn(!!cookie);
  }, []);

  return (
    <section className="relative pt-20 pb-28 px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-50 via-white to-white"></div>
      <div className="absolute top-40 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-green-200/50 shadow-sm">
          <Zap className="w-4 h-4 mr-2 fill-green-500 text-green-500" />
          WhatsApp API — Official & Reliable
        </div>
        <h2 className="text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent max-w-4xl mx-auto leading-tight">
          Send WhatsApp Messages at Scale
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
            {" "}with Powerful Automation
          </span>
        </h2>
        <p className="mt-8 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Build campaigns, manage contacts, and track real-time message status — all in one simple, powerful platform.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/register"
            className="group bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>

          {/* ✅ Logged in hai → /dashboard, nahi hai → /login */}
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold hover:border-green-500 hover:text-green-600 hover:bg-green-50/50 transition flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5" />
            {isLoggedIn ? "Go to Dashboard" : "Live Demo"}
          </Link>
        </div>
      </div>
    </section>
  );
}