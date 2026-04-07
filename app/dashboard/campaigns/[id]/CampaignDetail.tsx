"use client";

import { useState, useEffect, useMemo } from "react";

interface Contact {
  id: number;
  name?: string;
  phone: string;
}

interface Campaign {
  id: number;
  name: string;
  message: string;
  status: string;
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

interface Props {
  campaign: Campaign;
  contacts: Contact[];
}

const statusConfig: Record<string, { emoji: string; label: string; classes: string }> = {
  PENDING: { emoji: "⏳", label: "Pending", classes: "bg-gray-100 text-gray-600" },
  QUEUED: { emoji: "🔄", label: "Queued", classes: "bg-amber-100 text-amber-700" },
  SENT: { emoji: "✅", label: "Sent", classes: "bg-emerald-100 text-emerald-700" },
  PARTIAL: { emoji: "⚠️", label: "Partial", classes: "bg-orange-100 text-orange-700" },
  FAILED: { emoji: "❌", label: "Failed", classes: "bg-red-100 text-red-700" },
};

export default function CampaignDetail({ campaign, contacts }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [resultType, setResultType] = useState<"success" | "error">("success");
  const [campaignStatus, setCampaignStatus] = useState(campaign.status);
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, pending: 0 });
  const [search, setSearch] = useState("");

  // Filtered contacts (memoized for performance)
  const filteredContacts = useMemo(() => {
    const term = search.toLowerCase();
    return contacts.filter((c) => {
      return (
        c.name?.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term)
      );
    });
  }, [search, contacts]);

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/campaign/${campaign.id}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setStats(data);
  };

  useEffect(() => {
    if (campaignStatus !== "QUEUED") return;

    fetchStats();

    const interval = setInterval(async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/campaign/${campaign.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      fetchStats();

      if (data.status && data.status !== "QUEUED") {
        setCampaignStatus(data.status);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [campaignStatus]);

  const toggleSelect = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const selectFiltered = () => {
    const filteredIds = filteredContacts.map((c) => c.id);
    const allSelected = filteredIds.every((id) => selected.includes(id));

    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const sendCampaign = async () => {
    if (!selected.length) {
      setResultMsg("Please select at least one contact.");
      setResultType("error");
      return;
    }

    setLoading(true);
    setResultMsg("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/messages/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          contactIds: selected,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCampaignStatus("QUEUED");
        setResultMsg(`${data.queued} messages added to queue!`);
        setResultType("success");
        setSelected([]);
      } else {
        setResultMsg(data.error || "Failed to send messages");
        setResultType("error");
      }
    } catch {
      setResultMsg("Network error. Please try again.");
      setResultType("error");
    } finally {
      setLoading(false);
    }
  };

  const isQueued = campaignStatus === "QUEUED";
  const config =
    statusConfig[campaignStatus] ?? {
      emoji: "❓",
      label: campaignStatus,
      classes: "bg-gray-100 text-gray-600",
    };

  const allFilteredSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selected.includes(c.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Campaign Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📢 {campaign.name}
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                {campaign.message}
              </p>
            </div>

            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${config.classes}`}>
              {config.emoji} {config.label}
            </span>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900">Contacts</span>
                <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                  {filteredContacts.length}
                </span>
                {selected.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                    {selected.length} selected
                  </span>
                )}
              </div>

              <button
                onClick={selectFiltered}
                className="text-xs text-green-600 font-semibold hover:text-green-800 transition"
              >
                {allFilteredSelected ? "Deselect Filtered" : "Select Filtered"}
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 px-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          {/* Table */}
          {filteredContacts.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              {search ? "No contacts match your search." : "No contacts available."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={selectFiltered}
                        className="w-4 h-4 accent-green-600"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredContacts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => toggleSelect(c.id)}
                      className={`cursor-pointer ${
                        selected.includes(c.id)
                          ? "bg-green-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selected.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 accent-green-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {c.name || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {c.phone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Send Button */}
          <div className="px-6 py-4 border-t border-gray-100">
            <button
              onClick={sendCampaign}
              disabled={loading || !selected.length || isQueued}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition"
            >
              {loading
                ? "Adding to queue..."
                : isQueued
                ? "Sending in progress…"
                : `Send to ${selected.length} Contact${selected.length !== 1 ? "s" : ""} 🚀`}
            </button>

            {resultMsg && (
              <p className={`mt-3 text-sm font-medium ${resultType === "success" ? "text-emerald-700" : "text-red-600"}`}>
                {resultType === "success" ? "✅" : "❌"} {resultMsg}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}