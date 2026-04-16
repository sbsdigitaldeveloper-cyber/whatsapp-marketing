import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPayload } from "@/lib/auth";


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const payload = await getTokenPayload(req);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    const userId = payload.userId;

  try {
    const { id } = await params;
    const campaignId = Number(id);

    // 1. Pehle check karein ki campaign user ka hi hai
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { userId: true } // Sirf userId mangwayein efficiency ke liye
    });

    if (!campaign || campaign.userId !== userId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 2. 🔥 Ek hi query mein saare status count karein (Optimized)
    const counts = await prisma.message.groupBy({
      by: ['status'],
      where: { campaignId: campaignId },
      _count: {
        _all: true
      }
    });

    // 3. Results ko format karein
    const stats = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      queued: 0, // BullMQ use kar rahe hain toh ye status bhi aayega
    };

    counts.forEach((item) => {
      const status = item.status.toLowerCase() as keyof typeof stats;
      const count = item._count._all;
      
      if (Object.prototype.hasOwnProperty.call(stats, status)) {
        stats[status] = count;
      }
      stats.total += count;
    });

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Stats Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}