"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Megaphone, Users, Settings, LogOut, 
  UserCircle, MessageSquare, CheckSquare, Bot, PlusSquare, Lock
} from "lucide-react";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useLogout } from "@/app/hooks/useLogout";
import { useDashboardData } from "@/app/hooks/useDashboardData"; // Data hook import karein

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, alwaysOpen: true },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
  { name: "Contacts", href: "/dashboard/contacts", icon: Users },
  { name: "New Templates", href: "/dashboard/campaigns/createcompaign", icon: PlusSquare },
  { name: "Templates", href: "/dashboard/templates", icon: CheckSquare },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Agents", href: "/dashboard/agents", icon: Bot },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, alwaysOpen: true },
];

// @/components/Sidebar.tsx
export default function Sidebar() {
  const pathname = usePathname();
  const { data } = useDashboardData("7d");
  const isRestricted = data?.userStatus === "PENDING" || data?.userStatus === "SUSPENDED";

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-white border-r hidden md:flex flex-col items-center z-40">
      <div className="h-16 flex items-center justify-center border-b w-full bg-green-50/30">
        <span className="text-green-600 font-black text-xl tracking-tighter">WA</span>
      </div>

      <nav className="flex-1 flex flex-col items-center gap-1 py-4 w-full overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const isDisabled = isRestricted && !item.alwaysOpen;

          if (isDisabled) {
            return (
              <div key={item.name} className="w-full py-3 flex flex-col items-center justify-center gap-1 text-gray-300 cursor-not-allowed group relative">
                <Lock size={14} className="absolute top-2 right-4 text-gray-200" />
                <item.icon size={18} strokeWidth={2} />
                <span className="text-[9px] font-bold uppercase tracking-tight">{item.name.split(" ")[0]}</span>
                <div className="absolute left-20 ml-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-all shadow-xl font-bold">
                   Locked: {data?.userStatus === "SUSPENDED" ? "Account Suspended" : "Admin Setup Required"}
                </div>
              </div>
            );
          }

          return (
            <Link key={item.name} href={item.href} className={`w-full py-3 flex flex-col items-center justify-center gap-1 transition-all group
                ${isActive ? "bg-green-50 text-green-600 border-r-4 border-green-600" : "text-gray-400 hover:bg-green-50 hover:text-green-700"}`}>
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className="group-hover:scale-110 transition-transform" />
              <span className={`text-[9px] font-bold uppercase tracking-tight ${isActive ? "text-green-700" : "text-gray-400"}`}>
                {item.name.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}