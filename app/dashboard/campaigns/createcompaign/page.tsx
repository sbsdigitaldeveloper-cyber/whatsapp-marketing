"use client";

import { useState } from "react";

export default function CreateCampaign() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | null>(null);

  const create = async () => {
    if (!name.trim()) return setStatus("error");
    if (!message.trim()) return setStatus("error");

    setLoading(true);
    setStatus(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, message }),
      });

      if (res.ok) {
        setStatus("success");
        setName("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🚀 Create Campaign
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Set up a new WhatsApp broadcast campaign.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">

          {/* Status alerts */}
          {status === "success" && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium rounded-xl px-4 py-3">
              ✅ Campaign created successfully!
            </div>
          )}
          {status === "error" && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3">
              ❌ Please fill in all fields and try again.
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Campaign Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Diwali Sale 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              WhatsApp Message <span className="text-red-400">*</span>
            </label>
            <textarea
              placeholder="Type your broadcast message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{message.length} characters</p>
          </div>

          {/* Submit */}
          <button
            onClick={create}
            disabled={loading}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition"
          >
            {loading ? "Creating..." : "Create Campaign 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}

