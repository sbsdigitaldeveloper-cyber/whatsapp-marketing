"use client";

export interface VolumePoint {
  label: string;
  sent: number;
  delivered: number;
}

interface Props {
  data?: VolumePoint[];
  isLoading?: boolean;
}

export function MessageVolumeChart({ data, isLoading }: Props) {
  const points = data ?? [];
  const maxVal = Math.max(...points.map((p) => Math.max(p.sent, p.delivered)), 1);
  
  const totalSent = points.reduce((s, p) => s + p.sent, 0);
  const totalDel  = points.reduce((s, p) => s + p.delivered, 0);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col h-full">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900">Message Volume Trend</h2>
          <div className="flex gap-4 mt-1">
             <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[11px] font-medium text-gray-500">Sent: {totalSent.toLocaleString()}</span>
             </div>
             <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[11px] font-medium text-gray-500">Delivered: {totalDel.toLocaleString()}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative flex-grow min-h-[220px]">
        {isLoading ? (
          <div className="absolute inset-0 animate-pulse bg-gray-50 rounded-xl" />
        ) : points.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-gray-50 rounded-xl">
            <p className="text-sm text-gray-400">No activity recorded for this period</p>
          </div>
        ) : (
          <div className="flex items-end justify-between h-full gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {points.map((pt, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group min-w-[35px] max-w-[60px]">
                {/* Bars Area */}
                <div className="relative w-full h-48 flex items-end justify-center gap-[2px] mb-2">
                  {/* Sent Bar */}
                  <div
                    className="w-1/2 bg-green-500/10 hover:bg-green-500/20 border-t-2 border-green-500 rounded-t-[2px] transition-all duration-300 relative group/bar"
                    style={{ height: `${(pt.sent / maxVal) * 100}%` }}
                  >
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                        {pt.sent} Sent
                     </div>
                  </div>
                  {/* Delivered Bar */}
                  <div
                    className="w-1/2 bg-blue-500/10 hover:bg-blue-500/20 border-t-2 border-blue-500 rounded-t-[2px] transition-all duration-300 relative group/bar"
                    style={{ height: `${(pt.delivered / maxVal) * 100}%` }}
                  >
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                        {pt.delivered} Delivered
                     </div>
                  </div>
                </div>
                {/* X-Axis Label */}
                <span className="text-[10px] font-semibold text-gray-400 group-hover:text-gray-900 uppercase tracking-tighter transition-colors">
                  {pt.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}