"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Megaphone, Users, FileText,
  Settings, LogOut, UserCircle, MessageSquare, CheckSquare,
  HelpCircle,
  Bot,
  PlusSquare,
} from "lucide-react";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useLogout } from "@/app/hooks/useLogout";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
  { name: "Contacts", href: "/dashboard/contacts", icon: Users },
  { name: "New Templates", href: "/dashboard/campaigns/createcompaign", icon: PlusSquare },
  { name: "Templates", href: "/dashboard/templates", icon: CheckSquare },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Agents", href: "/dashboard/agents", icon: Bot },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const logout = useLogout();

  return (
    // 1. Increased width from w-16 to w-20 or w-24 to fit text
    <aside className="w-20 bg-white border-r hidden md:flex flex-col items-center">
      
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b w-full">
        <span className="text-green-600 font-bold text-lg">WA</span>
      </div>

      {/* Nav Icons + Text */}
      <nav className="flex-1 flex flex-col items-center gap-2 py-6 w-full">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              // 2. Changed to flex-col and reduced padding for a compact look
              className={`w-full py-3 flex flex-col items-center justify-center gap-1 transition
                ${isActive ? "bg-green-50 text-green-600 border-r-4 border-green-600" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <item.icon size={20} />
              {/* 3. Added small text label */}
              <span className="text-[10px] font-medium uppercase tracking-tight">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="pb-4 flex flex-col items-center gap-4 w-full border-t pt-4">
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle size={18} />}
          </div>
          <span className="text-[10px] text-gray-400">Profile</span>
        </div>

        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-500"
        >
          <LogOut size={18} />
          <span className="text-[10px]">Logout</span>
        </button>
      </div>
    </aside>
  );
}