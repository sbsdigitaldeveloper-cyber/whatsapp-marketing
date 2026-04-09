"use client";
import { useState, useMemo } from "react";

type FailedMessage = {
  id: string | number;
  name: string;
  phone: string;
  message?: string;
  error: string;
  campaign: string;
  sentAt?: string;
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS: [string, string][] = [
  ["#EEF2FF", "#4338CA"],
  ["#F0FDF4", "#15803D"],
  ["#FFF7ED", "#C2410C"],
  ["#FDF4FF", "#7E22CE"],
  ["#ECFDF5", "#065F46"],
];

function avatarColor(name: string): [string, string] {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export function FailedMessagesList({
  data,
  isLoading,
}: {
  data: FailedMessage[];
  isLoading: boolean;
}) {
  const [openCampaigns, setOpenCampaigns] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    return data.reduce<Record<string, FailedMessage[]>>((acc, m) => {
      acc[m.campaign] = acc[m.campaign] ? [...acc[m.campaign], m] : [m];
      return acc;
    }, {});
  }, [data]);

  const toggle = (campaign: string) =>
    setOpenCampaigns((prev) => ({ ...prev, [campaign]: !prev[campaign] }));

  const errorCounts = (rows: FailedMessage[]) =>
    rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.error] = (acc[r.error] || 0) + 1;
      return acc;
    }, {});

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-6">
        <span className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
        Loading failed messages...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3 text-lg">✓</div>
        <p className="text-sm font-medium text-gray-700">All messages delivered</p>
        <p className="text-xs text-gray-400 mt-1">No failures in this period</p>
      </div>
    );
  }

  const campaigns = Object.keys(grouped);
  const invalidNums = data.filter((m) => m.error === "Invalid number").length;
  const netErrors = data.filter(
    (m) => m.error === "Network timeout" || m.error === "DLT not registered"
  ).length;
  const optedOut = data.filter((m) => m.error === "Opted out").length;

  return (
    <div className="space-y-2.5">

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-2">
        <div className="bg-red-50 rounded-xl px-4 py-3">
          <div className="text-2xl font-medium text-gray-900">{data.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total failed</div>
          <div className="text-xs text-red-500 font-medium mt-0.5">
            across {campaigns.length} campaigns
          </div>
        </div>
        <div className="bg-red-50 rounded-xl px-4 py-3">
          <div className="text-2xl font-medium text-gray-900">{invalidNums}</div>
          <div className="text-xs text-gray-500 mt-0.5">Invalid numbers</div>
          <div className="text-xs text-red-500 font-medium mt-0.5">
            {Math.round((invalidNums / data.length) * 100)}% of failures
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl px-4 py-3">
          <div className="text-2xl font-medium text-gray-900">{netErrors}</div>
          <div className="text-xs text-gray-500 mt-0.5">Network / DLT errors</div>
          <div className="text-xs text-amber-600 font-medium mt-0.5">
            {Math.round((netErrors / data.length) * 100)}% of failures
          </div>
        </div>
        <div className="bg-green-50 rounded-xl px-4 py-3">
          <div className="text-2xl font-medium text-gray-900">{optedOut}</div>
          <div className="text-xs text-gray-500 mt-0.5">Opted out</div>
          <div className="text-xs text-green-600 font-medium mt-0.5">remove from list</div>
        </div>
      </div>

      {/* Campaign groups */}
      {campaigns.map((campaign) => {
        const rows = grouped[campaign];
        const isOpen = !!openCampaigns[campaign];
        const ec = errorCounts(rows);

        return (
          <div
            key={campaign}
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => toggle(campaign)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900">{campaign}</span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                  {rows.length} failed
                </span>
                {Object.entries(ec).map(([err, count]) => (
                  <span
                    key={err}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200"
                  >
                    {err} ×{count}
                  </span>
                ))}
              </div>
              <span
                className={`text-[10px] text-gray-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {/* Table */}
            {isOpen && (
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 tracking-wide w-[22%]">
                        Contact
                      </th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 tracking-wide w-[30%]">
                        Message
                      </th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 tracking-wide w-[22%]">
                        Error
                      </th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 tracking-wide w-[18%]">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((m) => {
                      const [bg, fg] = avatarColor(m.name);
                      return (
                        <tr
                          key={m.id}
                          className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0"
                                style={{ background: bg, color: fg }}
                              >
                                {getInitials(m.name)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-[12px]">
                                  {m.name}
                                </div>
                                <div className="text-[11px] text-gray-400">{m.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div
                              className="truncate text-gray-500 max-w-[200px]"
                              title={m.message}
                            >
                              {m.message || "—"}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md bg-red-50 text-red-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              {m.error}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[11px] text-gray-400 whitespace-nowrap">
                            {m.sentAt
                              ? new Date(m.sentAt).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
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
      })}
    </div>
  );
}