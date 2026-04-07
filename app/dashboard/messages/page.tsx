"use client";

import { ChatPanel } from "@/components/messagescompontents/Chatpanel";
import { ContactList } from "@/components/messagescompontents/ContantList";
import { StatsBar } from "@/components/messagescompontents/StatusBar";
import { Contact, MessagesApiResponse } from "@/lib/chatsandmessages/types";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";

export default function MessagesPage() {
  const [data, setData]                       = useState<MessagesApiResponse | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [selectedId, setSelectedId]           = useState<number | null>(null);
  const [statusFilter, setStatusFilter]       = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [search, setSearch]                   = useState("");

  const hasSelected = useRef(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchData = useCallback(async (showLoader = false) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    if (showLoader) setLoading(true);

    try {
      const r = await fetch(`/api/messages?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json() as MessagesApiResponse;

      setData(d);
      setError(null);

      if (!hasSelected.current && d.contacts.length > 0) {
        setSelectedId(d.contacts[0].id);
        hasSelected.current = true;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, token]);

  useEffect(() => {
    fetchData(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  // Silent refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(debouncedSearch), 400);
    return () => clearTimeout(t);
  }, [debouncedSearch]);

  const selectedContact: Contact | null = useMemo(
    () => data?.contacts.find((c) => c.id === selectedId) ?? null,
    [data, selectedId]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm font-mono text-slate-500">Loading messages…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-sm shadow-sm">
          <p className="text-red-600 font-bold mb-1">Failed to load</p>
          <p className="text-red-400 text-sm font-mono">{error}</p>
          <button
            onClick={() => fetchData(true)}
            className="mt-4 text-sm text-red-500 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-slate-50 text-slate-800 flex flex-col"
      style={{ height: "100vh", fontFamily: "'DM Mono', 'Fira Code', monospace" }}
    >
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-slate-200 bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">📱</span>
          <h1 className="font-bold text-slate-800 tracking-tight">Messages</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-600 font-mono font-semibold">live</span>
        </div>
        <div className="ml-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 cursor-pointer shadow-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="READ">Read</option>
          </select>
        </div>
      </header>

      {data && <StatsBar stats={data.stats} />}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Contact list */}
        <div className="w-72 shrink-0 flex flex-col overflow-hidden border-r border-slate-200 bg-white">
          <ContactList
            contacts={data?.contacts ?? []}
            selectedId={selectedId}
            onSelect={setSelectedId}
            search={debouncedSearch}
            onSearch={setDebouncedSearch}
          />
        </div>

        {/* Chat */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <ChatPanel
            contact={selectedContact}
            onRefresh={() => fetchData(false)}
          />
        </main>
      </div>
    </div>
  );
}
// ```

// ---

// ## Kaise kaam karega
// ```
// Webhook → DB update karta hai (DELIVERED / READ / reply)
//          ↓
// Page har 5 second mein silent fetch karta hai
//          ↓
// Naya data aate hi UI update ho jaata hai — no refresh needed ✅
