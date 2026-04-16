// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getUserId } from "@/lib/auth"; // ✅

// export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//   const userId = await getUserId(req); // ✅
//   if (!userId)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   try {
//     const { id } = await params;

//     const campaign = await prisma.campaign.findUnique({
//       where: { id: Number(id) },
//     });

//     if (!campaign || campaign.userId !== userId) // ✅
//       return NextResponse.json({ error: "Not found" }, { status: 404 });

//     return NextResponse.json({ status: campaign.status });

//   } catch {
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }



import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPayload } from "@/lib/auth"; // Aapke pichle code ke hisaab se use kar raha hoon

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getTokenPayload(req);
  if (!payload || !payload.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.userId;

  try {
    const { id } = await params;
    const campaignId = Number(id);

    // 1. Sirf Campaign detail fetch karein (bina saare messages ke, memory bachane ke liye)
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.userId !== userId) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // 2. Database level par stats calculate karein (Faster than array.filter)
    const messageStats = await prisma.message.groupBy({
      by: ['status'],
      where: { campaignId: campaignId },
      _count: {
        status: true
      }
    });

    // 3. Stats ko readable format mein convert karein
    const stats = {
      total: 0,
      pending: 0,
      queued: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    };

    messageStats.forEach((item) => {
      const status = item.status.toLowerCase() as keyof typeof stats;
      if (stats.hasOwnProperty(status)) {
        stats[status] = item._count.status;
      }
      stats.total += item._count.status;
    });

    // 4. (Optional) Sirf recent 10 messages dikhane ke liye (taaki UI hang na ho)
    const recentMessages = await prisma.message.findMany({
      where: { campaignId: campaignId },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
      take: 50, // Pehle 50 dikhayein baaki pagination se karein
    });

    return NextResponse.json({
      ...campaign,
      stats,
      recentMessages
    });

  } catch (err: any) {
    console.error("Fetch Campaign Stats Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}