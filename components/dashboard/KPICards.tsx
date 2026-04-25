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

// Better Skeleton for UX
function Skeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 h-[110px] animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-8 w-8 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-6 w-16 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-24 bg-gray-100 rounded" />
    </div>
  );
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
  // Skeleton Loader (Responsive grid: 1 col on mobile, 3 on tablet, 6 on extra large)
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
      {data.map((kpi, i) => (
        <div
          key={i}
          className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
        >
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 rounded-bl-full -mr-8 -mt-8 group-hover:bg-green-50 transition-colors" />

          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                {kpi.label}
              </p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                {kpi.value}
              </h3>
            </div>
            
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${
              kpi.label === "Failed messages" && kpi.up ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400 group-hover:bg-green-600 group-hover:text-white group-hover:shadow-green-100 group-hover:shadow-lg"
            }`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d={icons[kpi.label] ?? icons["Templates sent"]} />
              </svg>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 relative z-10">
            {kpi.change && (
              <div className={`flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded ${
                kpi.up 
                  ? (kpi.label === "Failed messages" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600") 
                  : "bg-gray-100 text-gray-500"
              }`}>
                {kpi.up ? "▲" : "▼"} {kpi.change}
              </div>
            )}
            <span className="text-[10px] font-medium text-gray-400 italic">
              {kpi.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}