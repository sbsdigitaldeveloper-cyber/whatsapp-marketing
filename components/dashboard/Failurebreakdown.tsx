"use client";

export interface FailureItem {
  label: string;
  count: number;
  pct: number;
  color?: string; // optional, fallback to default
}

interface Props {
  data?: FailureItem[];
  isLoading?: boolean;
}

// Default bright colors for light theme
const defaultColors: string[] = ["#ef4444", "#f97316", "#facc15", "#10b981", "#3b82f6", "#8b5cf6"];

export function FailureBreakdown({ data, isLoading }: Props) {
  const items = data ?? [];
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-800">Failure breakdown</h2>
        {total > 0 && (
          <span className="text-[11px] bg-red-100 text-red-600 px-2 py-0.5 rounded-md font-medium border border-red-200">
            {total.toLocaleString()} failed
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-11" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-sm text-gray-400">No failures in this period</p>
        </div>
      ) : (
        <>
          {/* Stacked bar */}
          <div className="flex h-2 rounded-full overflow-hidden gap-px mb-5">
            {items.map((item, i) => {
              const color = item.color ?? defaultColors[i % defaultColors.length];
              return (
                <div
                  key={i}
                  className="h-full transition-all duration-500"
                  style={{ width: `${item.pct}%`, backgroundColor: color }}
                  title={`${item.label}: ${item.pct}%`}
                />
              );
            })}
          </div>

          <div className="flex-1 space-y-2.5">
            {items.map((item, i) => {
              const color = item.color ?? defaultColors[i % defaultColors.length];
              return (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm text-gray-700 truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-500 w-7 text-right">{item.pct}%</span>
                    <span className="text-sm font-medium text-gray-700 font-mono w-12 text-right tabular-nums">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}