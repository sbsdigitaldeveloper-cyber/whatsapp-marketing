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
import { DeliveryFunnel } from "@/components/dashboard/Deliveryfunnel";
import { FailureBreakdown } from "@/components/dashboard/Failurebreakdown";
import { MessageVolumeChart } from "@/components/dashboard/MessageVolumeChart";
import { TopTemplates } from "@/components/dashboard/TopTemplates";
import { FailedMessagesList } from "@/components/dashboard/FailedMessagesList";
import { useDashboardData } from "../hooks/useDashboardData";

type DateRange = "today" | "7d" | "30d";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const { data, isLoading, error } = useDashboardData(dateRange);


  // 🛡️ Gatekeeper Check
// 🛡️ GATEKEEPER: Status Checks
  if (!isLoading && data) {
    // Check 1: Suspended User (Full Block)
    if (data.userStatus === "SUSPENDED") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="max-w-md w-full text-center bg-white p-10 rounded-3xl shadow-2xl border-t-8 border-red-500">
            <div className="text-red-500 mb-6 flex justify-center">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m12-3a9 9 0 11-18 0 9 9 0 0118 0zM12 9v2" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">Account Suspended</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Bhai, aapka account **Suspend** kar diya gaya hai. Zyada jaankari ke liye please support ya Super Admin se baat karein.
            </p>
            <button onClick={() => window.location.href='/support'} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold text-sm">Contact Support</button>
          </div>
        </div>
      );
    }

    // Check 2: Pending Setup
    if (data.userStatus === "PENDING") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          {/* Aapka existing Pending UI code... */}
          <div className="max-w-md w-full text-center bg-white p-10 rounded-3xl border border-gray-100 shadow-xl">
             <h2 className="text-2xl font-black text-gray-900 mb-3">Setup in Progress</h2>
             {/* ... */}
          </div>
        </div>
      );
    }
  }





  return (
    <div className="min-h-screen bg-[#F8F9FB] text-gray-900 font-sans pb-12">
      {/* Responsive Main Wrapper:
         - md:ml-20: Sidebar space
         - max-w-[1600px]: Taki badi screens par dashboard fail na jaye 
      */}
      <main className="transition-all duration-300 ml-0 md:ml-20 p-4 md:p-8 max-w-[1600px] mx-auto">

        {/* --- SECTION 1: HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Real-time insights into your WhatsApp campaigns</p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm self-start">
            {(["today", "7d", "30d"] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                  dateRange === r
                    ? "bg-green-600 text-white shadow-md shadow-green-100"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                {r === "today" ? "Today" : r === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded-r-xl animate-bounce">
            ⚠️ SYSTEM ERROR: {error}
          </div>
        )}

        {/* --- SECTION 2: TOP-LEVEL KPIS (Immediate Impact) --- */}
        <section className="mb-10">
          <KPICards data={data?.kpis || []} isLoading={isLoading} />
        </section>

        {/* --- SECTION 3: PERFORMANCE FLOW (Actionable Analytics) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Funnel: Bada dikhna chahiye (col-8) kyuki ye main conversion hai */}
          <div className="lg:col-span-8 flex flex-col">
            <DeliveryFunnel data={data?.funnel || []} isLoading={isLoading} />
          </div>
          
          {/* Failure: Sidebar metric (col-4) */}
          <div className="lg:col-span-4 flex flex-col">
            <FailureBreakdown data={data?.failures || []} isLoading={isLoading} />
          </div>
        </div>

        {/* --- SECTION 4: TRENDS & CONTENT (Strategic Analytics) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Trend Chart: col-7 */}
          <div className="lg:col-span-7 flex flex-col">
            <MessageVolumeChart data={data?.volumeChart || []} isLoading={isLoading} />
          </div>
          
          {/* Templates Performance: col-5 */}
          <div className="lg:col-span-5 flex flex-col">
            <TopTemplates data={data?.topTemplates || []} isLoading={isLoading} />
          </div>
        </div>

        {/* --- SECTION 5: OPERATIONAL DATA (Logs & Details) --- */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-lg font-black text-gray-900">Campaign Failure Logs</h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Identify and fix delivery issues</p>
            </div>
            <button className="px-4 py-2 bg-gray-50 text-gray-600 text-[11px] font-bold rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
              Export Logs (.CSV)
            </button>
          </div>
          
          <div className="p-2">
            <FailedMessagesList data={data?.failedList || []} isLoading={isLoading} />
          </div>
        </section>

      </main>
    </div>
  );
}