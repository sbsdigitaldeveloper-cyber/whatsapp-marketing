// app/api/messages/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whatsappQueue } from "@/lib/queue";
import { getTokenPayload } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const payload = await getTokenPayload(req);

  if (!payload || !payload.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.userId;

  try {
    const { campaignId, contactIds } = await req.json();

    if (!campaignId || !contactIds || contactIds.length === 0) {
      return NextResponse.json({ error: "Campaign ID and Contacts are required" }, { status: 400 });
    }

    // 1. WhatsApp Configuration Check
    const config = await prisma.whatsAppConfig.findUnique({
      where: { userId },
      select: { isActive: true }
    });

    if (!config || !config.isActive) {
      return NextResponse.json({ error: "WhatsApp not configured or account inactive" }, { status: 403 });
    }

    // 2. Campaign Ownership Check
    const campaign = await prisma.campaign.findFirst({
      where: { id: Number(campaignId), userId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // 3. Valid Opted-in Contacts Fetch (Strictly for THIS user)
    const contacts = await prisma.contact.findMany({
      where: {
        userId,
        optIn: true,
        id: { in: contactIds },
      },
      select: { id: true },
    });

    if (contacts.length === 0) {
      return NextResponse.json({ error: "No valid opted-in contacts found" }, { status: 400 });
    }

    // 4. BULK INSERT (Performance Fix)
    // Ek hi query mein saare messages create karein
    await prisma.message.createMany({
      data: contacts.map((contact) => ({
        userId: userId,
        campaignId: campaign.id,
        contactId: contact.id,
        status: "PENDING",
      })),
    });

    // 5. Fetch IDs of created messages to add to queue
    const pendingMessages = await prisma.message.findMany({
      where: { 
        campaignId: campaign.id,
        status: "PENDING"
      },
      select: { id: true }
    });

    // 6. Bulk Queueing (BullMQ performance)
    // Jobs ko ek saath queue mein daalein
    const jobData = pendingMessages.map((msg) => ({
      name: "send-message",
      data: { messageId: msg.id },
    }));

    await whatsappQueue.addBulk(jobData);

    // 7. Update Campaign Status
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "QUEUED" },
    });

    return NextResponse.json({
      success: true,
      totalQueued: pendingMessages.length,
    });

  } catch (error: any) {
    console.error(`[BULK_SEND_ERROR] User ${userId}:`, error.message);
    return NextResponse.json(
      { error: error.message || "Failed to queue messages" },
      { status: 500 }
    );
  }
}