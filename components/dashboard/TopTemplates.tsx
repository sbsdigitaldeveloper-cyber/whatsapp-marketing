"use client";

export interface TemplateRow {
  name: string;
  sent: number;
  readRate: number;
  replyRate: number;
}

interface Props {
  data?: TemplateRow[];
  isLoading?: boolean;
}

export function TopTemplates({ data, isLoading }: Props) {
  const templates = data ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-800">Top templates</h2>
        <span className="text-[11px] text-gray-500">by read rate</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-10" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">No template data</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] text-gray-400 font-mono w-4 shrink-0">#{i + 1}</span>
                  <span
                    className="text-[11px] text-gray-600 font-mono truncate"
                    title={t.name}
                  >
                    {t.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[11px] font-semibold text-green-600">{t.readRate}%</span>
                  <span className="text-gray-300 text-[10px]">·</span>
                  <span className="text-[11px] text-blue-500">{t.replyRate}%</span>
                </div>
              </div>
              {/* Dual-layer bar: read rate (green) over reply rate (blue) */}
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden relative">
                <div
                  className="absolute top-0 left-0 h-full bg-blue-400/60 rounded-full transition-all duration-500"
                  style={{ width: `${t.replyRate}%` }}
                />
                <div
                  className="absolute top-0 left-0 h-full bg-green-500/60 rounded-full transition-all duration-700"
                  style={{ width: `${t.readRate}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1 font-mono">
                {t.sent.toLocaleString()} sent
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 pt-3 border-t border-gray-200 flex justify-between text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-green-500/60" /> Read rate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-blue-400/60" /> Reply rate
        </span>
      </div>
    </div>
  );
}