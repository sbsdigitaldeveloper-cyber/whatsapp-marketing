"use client";

interface Stats {
  totalContacts: number;
  totalMessages: number;
  byStatus: Record<string, number>;
}

const statusColors: Record<string, string> = {
  DELIVERED: "text-emerald-400",
  SENT: "text-blue-400",
  FAILED: "text-red-400",
  PENDING: "text-slate-400",
  READ: "text-violet-400",
};

export function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div className="flex items-center gap-6 px-6 py-3 bg-[#0a0f1c] border-b border-white/[0.05] text-xs font-mono overflow-x-auto">
      <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
        <span className="text-slate-600">contacts</span>
        <span className="text-slate-100 font-bold">{stats.totalContacts}</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
        <span className="text-slate-600">total msgs</span>
        <span className="text-slate-100 font-bold">{stats.totalMessages}</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      {Object.entries(stats.byStatus).map(([status, count]) => (
        <div key={status} className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-600">{status.toLowerCase()}</span>
          <span className={`font-bold ${statusColors[status] ?? "text-slate-400"}`}>
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}