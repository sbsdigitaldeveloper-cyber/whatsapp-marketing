"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/SideBar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const user = localStorage.getItem("user_name");

    if (!user) {
      router.replace("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // Prevent Hydration Mismatch
  if (!isMounted) return null;

  if (!authorized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
        <div className="relative flex items-center justify-center">
          {/* Outer Pulse Ring */}
          <div className="absolute h-16 w-16 bg-green-100 rounded-full animate-ping opacity-75" />
          {/* Main Spinner */}
          <div className="relative h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
        <p className="mt-6 text-sm font-medium text-gray-500 tracking-wide animate-pulse">
          Securing your session...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans antialiased overflow-hidden">
      {/* 1. Sidebar remains fixed at the left */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 2. Header stays at the top */}
        <Header />

        {/* 3. Main Content Area with "App Canvas" feel */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
             {/* 4. Content Wrapper: Adds a clean entrance for children */}
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
               {children}
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}