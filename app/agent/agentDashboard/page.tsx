"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────
interface Message {
  id:        number;
  body:      string | null;
  direction: string;
  status:    string;
  sentAt:    string | null;
  mediaType: string | null;
  mediaUrl:  string | null;
  mediaName: string | null;
}

interface Contact {
  id:           number;
  name:         string | null;
  phone:        string;
  optIn:        boolean;
  messageCount: number;
  messages:     Message[];
}

// ── Helpers ────────────────────────────────────────
function getInitials(name: string | null, phone: string) {
  if (name) return name.slice(0, 2).toUpperCase();
  return phone.slice(-2);
}

function formatTime(ts: string | null) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_ICON: Record<string, string> = {
  PENDING: "🕐", SENT: "✓", DELIVERED: "✓✓", READ: "✓✓", FAILED: "✗",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-slate-400", SENT: "text-slate-400",
  DELIVERED: "text-blue-400", READ: "text-emerald-400", FAILED: "text-red-400",
};

// ── Main Component ─────────────────────────────────
export default function AgentDashboard() {
  const router = useRouter();
  const [agentName, setAgentName]   = useState("");
  const [contacts, setContacts]     = useState<Contact[]>([]);
  const [selected, setSelected]     = useState<Contact | null>(null);
  const [loading, setLoading]       = useState(true);
  const [replyText, setReplyText]   = useState("");
  const [sending, setSending]       = useState(false);
  const [sendError, setSendError]   = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [connected, setConnected]   = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const selectedRef  = useRef<Contact | null>(null); // ref for SSE closure
  const contactsRef  = useRef<Contact[]>([]);         // ref for SSE closure

  // Keep refs in sync
  useEffect(() => { selectedRef.current  = selected;  }, [selected]);
  useEffect(() => { contactsRef.current  = contacts;  }, [contacts]);

  // ── Fetch all assigned contacts (initial load) ───
  async function fetchContacts() {
    try {
      const res  = await fetch("/api/agent/agentContacts");
      if (res.status === 401) { router.push("/agent/login"); return; }
      const data = await res.json();
      const list: Contact[] = data.contacts ?? [];
      setContacts(list);
      contactsRef.current = list;
    } catch {}
    finally { setLoading(false); }
  }

  // ── SSE: append new messages to the right contact ─
  const handleSSEMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "connected") {
        setConnected(true);
        return;
      }

      if (data.type === "new_messages") {
        const { contactId, messages: newMsgs } = data as {
          contactId: number;
          messages:  Message[];
        };

        // Update contacts list
        setContacts((prev) =>
          prev.map((c) => {
            if (c.id !== contactId) return c;
            // Avoid duplicates
            const existingIds = new Set(c.messages.map((m) => m.id));
            const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
            if (fresh.length === 0) return c;
            return {
              ...c,
              messages:     [...c.messages, ...fresh],
              messageCount: c.messageCount + fresh.length,
            };
          })
        );

        // Also update selected contact if it's the same one
        setSelected((prev) => {
          if (!prev || prev.id !== contactId) return prev;
          const existingIds = new Set(prev.messages.map((m) => m.id));
          const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
          if (fresh.length === 0) return prev;
          return {
            ...prev,
            messages:     [...prev.messages, ...fresh],
            messageCount: prev.messageCount + fresh.length,
          };
        });
      }
    } catch {}
  }, []);

  // ── Setup SSE connection ─────────────────────────
  useEffect(() => {
    // Get agent info
    fetch("/api/agent/agentInfo")
      .then((r) => r.json())
      .then((d) => { if (d.name) setAgentName(d.name); })
      .catch(() => {});

    // Initial load
    fetchContacts();

    // Open SSE stream
    const es = new EventSource("/api/agent/stream");

    es.onmessage = handleSSEMessage;

    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects — no manual retry needed
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  // ── Scroll to bottom on new messages ────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);

  // ── Send reply ───────────────────────────────────
  async function handleReply() {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/messages/reply", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ contactId: selected.id, message: replyText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setReplyText("");
      // Optimistically add sent message — SSE will also pick it up
      const optimistic: Message = {
        id:        Date.now(), // temp id
        body:      replyText,
        direction: "OUTBOUND",
        status:    "SENT",
        sentAt:    new Date().toISOString(),
        mediaType: null,
        mediaUrl:  null,
        mediaName: null,
      };
      setSelected((prev) =>
        prev ? { ...prev, messages: [...prev.messages, optimistic], messageCount: prev.messageCount + 1 } : prev
      );
    } catch (err: any) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  // ── Logout ───────────────────────────────────────
  async function handleLogout() {
    await fetch("/api/agent/logoutAgent", { method: "POST" });
    router.push("/agent/login");
  }

  const filtered = contacts.filter((c) =>
    (c.name ?? c.phone).toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ───────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── Sidebar ── */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">

        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {agentName.slice(0, 2).toUpperCase() || "AG"}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">{agentName || "Agent"}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <p className="text-[10px] text-slate-400">{connected ? "Live" : "Connecting…"}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              Logout
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-400 transition-colors placeholder:text-slate-400"
          />
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400 px-4 text-center">
              <span className="text-3xl">📭</span>
              <p className="text-xs">No contacts assigned to you yet</p>
            </div>
          ) : (
            filtered.map((contact) => {
              const lastMsg  = contact.messages[contact.messages.length - 1];
              const isActive = selected?.id === contact.id;
              return (
                <button
                  key={contact.id}
                  onClick={() => { setSelected(contact); setSendError(null); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 transition-colors text-left ${
                    isActive ? "bg-emerald-50 border-l-2 border-l-emerald-500" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(contact.name, contact.phone)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {contact.name ?? contact.phone}
                      </p>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                          {formatTime(lastMsg.sentAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {lastMsg?.body ?? (lastMsg?.mediaType ? `[${lastMsg.mediaType}]` : "No messages")}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
            <span className="text-5xl">💬</span>
            <p className="text-sm">Select a contact to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 bg-white shadow-sm flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                {getInitials(selected.name, selected.phone)}
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">{selected.name ?? "Unknown"}</h2>
                <p className="text-xs font-mono text-slate-500">
                  {selected.phone} ·{" "}
                  <span className={selected.optIn ? "text-emerald-600" : "text-red-500"}>
                    {selected.optIn ? "opt-in" : "opted out"}
                  </span>
                </p>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-slate-100 border border-slate-200 text-slate-600 rounded-lg px-3 py-1 font-mono">
                  {selected.messageCount} message{selected.messageCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3 bg-slate-50">
              {!selected.optIn && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  <span>⛔</span>
                  <span>This contact has <strong>opted out</strong>.</span>
                </div>
              )}

              {selected.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-2 text-slate-400">
                  <span className="text-3xl">📭</span>
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                selected.messages.map((msg) => {
                  const isInbound = msg.direction === "INBOUND";
                  return (
                    <div key={msg.id} className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[70%] flex flex-col gap-1 ${isInbound ? "items-start" : "items-end"}`}>
                        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isInbound
                            ? "bg-[#1e2736] text-slate-200 rounded-tl-sm"
                            : "bg-emerald-700 text-white rounded-tr-sm"
                        }`}>
                          {msg.mediaType === "image" && msg.mediaUrl && (
                            <img src={msg.mediaUrl} alt="img" className="rounded-lg max-w-full max-h-64 mb-2 cursor-pointer"
                              onClick={() => window.open(msg.mediaUrl!, "_blank")} />
                          )}
                          {msg.mediaType === "document" && msg.mediaUrl && (
                            <a href={msg.mediaUrl} target="_blank" rel="noreferrer" download={msg.mediaName ?? true}
                              className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 mb-2 no-underline">
                              <span>📄</span>
                              <span className="text-xs text-white">{msg.mediaName ?? "Document"}</span>
                            </a>
                          )}
                          {msg.body && <p className="m-0">{msg.body}</p>}
                          {!msg.body && !msg.mediaType && <p className="m-0 opacity-50">—</p>}
                        </div>
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="text-[10px] text-slate-500 font-mono">{formatTime(msg.sentAt)}</span>
                          {!isInbound && (
                            <span className={`text-xs font-bold ${STATUS_COLOR[msg.status] ?? "text-slate-400"}`}>
                              {STATUS_ICON[msg.status]} {msg.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply Box */}
            <div className="px-4 py-3 border-t border-slate-200 bg-white flex-shrink-0">
              {sendError && <p className="text-xs text-red-500 font-mono mb-2">⚠ {sendError}</p>}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !sending && handleReply()}
                  placeholder={selected.optIn ? "Type a reply…" : "Contact opted out"}
                  disabled={!selected.optIn || sending}
                  className="flex-1 bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
                <button
                  onClick={handleReply}
                  disabled={sending || !replyText.trim() || !selected.optIn}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-200 disabled:text-emerald-400 disabled:cursor-not-allowed text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : "Send ↑"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}