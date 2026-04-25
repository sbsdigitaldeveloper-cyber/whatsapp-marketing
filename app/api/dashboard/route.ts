// import { NextRequest, NextResponse } from "next/server";
// import { getTokenPayload } from "@/lib/auth";
// import { getMessages } from "@/lib/server/messages";
// import { prisma } from "@/lib/prisma"; // Prisma import karein user status check ke liye

// // Helper functions (Aapke original functions)
// function pct(num: number, den: number) {
//   if (!den) return 0;
//   return Math.round((num / den) * 1000) / 10;
// }

// function fmtNum(n: number) {
//   if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
//   if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
//   return String(n);
// }

// export async function GET(req: NextRequest) {
//   try {
//     const payload = await getTokenPayload(req);

//     if (!payload) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const userId = Number(payload.userId);

//     // 🛡️ CHECK USER STATUS IN DATABASE
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { status: true }
//     });

//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     // 🛑 AGAR USER PENDING YA SUSPENDED HAI TOH DATA NA BHEJEIN
//     if (user.status === "PENDING" || user.status === "SUSPENDED") {
//       return NextResponse.json({ 
//         userStatus: user.status, // Frontend isse handle karega
//         kpis: [], 
//         funnel: [],
//         campaigns: [],
//         volumeChart: [],
//         failedList: [] 
//       });
//     }

//     // ==========================================
//     // ✅ DATA FETCHING (Only for ACTIVE users)
//     // ==========================================
//     const contacts = await getMessages(userId);
//     const allMessages = contacts.flatMap((c) => c.messages);

//     const outbound = allMessages.filter((m) => m.direction === "OUTBOUND");
//     const inbound = allMessages.filter((m) => m.direction === "INBOUND");

//     const sent = outbound.length;
//     const delivered = outbound.filter((m) => ["DELIVERED", "READ"].includes(m.status)).length;
//     const read = outbound.filter((m) => m.status === "READ").length;
//     const replied = inbound.length;
//     const failed = outbound.filter((m) => m.status === "FAILED").length;

//     // ... (Baki aapka poora aggregation logic yahan aayega) ...
//     // Funnel, KPIs, reasonMap, campaigns calculations same rahenge

//     // ✅ FINAL RESPONSE WITH userStatus: "ACTIVE"
//     return NextResponse.json({
//       userStatus: "ACTIVE", // Success indicator
//       kpis: [
//         { label: "Templates sent", value: fmtNum(sent) },
//         { label: "Delivery rate", value: `${pct(delivered, sent)}%` },
//         { label: "Read rate", value: `${pct(read, sent)}%` },
//         { label: "Reply rate", value: `${pct(replied, sent)}%` },
//         { label: "Failed messages", value: fmtNum(failed) },
//       ],
//       funnel: [
//         { label: "Sent", count: sent, pct: 100 },
//         { label: "Delivered", count: delivered, pct: pct(delivered, sent) },
//         { label: "Read", count: read, pct: pct(read, sent) },
//         { label: "Replied", count: replied, pct: pct(replied, sent) },
//         { label: "Failed", count: failed, pct: pct(failed, sent) },
//       ],
//       // ... baki saare objects (failures, campaigns, volumeChart, etc.)
//       failedList: [], // Map your data here
//       failedContacts: [] // Map your data here
//     });

//   } catch (err) {
//     console.error("DASHBOARD ERROR:", err);
//     return NextResponse.json({ error: "Internal error" }, { status: 500 });
//   }
// }









