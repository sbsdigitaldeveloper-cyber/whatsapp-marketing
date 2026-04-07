import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth"; // ✅ only this import needed

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req); // ✅ await added
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id: Number(id) },
    });

    // ✅ userId directly available — no need to decode token manually
    if (!campaign || campaign.userId !== userId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [total, sent, failed, pending] = await Promise.all([
      prisma.message.count({ where: { campaignId: campaign.id } }),
      prisma.message.count({ where: { campaignId: campaign.id, status: "SENT" } }),
      prisma.message.count({ where: { campaignId: campaign.id, status: "FAILED" } }),
      prisma.message.count({ where: { campaignId: campaign.id, status: "PENDING" } }),
    ]);

    return NextResponse.json({ total, sent, failed, pending });

  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}