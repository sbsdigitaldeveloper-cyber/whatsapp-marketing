import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getMessages } from "@/lib/server/messages";

function pct(num: number, den: number) {
  if (!den) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contacts = await getMessages(Number(userId));
    const allMessages = contacts.flatMap((c) => c.messages);

    console.log("TOTAL:", allMessages.length);

    const outbound = allMessages.filter((m) => m.direction === "OUTBOUND");
    const inbound = allMessages.filter((m) => m.direction === "INBOUND");

    const sent = outbound.length;
    const delivered = outbound.filter((m) =>
      ["DELIVERED", "READ"].includes(m.status)
    ).length;
    const read = outbound.filter((m) => m.status === "READ").length;
    const replied = inbound.length;
    const failed = outbound.filter((m) => m.status === "FAILED").length;

    console.log({ sent, delivered, read, replied, failed });

    const kpis = [
      { label: "Templates sent", value: fmtNum(sent) },
      { label: "Delivery rate", value: `${pct(delivered, sent)}%` },
      { label: "Read rate", value: `${pct(read, sent)}%` },
      { label: "Reply rate", value: `${pct(replied, sent)}%` },
      { label: "Failed messages", value: fmtNum(failed) },
    ];

    const funnel = [
      { label: "Sent", count: sent, pct: 100 },
      { label: "Delivered", count: delivered, pct: pct(delivered, sent) },
      { label: "Read", count: read, pct: pct(read, sent) },
      { label: "Replied", count: replied, pct: pct(replied, sent) },
      { label: "Failed", count: failed, pct: pct(failed, sent) },
    ];

    // failures
    const reasonMap: Record<string, number> = {};
    for (const m of outbound.filter((m) => m.status === "FAILED")) {
      const key = m.errorReason ?? "Unknown";
      reasonMap[key] = (reasonMap[key] ?? 0) + 1;
    }

    const failures = Object.entries(reasonMap).map(([label, count]) => ({
      label,
      count,
      pct: pct(count, failed || 1),
    }));

    // campaigns
    const campaignMap = new Map();

    for (const m of allMessages) {
      if (!m.campaign) continue;

      const c = m.campaign;

      if (!campaignMap.has(c.id)) {
        campaignMap.set(c.id, {
          id: String(c.id),
          name: c.name,
          template: c.templateName ?? c.name,
          sent: 0,
          delivered: 0,
          read: 0,
          replied: 0,
          failed: 0,
        });
      }

      const row = campaignMap.get(c.id);

      if (m.direction === "OUTBOUND") {
        row.sent++;
        if (["DELIVERED", "READ"].includes(m.status)) row.delivered++;
        if (m.status === "READ") row.read++;
        if (m.status === "FAILED") row.failed++;
      } else {
        row.replied++;
      }
    }

    const campaigns = Array.from(campaignMap.values()).map((row: any) => ({
      ...row,
      deliveredPct: pct(row.delivered, row.sent),
      readPct: pct(row.read, row.sent),
      repliedPct: pct(row.replied, row.sent),
    }));

    console.log("CAMPAIGNS:", campaigns.length);

    // volume chart
    const dayMap = new Map<string, { sent: number; delivered: number }>();

    for (const m of outbound) {
      if (!m.sentAt) continue;

      const key = new Date(m.sentAt).toDateString();

      if (!dayMap.has(key)) {
        dayMap.set(key, { sent: 0, delivered: 0 });
      }

      const row = dayMap.get(key)!;
      row.sent++;

      if (["DELIVERED", "READ"].includes(m.status)) {
        row.delivered++;
      }
    }

    const volumeChart = Array.from(dayMap.entries()).map(([date, row]) => ({
      label: new Date(date).toLocaleDateString("en-IN"),
      sent: row.sent,
      delivered: row.delivered,
    }));

    // templates
    const tplMap = new Map();

    for (const m of allMessages) {
      const name = m.campaign?.templateName ?? m.campaign?.name;
      if (!name) continue;

      if (!tplMap.has(name)) {
        tplMap.set(name, { sent: 0, read: 0, replied: 0 });
      }

      const row = tplMap.get(name);

      if (m.direction === "OUTBOUND") {
        row.sent++;
        if (m.status === "READ") row.read++;
      } else {
        row.replied++;
      }
    }

    const topTemplates = Array.from(tplMap.entries()).map(
      ([name, v]: any) => ({
        name,
        sent: v.sent,
        readRate: pct(v.read, v.sent),
        replyRate: pct(v.replied, v.sent),
      })
    );

    return NextResponse.json({
      kpis,
      funnel,
      failures,
      campaigns,
      volumeChart,
      topTemplates,
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}