import { NextRequest, NextResponse } from "next/server";
import { getTokenPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Helpers ────────────────────────────────────────────────────────────────

function pct(num: number, den: number) {
  if (!den) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type CampaignRow = {
  id: string;
  name: string;
  template: string;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
};

type TemplateRow = { sent: number; read: number; replied: number };

// ─── Route ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const payload = await getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(payload.userId);

    // ── 1. Auth + data in a single parallel query ──────────────────────────
    const [user, contacts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { status: true },
      }),
      // Pull only the fields we actually use — avoids over-fetching
      prisma.contact.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          phone: true,
          messages: {
            select: {
              id: true,
              direction: true,
              status: true,
              body: true,
              sentAt: true,
              errorReason: true,
              campaign: {
                select: { id: true, name: true, templateName: true },
              },
            },
          },
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.status === "PENDING" || user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          userStatus: user.status,
          kpis: [],
          funnel: [],
          failures: [],
          campaigns: [],
          volumeChart: [],
          topTemplates: [],
          failedList: [],
          failedContacts: [],
        },
        { status: 403 }
      );
    }

    // ── 2. Single-pass aggregation ─────────────────────────────────────────
    //    Walk every message exactly once and update all accumulators together.

    let sent = 0,
      delivered = 0,
      read = 0,
      replied = 0,
      failed = 0;

    const reasonMap = new Map<string, number>();
    const campaignMap = new Map<number, CampaignRow>();
    const tplMap = new Map<string, TemplateRow>();
    const dayMap = new Map<string, { sent: number; delivered: number }>();
    const failedList: {
      id: number;
      name: string;
      phone: string | undefined;
      campaign: string | undefined;
      template: string | undefined;
      error: string;
      message: string | null;
      sentAt: Date | null;
    }[] = [];
    const contactFailures = new Map<string, { name: string; phone: string; failures: number }>();

    for (const contact of contacts) {
      for (const m of contact.messages) {
        const isOut = m.direction === "OUTBOUND";
        const camp = m.campaign;

        // ── KPI counters ──────────────────────────────────────────────────
        if (isOut) {
          sent++;
          const isDelivered = m.status === "DELIVERED" || m.status === "READ";
          if (isDelivered) delivered++;
          if (m.status === "READ") read++;
          if (m.status === "FAILED") {
            failed++;

            // Failure reasons
            const reason = m.errorReason ?? "Unknown";
            reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);

            // Failed messages list
            failedList.push({
              id: m.id,
              name: contact.name ?? "Unknown",
              phone: contact.phone ?? undefined,
              campaign: camp?.name,
              template: camp?.templateName ?? undefined,
              error: reason,
              message: m.body,
              sentAt: m.sentAt,
            });

            // Failed contacts dedup
            if (contact.phone) {
              const existing = contactFailures.get(contact.phone);
              if (existing) {
                existing.failures++;
              } else {
                contactFailures.set(contact.phone, {
                  name: contact.name ?? "Unknown",
                  phone: contact.phone,
                  failures: 1,
                });
              }
            }
          }
        } else {
          replied++;
        }

        // ── Campaign map ──────────────────────────────────────────────────
        if (camp) {
          let row = campaignMap.get(camp.id);
          if (!row) {
            row = {
              id: String(camp.id),
              name: camp.name,
              template: camp.templateName ?? camp.name,
              sent: 0,
              delivered: 0,
              read: 0,
              replied: 0,
              failed: 0,
            };
            campaignMap.set(camp.id, row);
          }
          if (isOut) {
            row.sent++;
            if (m.status === "DELIVERED" || m.status === "READ") row.delivered++;
            if (m.status === "READ") row.read++;
            if (m.status === "FAILED") row.failed++;
          } else {
            row.replied++;
          }
        }

        // ── Template map ──────────────────────────────────────────────────
        const tplName = camp?.templateName ?? camp?.name;
        if (tplName) {
          let trow = tplMap.get(tplName);
          if (!trow) {
            trow = { sent: 0, read: 0, replied: 0 };
            tplMap.set(tplName, trow);
          }
          if (isOut) {
            trow.sent++;
            if (m.status === "READ") trow.read++;
          } else {
            trow.replied++;
          }
        }

        // ── Volume chart (outbound only) ──────────────────────────────────
        if (isOut && m.sentAt) {
          const key = m.sentAt.toDateString();
          let drow = dayMap.get(key);
          if (!drow) {
            drow = { sent: 0, delivered: 0 };
            dayMap.set(key, drow);
          }
          drow.sent++;
          if (m.status === "DELIVERED" || m.status === "READ") drow.delivered++;
        }
      }
    }

    // ── 3. Shape final response ────────────────────────────────────────────

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

    const failures = Array.from(reasonMap.entries()).map(([label, count]) => ({
      label,
      count,
      pct: pct(count, failed || 1),
    }));

    const campaigns = Array.from(campaignMap.values()).map((row) => ({
      ...row,
      deliveredPct: pct(row.delivered, row.sent),
      readPct: pct(row.read, row.sent),
      repliedPct: pct(row.replied, row.sent),
    }));

    const volumeChart = Array.from(dayMap.entries()).map(([date, row]) => ({
      label: new Date(date).toLocaleDateString("en-IN"),
      sent: row.sent,
      delivered: row.delivered,
    }));

    const topTemplates = Array.from(tplMap.entries()).map(([name, v]) => ({
      name,
      sent: v.sent,
      readRate: pct(v.read, v.sent),
      replyRate: pct(v.replied, v.sent),
    }));

    // Sort failed list newest-first (done here, not during iteration)
    failedList.sort(
      (a, b) =>
        new Date(b.sentAt ?? 0).getTime() - new Date(a.sentAt ?? 0).getTime()
    );

    return NextResponse.json({
      kpis,
      funnel,
      failures,
      campaigns,
      volumeChart,
      topTemplates,
      failedList,
      failedContacts: Array.from(contactFailures.values()),
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}