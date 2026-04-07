// app/api/messages/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whatsappQueue } from "@/lib/queue";
import { getUserId } from "@/lib/auth"; // ✅

export async function POST(req: NextRequest) {
  const userId = await getUserId(req); // ✅ await added
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { campaignId, contactIds } = await req.json();

    if (!campaignId)
      return NextResponse.json({ error: "campaignId required" }, { status: 400 });

    if (!contactIds || contactIds.length === 0)
      return NextResponse.json({ error: "No contacts selected" }, { status: 400 });

    const campaign = await prisma.campaign.findUnique({
      where: { id: Number(campaignId) },
    });

    if (!campaign || campaign.userId !== userId)
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const contacts = await prisma.contact.findMany({
      where: {
        userId,
        optIn: true,
        id: { in: contactIds },
      },
    });

    if (contacts.length === 0)
      return NextResponse.json({ error: "No valid contacts found" }, { status: 400 });

    const jobs = await Promise.all(
      contacts.map(async (contact) => {
        const msg = await prisma.message.create({
          data: {
            campaignId: campaign.id,
            contactId:  contact.id,
            status:     "PENDING",
          },
        });

        return whatsappQueue.add("send-message", {
          messageId: msg.id,
        });
      })
    );

    await prisma.campaign.update({
      where: { id: campaign.id },
      data:  { status: "QUEUED" },
    });

    return NextResponse.json({
      success: true,
      queued:  jobs.length,
      total:   contacts.length,
    });

  } catch (error: any) {
    console.error("Bulk send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to queue messages" },
      { status: 500 }
    );
  }
}