"use client";

export interface FunnelStep {
  label: string;
  count: number;
  pct: number;
  color?: string;      // optional bar background color
  textColor?: string;  // optional bar text color
}

interface Props {
  data?: FunnelStep[];
  isLoading?: boolean;
}

function Skeleton() {
  return <div className="animate-pulse bg-gray-200 rounded-lg h-9" />;
}

// Default bright colors for light theme
const defaultColors: Record<string, { bg: string; text: string }> = {
  Sent:    { bg: "#3b82f6", text: "#ffffff" }, // Blue
  Read:    { bg: "#10b981", text: "#ffffff" }, // Green
  Replied: { bg: "#8b5cf6", text: "#ffffff" }, // Purple
  Failed:  { bg: "#ef4444", text: "#ffffff" }, // Red
};

export function DeliveryFunnel({ data, isLoading }: Props) {
  const steps = data ?? [];

  const sent    = steps.find((s) => s.label === "Sent")?.count    ?? 0;
  const read    = steps.find((s) => s.label === "Read")?.count    ?? 0;
  const replied = steps.find((s) => s.label === "Replied")?.count ?? 0;
  const failed  = steps.find((s) => s.label === "Failed")?.pct    ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-800">Delivery funnel</h2>
        <span className="text-xs text-gray-500">
          {sent > 0 ? `${sent.toLocaleString()} total sent` : "No data"}
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-2.5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)
          : steps.map((step, i) => {
              const color = step.color ?? defaultColors[step.label]?.bg ?? "#6b7280"; // gray fallback
              const textColor = step.textColor ?? defaultColors[step.label]?.text ?? "#ffffff";

              return (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-16 shrink-0">{step.label}</span>
                    <div className="flex-1 bg-gray-200 rounded-md h-9 overflow-hidden">
                      <div
                        className="h-full rounded-md flex items-center px-3 transition-all duration-700"
                        style={{
                          width: `${Math.max(step.pct, step.pct > 0 ? 8 : 0)}%`,
                          backgroundColor: color,
                        }}
                      >
                        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: textColor }}>
                          {step.pct}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs w-16 text-right shrink-0 font-mono tabular-nums text-gray-800">
                      {step.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Summary row */}
      {!isLoading && steps.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-200 grid grid-cols-3 gap-2">
          {[
            { label: "Sent → Read",   value: sent > 0 ? `${Math.round((read / sent) * 100)}%`    : "—", color: "text-gray-700" },
            { label: "Read → Reply",  value: read > 0 ? `${Math.round((replied / read) * 100)}%` : "—", color: "text-green-700" },
            { label: "Failure rate",  value: `${failed}%`,                                               color: "text-red-700"  },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-[11px] text-gray-500">{s.label}</p>
              <p className={`text-sm font-semibold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}