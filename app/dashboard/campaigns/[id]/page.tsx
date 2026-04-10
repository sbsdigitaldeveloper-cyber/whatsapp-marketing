// // app/dashboard/campaigns/[id]/page.tsx
// import CampaignDetail from "./CampaignDetail";
// import { prisma } from "@/lib/prisma";

// interface Props {
//   params: { id: string } | Promise<{ id: string }>;
// }

// export default async function Page({ params }: Props) {
//   // unwrap params if it's a promise
//   const resolvedParams = await params;
//   const campaignId = Number(resolvedParams.id);

//   if (isNaN(campaignId)) {
//     return <p>Invalid campaign ID</p>;
//   }

//   // fetch campaign from DB
//   const campaign = await prisma.campaign.findUnique({
//     where: { id: campaignId },
//   });

//   if (!campaign) {
//     return <p>Campaign not found</p>;
//   }

//   // fetch all contacts for the campaign's user
//   const contactsRaw = await prisma.contact.findMany({
//     where: { userId: campaign.userId },
//     orderBy: { createdAt: "desc" },
//   });

//   // convert null names to undefined
//   const contacts = contactsRaw.map((c) => ({
//     ...c,
//     name: c.name ?? undefined,
//   }));

//   return <CampaignDetail campaign={campaign} contacts={contacts} />;
// }



"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Message {
  id: number;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  errorReason: string | null;
  contact: {
    name: string | null;
    phone: string;
  };
}

interface Campaign {
  id: number;
  name: string;
  status: string;
  templateName: string | null;
  messageType: string;
  createdAt: string;
  messages: Message[];
  stats: {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

const msgStatusConfig: Record<string, { emoji: string; label: string; classes: string }> = {
  PENDING:   { emoji: "⏳", label: "Pending",   classes: "bg-gray-100 text-gray-500" },
  DRAFT:     { emoji: "📝", label: "Draft",     classes: "bg-gray-100 text-gray-500" },
  SENT:      { emoji: "📤", label: "Sent",      classes: "bg-blue-100 text-blue-700" },
  DELIVERED: { emoji: "✅", label: "Delivered", classes: "bg-emerald-100 text-emerald-700" },
  READ:      { emoji: "👁️", label: "Read",      classes: "bg-purple-100 text-purple-700" },
  FAILED:    { emoji: "❌", label: "Failed",    classes: "bg-red-100 text-red-700" },
};

export default function CampaignDetailPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [retrying, setRetrying] = useState(false);

  async function fetchCampaign() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/campaign/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCampaign(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCampaign(); }, [id]);

  // ✅ Auto refresh jab SENDING/QUEUED ho
  useEffect(() => {
    if (
      campaign?.status !== "SENDING" &&
      campaign?.status !== "QUEUED"
    ) return;
    const interval = setInterval(fetchCampaign, 5000);
    return () => clearInterval(interval);
  }, [campaign?.status]);

  // ✅ Retry failed messages
  async function retryFailed() {
    try {
      setRetrying(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/campaign/${id}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await fetchCampaign();
    } catch (err) {
      console.error(err);
    } finally {
      setRetrying(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-sm">Loading campaign...</div>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">Campaign not found</div>
    </div>
  );

  const date = new Date(campaign.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  // ✅ Filter + Search
  const filteredMessages = campaign.messages.filter((m) => {
    const matchesFilter = filter === "ALL" || m.status === filter;
    const matchesSearch =
      m.contact.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.contact.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  // ✅ Progress
  const progress = campaign.stats.total > 0
    ? Math.round(
        ((campaign.stats.sent +
          campaign.stats.delivered +
          campaign.stats.read +
          campaign.stats.failed) /
          campaign.stats.total) * 100
      )
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Back Button */}
        <Link
          href="/dashboard/campaigns"
          className="text-sm text-gray-500 hover:text-green-600 mb-6 inline-flex items-center gap-1"
        >
          ← Back to Campaigns
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{campaign.name}</h1>
              <p className="text-sm text-gray-400 mt-1">📅 {date}</p>
              {campaign.templateName && (
                <p className="text-sm text-green-600 mt-1">
                  📋 Template: <span className="font-medium">{campaign.templateName}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Retry Button */}
              {campaign.stats.failed > 0 && campaign.status === "COMPLETED" && (
                <button
                  onClick={retryFailed}
                  disabled={retrying}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-medium"
                >
                  {retrying ? "Retrying..." : `🔄 Retry ${campaign.stats.failed} Failed`}
                </button>
              )}

              {/* Status Badge */}
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                campaign.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                campaign.status === "SENDING"   ? "bg-blue-100 text-blue-700 animate-pulse" :
                campaign.status === "QUEUED"    ? "bg-amber-100 text-amber-700 animate-pulse" :
                "bg-gray-100 text-gray-600"
              }`}>
                {campaign.status === "SENDING"   ? "📤 Sending..." :
                 campaign.status === "QUEUED"    ? "🔄 Queued..." :
                 campaign.status === "COMPLETED" ? "✅ Completed" :
                 campaign.status}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {(campaign.status === "SENDING" || campaign.status === "QUEUED") && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          {[
            { label: "Total",     value: campaign.stats.total,     color: "text-gray-700",    bg: "bg-white",      border: "border-gray-100",    filter: "ALL" },
            { label: "Sent",      value: campaign.stats.sent,      color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-100",    filter: "SENT" },
            { label: "Delivered", value: campaign.stats.delivered, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100", filter: "DELIVERED" },
            { label: "Read",      value: campaign.stats.read,      color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-100",  filter: "READ" },
            { label: "Failed",    value: campaign.stats.failed,    color: "text-red-700",     bg: "bg-red-50",     border: "border-red-100",     filter: "FAILED" },
          ].map((stat) => (
            <div
              key={stat.label}
              onClick={() => setFilter(stat.filter)}
              className={`${stat.bg} border ${stat.border} rounded-xl p-4 text-center cursor-pointer hover:shadow-sm transition ${
                filter === stat.filter ? "ring-2 ring-green-400" : ""
              }`}
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

          {/* List Header */}
          <div className="px-6 py-4 border-b border-gray-50 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold text-gray-800">
                Message Details
                <span className="text-gray-400 font-normal text-sm ml-2">
                  ({filteredMessages.length} showing)
                </span>
              </h2>

              {/* Filter Tabs */}
              <div className="flex gap-1 flex-wrap">
                {["ALL", "PENDING", "SENT", "DELIVERED", "READ", "FAILED"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                      filter === f
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Messages */}
          <div className="divide-y divide-gray-50">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No messages found
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const config = msgStatusConfig[msg.status] ?? {
                  emoji: "❓", label: msg.status, classes: "bg-gray-100 text-gray-600"
                };
                return (
                  <div
                    key={msg.id}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
                  >
                    {/* Contact */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                        {msg.contact.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {msg.contact.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-400">{msg.contact.phone}</p>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                      {/* Sent time */}
                      {msg.sentAt && (
                        <p className="text-xs text-gray-400 hidden md:block">
                          {new Date(msg.sentAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      )}

                      {/* Error reason */}
                      {msg.errorReason && (
                        <p className="text-xs text-red-400 hidden md:block max-w-32 truncate" title={msg.errorReason}>
                          {msg.errorReason}
                        </p>
                      )}

                      {/* Status */}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.classes}`}>
                        {config.emoji} {config.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}