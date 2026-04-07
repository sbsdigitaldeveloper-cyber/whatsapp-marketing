"use client";

export interface KPI {
  label: string;
  value: string;
  change: string;
  up: boolean;
  sub?: string;
}

interface Props {
  data?: KPI[];
  isLoading?: boolean;
}

function Skeleton() {
  return <div className="animate-pulse bg-gray-200 rounded-xl h-24" />;
}

const icons: Record<string, string> = {
  "Templates sent":   "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  "Delivery rate":    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  "Read rate":        "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  "Reply rate":       "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6",
  "Active campaigns": "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z",
  "Failed messages":  "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

export function KPICards({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-6 gap-4">
      {data.map((kpi, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group"
        >
          {/* Icon + label row */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{kpi.label}</p>
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-green-100 transition-all">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                className="text-gray-400 group-hover:text-green-600 transition-colors" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d={icons[kpi.label] ?? icons["Templates sent"]} />
              </svg>
            </div>
          </div>

          {/* Value */}
          <p className="text-2xl font-semibold text-gray-800 tracking-tight leading-none">{kpi.value}</p>

          {/* Change badge */}
          <div className="flex items-center gap-1.5 mt-2.5">
            {kpi.change ? (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                kpi.up ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}>
                {kpi.up ? "↑" : "↓"} {kpi.change}
              </span>
            ) : null}
            <span className="text-[11px] text-gray-400">{kpi.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}