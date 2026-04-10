// "use client";

// import { useEffect, useState } from "react";

// interface Campaign {
//   id: number;
//   name: string;
//   message: string;
//   status: string;
//   createdAt: string;
//   _count: { messages: number };
// }

// const statusEmoji: Record<string, string> = {
//   DRAFT: "📝",
//   QUEUED: "🔄",
//   SENT: "✅",
//   PARTIAL: "⚠️",
//   FAILED: "❌",
// };

// export default function CampaignList() {
//   const [campaigns, setCampaigns] = useState<Campaign[]>([]);

//   const fetchCampaigns = async () => {
//     const token = localStorage.getItem("token");
//     const res = await fetch("/api/campaign", {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     const data = await res.json();
//     setCampaigns(data);
//   };

//   useEffect(() => {
//     fetchCampaigns();
//   }, []);

//   // 👇 Koi bhi campaign QUEUED hai toh polling karo
//   useEffect(() => {
//     const hasQueued = campaigns.some((c) => c.status === "QUEUED");
//     if (!hasQueued) return;

//     const interval = setInterval(() => {
//       fetchCampaigns();
//     }, 5000);

//     return () => clearInterval(interval);
//   }, [campaigns]);

//   return (
//     <div>
//       <h1>All Campaigns</h1>
//       {campaigns.length === 0 ? (
//         <p>No campaigns yet.</p>
//       ) : (
//         <ul>
//           {campaigns.map((c) => (
//             <li key={c.id}>
//               <a href={`/dashboard/campaigns/${c.id}`}>
//                 {statusEmoji[c.status]} {c.name} — {c.status} — {c._count.messages} messages
//               </a>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Campaign {
  id: number;
  name: string;
  message: string;
  status: string;
  createdAt: string;
  templateName: string | null;
  messageType: string;
  _count: { messages: number };
  stats?: {
    sent: number;
    delivered: number;
    failed: number;
  };
}

const statusConfig: Record<
  string,
  { emoji: string; label: string; classes: string }
> = {
  DRAFT: { emoji: "📝", label: "Draft", classes: "bg-gray-100 text-gray-600" },
  QUEUED: { emoji: "🔄", label: "Queued", classes: "bg-amber-100 text-amber-700" },
  SENDING: { emoji: "📤", label: "Sending", classes: "bg-blue-100 text-blue-700" },
  COMPLETED: { emoji: "✅", label: "Completed", classes: "bg-emerald-100 text-emerald-700" },
  SENT: { emoji: "✅", label: "Sent", classes: "bg-emerald-100 text-emerald-700" },
  PARTIAL: { emoji: "⚠️", label: "Partial", classes: "bg-orange-100 text-orange-700" },
  FAILED: { emoji: "❌", label: "Failed", classes: "bg-red-100 text-red-700" },
};

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/campaign", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Poll every 5s if active campaigns exist
  useEffect(() => {
    const hasActive = campaigns.some(
      (c) => c.status === "QUEUED" || c.status === "SENDING"
    );

    if (!hasActive) return;

    const interval = setInterval(fetchCampaigns, 5000);
    return () => clearInterval(interval);
  }, [campaigns]);

  const hasActive = campaigns.some(
    (c) => c.status === "QUEUED" || c.status === "SENDING"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            {!loading && (
              <p className="text-sm text-gray-500 mt-0.5">
                {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} total
              </p>
            )}
          </div>

          {hasActive && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
              Live updating
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                    <div className="h-3 w-32 bg-gray-100 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-gray-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && campaigns.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 font-medium">No campaigns yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              Go to Templates and send your first campaign.
            </p>
          </div>
        )}

        {/* List */}
        {!loading && campaigns.length > 0 && (
          <div className="space-y-3">
            {campaigns.map((c) => {
              const config = statusConfig[c.status] ?? {
                emoji: "❓",
                label: c.status,
                classes: "bg-gray-100 text-gray-600",
              };

              const date = new Date(c.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <Link
                  key={c.id}
                  href={`/dashboard/campaigns/${c.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:border-green-300 hover:shadow-md transition-all duration-200 group"
                >
                  {/* Top Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-2xl flex-shrink-0">{config.emoji}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 group-hover:text-green-700 transition truncate">
                          {c.name}
                        </p>
                        {c.templateName && (
                          <p className="text-xs text-green-600 mt-0.5">
                            📋 {c.templateName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className="hidden md:block text-xs text-gray-400">
                        {date}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.classes} ${
                          c.status === "SENDING" ? "animate-pulse" : ""
                        }`}
                      >
                        {config.label}
                      </span>
                      <span className="text-gray-300 group-hover:text-green-500 transition text-sm">
                        →
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center gap-4 mt-3 ml-10">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>👥</span>
                      <span>{c._count.messages} contacts</span>
                    </div>

                    {c.stats && (
                      <>
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <span>📤</span>
                          <span>{c.stats.sent} sent</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <span>✅</span>
                          <span>{c.stats.delivered} delivered</span>
                        </div>
                        {c.stats.failed > 0 && (
                          <div className="flex items-center gap-1 text-xs text-red-500">
                            <span>❌</span>
                            <span>{c.stats.failed} failed</span>
                          </div>
                        )}
                      </>
                    )}

                    <span className="hidden md:block text-xs text-gray-300">•</span>
                    <span className="hidden md:block text-xs text-gray-400">
                      {date}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}