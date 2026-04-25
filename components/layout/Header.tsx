"use client";

import { Bell, UserCircle, ChevronDown, LogOut, User, Settings, ShieldCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useLogout } from "@/app/hooks/useLogout";

// @/components/Header.tsx
export default function Header() {
  const user = useCurrentUser();
  const logout = useLogout();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <header className="sticky top-0 h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-4 md:px-8 z-20">
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-gray-400 text-xs font-medium uppercase tracking-wider">Pages</span>
        <span className="hidden sm:inline text-gray-300">/</span>
        <h2 className="text-sm font-bold text-gray-900 tracking-tight">Dashboard</h2>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <button className="relative p-2 text-gray-500 hover:text-green-600 rounded-full transition-all">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
        </button>

        <div className="h-6 w-[1px] bg-gray-200" />

        <div className="relative" ref={ref}>
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-green-100">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-[11px] font-black text-gray-900 leading-none mb-0.5">{user?.name || "User"}</p>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Account Settings</span>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
               <div className="p-2">
                <button onClick={() => { setOpen(false); router.push("/dashboard/settings"); }} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition">
                  <User size={16} /> Profile
                </button>
                <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}