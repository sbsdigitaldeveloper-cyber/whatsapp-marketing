"use client";

import { MessageStatus } from "@/lib/chatsandmessages/types";


const config: Record<
  MessageStatus,
  { label: string; className: string; icon: string }
> = {
  PENDING:   { label: "Pending",   icon: "⏳", className: "bg-slate-700 text-slate-300" },
  SENT:      { label: "Sent",      icon: "📤", className: "bg-blue-900/50 text-blue-300" },
  DELIVERED: { label: "Delivered", icon: "✓✓", className: "bg-emerald-900/50 text-emerald-300" },
  FAILED:    { label: "Failed",    icon: "✗",  className: "bg-red-900/50 text-red-300" },
  READ:      { label: "Read",      icon: "👁",  className: "bg-violet-900/50 text-violet-300" },
};

export function StatusBadge({ status }: { status: MessageStatus }) {
  const c = config[status] ?? config.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono font-semibold ${c.className}`}
    >
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}