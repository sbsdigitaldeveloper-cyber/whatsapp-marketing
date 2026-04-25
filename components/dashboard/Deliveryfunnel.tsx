"use client";

export interface FunnelStep {
  label: string;
  count: number;
  pct: number;
  color?: string;
  textColor?: string;
}

interface Props {
  data?: FunnelStep[];
  isLoading?: boolean;
}

function Skeleton() {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
      <div className="flex-1 h-9 bg-gray-50 rounded-xl animate-pulse" />
      <div className="h-3 w-10 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

const defaultColors: Record<string, { bg: string; border: string; text: string }> = {
  Sent:    { bg: "bg-blue-500", border: "border-blue-600", text: "text-blue-50" },
  Read:    { bg: "bg-emerald-500", border: "border-emerald-600", text: "text-emerald-50" },
  Replied: { bg: "bg-purple-500", border: "border-purple-600", text: "text-purple-50" },
  Failed:  { bg: "bg-red-500", border: "border-red-600", text: "text-red-50" },
};

export function DeliveryFunnel({ data, isLoading }: Props) {
  const steps = data ?? [];

  const sent    = steps.find((s) => s.label === "Sent")?.count    ?? 0;
  const read    = steps.find((s) => s.label === "Read")?.count    ?? 0;
  const replied = steps.find((s) => s.label === "Replied")?.count ?? 0;
  const failed  = steps.find((s) => s.label === "Failed")?.pct    ?? 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 h-full flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-base font-bold text-gray-900">Delivery Performance</h2>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Conversion Pipeline</p>
        </div>
        <div className="text-right">
          <span className="text-xl font-black text-gray-900">{sent.toLocaleString()}</span>
          <p className="text-[10px] text-gray-400 font-bold uppercase">Total Volume</p>
        </div>
      </div>

      {/* Funnel Body */}
      <div className="flex-1 flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
        ) : steps.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-50 rounded-2xl">
            <p className="text-sm text-gray-400 italic">No funnel data available</p>
          </div>
        ) : (
          steps.map((step, i) => {
            const config = defaultColors[step.label] || { bg: "bg-gray-500", border: "border-gray-600", text: "text-white" };
            
            return (
              <div key={i} className="group">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-bold text-gray-400 w-16 uppercase tracking-tighter">
                    {step.label}
                  </span>
                  
                  <div className="flex-1 bg-gray-50 rounded-xl h-10 overflow-hidden relative border border-gray-50">
                    <div
                      className={`h-full ${config.bg} border-r-4 ${config.border} rounded-r-lg transition-all duration-1000 ease-out flex items-center px-4 shadow-inner relative group-hover:brightness-110`}
                      style={{ width: `${Math.max(step.pct, 5)}%` }}
                    >
                      {/* Glossy overlay effect */}
                      <div className="absolute inset-0 bg-white/10 opacity-20" />
                      
                      <span className={`text-[11px] font-black tracking-widest z-10 ${config.text}`}>
                        {step.pct}%
                      </span>
                    </div>
                  </div>

                  <span className="text-[12px] w-20 text-right font-black text-gray-700 tabular-nums">
                    {step.count.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Analytics Footer */}
      {!isLoading && steps.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-50 grid grid-cols-3 gap-4">
          {[
            { label: "Open Rate",   value: sent > 0 ? `${((read / sent) * 100).toFixed(1)}%` : "0%", color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Reply Rate",  value: read > 0 ? `${((replied / read) * 100).toFixed(1)}%` : "0%", color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Drop-off",    value: `${failed}%`, color: "text-red-600", bg: "bg-red-50" },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-xl p-3 text-center transition-transform hover:scale-105`}>
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{s.label}</p>
              <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}