"use client";

import { useState, useEffect } from "react";
import { Contact } from "@/lib/chatsandmessages/types";

interface Props {
  contacts: Contact[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  search: string;
  onSearch: (v: string) => void;
}

function getInitials(name: string | null, phone: string) {
  if (name) return name.slice(0, 2).toUpperCase();
  return phone.slice(-2);
}

const AVATAR_COLORS = [
  "bg-teal-100 text-teal-800",
  "bg-blue-100 text-blue-800",
  "bg-amber-100 text-amber-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-cyan-100 text-cyan-800",
];

const STATUS_DOT: Record<string, string> = {
  PENDING:   "bg-amber-400",
  SENT:      "bg-slate-400",
  DELIVERED: "bg-blue-400",
  READ:      "bg-teal-500",
  FAILED:    "bg-red-500",
};

function formatTime(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function getLastPreview(contact: Contact): string {
  const last = contact.lastMessage;
  if (!last) return "No messages yet";
  if (last.direction === "INBOUND") return `↩ ${last.body ?? ""}`;
  if (last.body) return last.body;
  if (last.campaign?.messageType === "TEMPLATE") return `📋 ${last.campaign.templateName}`;
  return last.campaign?.message ?? "—";
}

export function ContactList({ contacts, selectedId, onSelect, search, onSearch }: Props) {
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());

  useEffect(() => {
    const newHighlights = new Set<number>();
    contacts.forEach((c) => {
      if (c.lastMessage?.direction === "INBOUND") newHighlights.add(c.id);
    });
    setHighlighted((prev) => new Set([...prev, ...newHighlights]));
  }, [contacts]);

  const handleSelect = (id: number) => {
    onSelect(id);
    setHighlighted((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const sortedContacts = [...contacts].sort((a, b) => {
    const t1 = a.lastMessage?.sentAt ? new Date(a.lastMessage.sentAt).getTime() : 0;
    const t2 = b.lastMessage?.sentAt ? new Date(b.lastMessage.sentAt).getTime() : 0;
    return t2 - t1;
  });

  return (
    <aside className="flex flex-col h-full border-r border-slate-200 bg-white w-72 flex-shrink-0">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
            Contacts
          </h2>
          <span className="text-[11px] font-mono bg-slate-100 text-slate-500 rounded-md px-2 py-0.5 border border-slate-200">
            {contacts.length}
          </span>
        </div>
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M10.5 10.5l3 3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search name or phone…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <ul className="flex-1 overflow-y-auto">
        {sortedContacts.length === 0 && (
          <li className="p-6 text-center text-slate-400 text-sm">No contacts found</li>
        )}

        {sortedContacts.map((c, i) => {
          const colorClass = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const isActive = c.id === selectedId;
          const last = c.lastMessage;
          const preview = getLastPreview(c);
          const isHighlighted = highlighted.has(c.id);

          return (
            <li key={c.id}>
              <button
                onClick={() => handleSelect(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100 ${
                  isActive
                    ? "bg-teal-50 border-l-2 border-l-teal-600"
                    : isHighlighted
                    ? "bg-teal-50/60"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${colorClass}`}
                >
                  {getInitials(c.name, c.phone)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Row 1 — name + time */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-sm font-medium truncate ${
                        isActive ? "text-teal-700" : "text-slate-800"
                      }`}
                    >
                      {c.name ?? c.phone}
                    </span>
                    {last?.sentAt && (
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                        {formatTime(last.sentAt)}
                      </span>
                    )}
                  </div>

                  {/* Row 2 — preview + status dot */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {last && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isHighlighted
                            ? "bg-teal-500 animate-pulse"
                            : (STATUS_DOT[last.status] ?? "bg-slate-300")
                        }`}
                        title={`Status: ${last.status}`}
                      />
                    )}
                    <p className="text-xs text-slate-500 truncate font-mono">{preview}</p>

                    {/* New inbound badge */}
                    {isHighlighted && !isActive && (
                      <span className="ml-auto flex-shrink-0 text-[10px] bg-teal-100 text-teal-700 font-semibold px-1.5 py-0.5 rounded">
                        new
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}