"use client";
import { useState } from "react";

export type CampaignStatus = "Completed" | "Sending" | "Scheduled" | "Failed";

export interface CampaignRow {
  id: string;
  name: string;
  template: string;
  sent: number;
  delivered: number;
  deliveredPct: number;
  read: number;
  readPct: number;
  replied: number;
  repliedPct: number;
  failed: number;
  status: CampaignStatus | string;
  sentAt: string;
}

interface Props {
  data?: CampaignRow[];
  isLoading?: boolean;
}

// Bright/light-theme-friendly status colors
const statusCfg: Record<string, { bg: string; text: string; dot: string }> = {
  Completed: { bg: "bg-green-100 border-green-300", text: "text-green-700", dot: "bg-green-700" },
  Sending:   { bg: "bg-blue-100 border-blue-300", text: "text-blue-700", dot: "bg-blue-700 animate-pulse" },
  Scheduled: { bg: "bg-yellow-100 border-yellow-300", text: "text-yellow-700", dot: "bg-yellow-700" },
  Failed:    { bg: "bg-red-100 border-red-300", text: "text-red-700", dot: "bg-red-700" },
};

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono tabular-nums w-10 text-gray-700">
        {pct > 0 ? `${pct}%` : "—"}
      </span>
    </div>
  );
}

type SortKey = keyof CampaignRow;

export function CampaignTable({ data, isLoading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("sentAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const campaigns = data ?? [];

  const sorted = [...campaigns].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (k !== sortKey) return <span className="ml-1 text-[10px] text-gray-400">↕</span>;
    return <span className="ml-1 text-[10px] text-gray-800">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const th = "text-left text-[11px] font-medium text-gray-600 uppercase tracking-wider pb-3 cursor-pointer hover:text-gray-900 transition-colors select-none whitespace-nowrap";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-800">Campaign results</h2>
        <span className="text-xs text-gray-500">
          {isLoading ? "Loading…" : `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-12" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-500">No campaigns in this period</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="border-b border-gray-300">
                <th className={th} onClick={() => handleSort("name")}>Campaign <SortIcon k="name" /></th>
                <th className={th}>Template</th>
                <th className={`${th} text-right`} onClick={() => handleSort("sent")}>Sent <SortIcon k="sent" /></th>
                <th className={th} onClick={() => handleSort("deliveredPct")}>Delivered <SortIcon k="deliveredPct" /></th>
                <th className={th} onClick={() => handleSort("readPct")}>Read <SortIcon k="readPct" /></th>
                <th className={th} onClick={() => handleSort("repliedPct")}>Replied <SortIcon k="repliedPct" /></th>
                <th className={th} onClick={() => handleSort("status")}>Status <SortIcon k="status" /></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => {
                const cfg = statusCfg[c.status] || {
                  bg: "bg-gray-100 border-gray-300",
                  text: "text-gray-700",
                  dot: "bg-gray-700",
                };
                if (!statusCfg[c.status]) console.warn("Unknown status:", c.status);

                return (
                  <tr key={c.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors group">
                    <td className="py-3.5 pr-5">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900 truncate max-w-[160px]">{c.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{c.sentAt}</p>
                    </td>
                    <td className="py-3.5 pr-5">
                      <span className="text-[11px] font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded-md truncate max-w-[130px] inline-block">{c.template}</span>
                    </td>
                    <td className="py-3.5 pr-5 text-right">
                      <span className="text-sm font-mono text-gray-800 tabular-nums">{c.sent.toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 pr-5"><MiniBar pct={c.deliveredPct} color="#3b82f6" /></td>
                    <td className="py-3.5 pr-5"><MiniBar pct={c.readPct} color="#10b981" /></td>
                    <td className="py-3.5 pr-5"><MiniBar pct={c.repliedPct} color="#8b5cf6" /></td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}