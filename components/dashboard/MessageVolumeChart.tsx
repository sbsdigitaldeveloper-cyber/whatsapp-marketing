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
  const maxVal = Math.max(...points.map((p) => p.sent), 1);
  const totalSent = points.reduce((s, p) => s + p.sent, 0);
  const totalDel  = points.reduce((s, p) => s + p.delivered, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-800">Message volume</h2>
        <div className="flex items-center gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-500/70" />
            Sent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/60" />
            Delivered
          </span>
        </div>
      </div>

      {/* Totals */}
      <div className="flex gap-4 mb-4 text-[11px] text-gray-500">
        <span>
          Total sent: <span className="text-gray-700 font-mono">{totalSent.toLocaleString()}</span>
        </span>
        <span>
          Total delivered: <span className="text-gray-700 font-mono">{totalDel.toLocaleString()}</span>
        </span>
      </div>

      {isLoading ? (
        <div className="animate-pulse bg-gray-200 rounded-lg h-40" />
      ) : points.length === 0 ? (
        <div className="h-40 flex items-center justify-center">
          <p className="text-sm text-gray-400">No data</p>
        </div>
      ) : (
        <div className="flex items-end gap-1.5 h-40">
          {points.map((pt, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip on hover */}
              <div className="relative w-full">
                <div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-300 rounded-md px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                >
                  {pt.sent.toLocaleString()} sent
                </div>
              </div>
              {/* Bars */}
              <div className="w-full flex items-end gap-0.5 h-32">
                <div
                  className="flex-1 bg-green-500/70 hover:bg-green-500 rounded-t-sm transition-all duration-150"
                  style={{ height: `${(pt.sent / maxVal) * 100}%` }}
                />
                <div
                  className="flex-1 bg-blue-500/60 hover:bg-blue-500/80 rounded-t-sm transition-all duration-150"
                  style={{ height: `${(pt.delivered / maxVal) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 group-hover:text-gray-700 transition-colors">
                {pt.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}