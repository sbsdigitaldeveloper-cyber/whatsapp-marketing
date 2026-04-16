import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPayload, } from "@/lib/auth"; // ✅ import shared auth helper

export async function GET(req: NextRequest) {
  try {
    // ── 1. Auth: get current user ─────────────────────────────────────────
    // const userId = await getUserId(req); // ✅ await added (async now)

     const payload = await getTokenPayload(req);
    
      if (!payload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    
      const userId = payload.userId; 

   

    // ── 2. Optional filters from query params ─────────────────────────────
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const campaignId = searchParams.get("campaignId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // ── 3. Fetch contacts belonging to this user, each with their messages ─
    const contacts = await prisma.contact.findMany({
      where: {
        userId: Number(userId),
        ...(contactId ? { id: Number(contactId) } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        messages: {
          where: {
            ...(campaignId ? { campaignId: Number(campaignId) } : {}),
            ...(status ? { status } : {}),
          },
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                messageType: true,
                message: true,
                templateName: true,
                templateParams: true,
                status: true,
              },
            },
          },
          orderBy: { sentAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // ── 4. Shape the response ─────────────────────────────────────────────
    const result = contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      optIn: contact.optIn,
      createdAt: contact.createdAt,
      messageCount: contact.messages.length,
      lastMessage: contact.messages[contact.messages.length - 1] ?? null,
      messages: contact.messages.map((msg) => ({
        id:          msg.id,
        status:      msg.status,
        direction:   msg.direction,
        body:        msg.body,
        sentAt:      msg.sentAt,
        deliveredAt: msg.deliveredAt,
        readAt:      msg.readAt,
        retryCount:  msg.retryCount,
        errorReason: msg.errorReason,
        campaign:    msg.campaign,
        mediaId:     msg.mediaId,
        mediaType:   msg.mediaType,
        mediaUrl:    msg.mediaUrl,
        mediaName:   msg.mediaName,
      })),
    }));

    // ── 5. Summary stats ──────────────────────────────────────────────────
    const stats = {
      totalContacts: result.length,
      totalMessages: result.reduce((sum, c) => sum + c.messageCount, 0),
      byStatus: result
        .flatMap((c) => c.messages)
        .reduce<Record<string, number>>((acc, msg) => {
          acc[msg.status] = (acc[msg.status] ?? 0) + 1;
          return acc;
        }, {}),
    };

    return NextResponse.json({ contacts: result, stats });

  } catch (err) {
    console.error("[GET /api/messages]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}