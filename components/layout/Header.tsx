"use client";

import { Bell, UserCircle, ChevronDown, LogOut, User, Settings, ShieldCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useLogout } from "@/app/hooks/useLogout";

export default function Header() {
  const user = useCurrentUser();
  const logout = useLogout();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Handle scroll effect for a more premium feel
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className={`sticky top-0 h-16 flex items-center justify-between px-8 z-30 transition-all duration-200 
      ${scrolled ? "bg-white/80 backdrop-blur-md border-b shadow-sm" : "bg-white border-b"}`}>
      
      {/* Left Section: Breadcrumbs style */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm font-medium">Dashboard</span>
        <span className="text-gray-300">/</span>
        <h2 className="text-sm font-semibold text-gray-900 tracking-tight">Overview</h2>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-5">
        
        {/* Notification Bell with improved badge */}
        <button className="relative p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-all">
          <Bell size={20} strokeWidth={2} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-gray-200" />

        {/* Profile Dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-green-100 group-hover:scale-105 transition-transform">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle size={20} />}
              </div>
              {/* Online Status Dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>

            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-gray-900 leading-none mb-1">
                {user?.name ?? "User Name"}
              </p>
              <div className="flex items-center gap-1">
                 <ShieldCheck size={10} className="text-green-600" />
                 <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Admin</span>
              </div>
            </div>
            
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute right-0 mt-3 w-60 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden z-50 animate-in fade-in zoom-in duration-150">
              {/* User Identity */}
              <div className="px-5 py-4 bg-gray-50/50">
                <p className="text-xs text-gray-400 font-medium mb-1">Signed in as</p>
                <p className="text-sm font-bold text-gray-800 truncate">{user?.email ?? "user@example.com"}</p>
              </div>

              <div className="p-2">
                <button
                  onClick={() => { setOpen(false); router.push("/dashboard/settings"); }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 rounded-lg transition"
                >
                  <User size={16} />
                  My Profile
                </button>
                
                <button
                  onClick={() => { setOpen(false); router.push("/dashboard/settings"); }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 rounded-lg transition"
                >
                  <Settings size={16} />
                  Account Settings
                </button>
              </div>

              <div className="p-2 border-t border-gray-50">
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}