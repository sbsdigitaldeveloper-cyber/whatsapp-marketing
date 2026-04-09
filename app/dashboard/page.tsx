// "use client";
// import { useState, useEffect } from "react";

// export default function Dashboard() {
//   const [messages, setMessages] = useState<any[]>([]);
//   const [phone, setPhone] = useState("");
//   const [text, setText] = useState("");
//   const [status, setStatus] = useState("");

//   // Poll messages every 3-5 seconds
//   // useEffect(() => {
//   //   const fetchMessages = async () => {
//   //     const res = await fetch("/api/webhook/whatsapp");
//   //     const data = await res.json();
//   //     setMessages(data.messages || []);
//   //   };

//   //   fetchMessages();
//   //   const interval = setInterval(fetchMessages, 3000);
//   //   return () => clearInterval(interval);
//   // }, []);

//   // const sendMessage = async () => {
//   //   if (!phone || !text) return;
//   //   const res = await fetch("/api/campaign/send", {
//   //     method: "POST",
//   //     headers: { "Content-Type": "application/json" },
//   //     body: JSON.stringify({ phone, text }),
//   //   });
//   //   const data = await res.json();
//   //   setStatus(data.success ? "Message sent!" : "Failed to send");
//   //   setText("");
//   // };

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">WhatsApp Dashboard</h1>

//       <div className="mb-4 border p-4 rounded">
//         <h2 className="font-semibold mb-2">Send Campaign</h2>
//         <input
//           placeholder="Phone"
//           value={phone}
//           onChange={(e) => setPhone(e.target.value)}
//           className="border p-2 mr-2"
//         />
//         <input
//           placeholder="Message"
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           className="border p-2 mr-2"
//         />
//         {/* <button
//           onClick={sendMessage}
//           className="bg-blue-500 text-white px-4 py-2"
//         >
//           Send
//         </button> */}
//         <div className="mt-2 text-green-600">{status}</div>
//       </div>

//       <h2 className="text-xl font-semibold mb-2">Messages</h2>
//       <ul>
//         {messages.map((m) => (
//           <li key={m.id} className="border p-2 mb-1">
//             <b>{m.from}</b>: {m.text} <i>({m.timestamp})</i>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { KPICards } from "@/components/dashboard/KPICards";
import { CampaignTable } from "@/components/dashboard/CampaignTable";
import { MessageVolumeChart } from "@/components/dashboard/MessageVolumeChart";
import { TopTemplates } from "@/components/dashboard/TopTemplates";
import { useDashboardData } from "../hooks/useDashboardData";
import { DeliveryFunnel } from "@/components/dashboard/Deliveryfunnel";
import { FailureBreakdown } from "@/components/dashboard/Failurebreakdown";
import { FailedMessagesList } from "@/components/dashboard/FailedMessagesList";

type DateRange = "today" | "7d" | "30d";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const { data, isLoading, error } = useDashboardData(dateRange);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <main className="ml-16 p-7">

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">WhatsApp marketing overview</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-300 rounded-lg">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>

            <div className="flex bg-white border border-gray-300 rounded-lg p-1 gap-1">
              {(["today", "7d", "30d"] as DateRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                    dateRange === r
                      ? "bg-green-500 text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {r === "today" ? "Today" : r === "7d" ? "7 days" : "30 days"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-100 border border-red-300 rounded-xl text-sm text-red-600">
            Failed to load dashboard data: {error}
          </div>
        )}

        {/* KPI Cards */}
        <KPICards data={data?.kpis || []} isLoading={isLoading} />

        {/* Funnel + Failures */}
        <div className="grid grid-cols-5 gap-4 mt-4">
          <div className="col-span-3">
            <DeliveryFunnel data={data?.funnel || []} isLoading={isLoading} />
          </div>
          <div className="col-span-2">
            <FailureBreakdown data={data?.failures || []} isLoading={isLoading} />
          </div>
        </div>

        {/* Campaigns */}
        {/* <div className="mt-4">
          <CampaignTable data={data?.campaigns || []} isLoading={isLoading} />
        </div> */}

        {/* Charts */}
        <div className="grid grid-cols-5 gap-4 mt-4 mb-4">
          <div className="col-span-3">
            <MessageVolumeChart data={data?.volumeChart || []} isLoading={isLoading} />
          </div>
          <div className="col-span-2">
            <TopTemplates data={data?.topTemplates || []} isLoading={isLoading} />
          </div>
        </div>

        {/* Failed Messages — full width, campaign-grouped */}
        <div className="mt-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Failed Messages</h2>
              <p className="text-xs text-gray-400 mt-0.5">Grouped by campaign</p>
            </div>
          </div>
          <FailedMessagesList
            data={data?.failedList || []}
            isLoading={isLoading}
          />
        </div>

      </main>
    </div>
  );
}