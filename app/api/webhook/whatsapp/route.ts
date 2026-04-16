import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadAndSaveMedia } from "@/lib/mediaStorage";

// ✅ Dynamic Read Receipt — Client ke apne token se
async function markMessageAsRead(messageId: string, phoneNumberId: string, accessToken: string) {
  try {
    const version = process.env.WHATSAPP_VERSION || "v21.0";
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
  } catch (err) {
    console.error("❌ Read receipt failed:", err);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "1234567890";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge || "OK");
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    
    if (!value) return NextResponse.json({ received: true });

    // ─────────────────────────────────────────────────────────
    // 1. WhatsApp Business Account ID (WABID) ya Phone ID se User dhoondo
    // ─────────────────────────────────────────────────────────
    const metadata = value.metadata; // Isme display_phone_number aur phone_number_id hota hai
    
    const clientConfig = await prisma.whatsAppConfig.findFirst({
      where: { phoneNumberId: metadata.phone_number_id },
    });

    if (!clientConfig) {
      console.error("⚠️ Webhook received for unknown Phone ID:", metadata.phone_number_id);
      return NextResponse.json({ received: true }); 
    }

    const userId = clientConfig.userId;

    // ── Status Updates ──────────────────────────────────────
    if (value.statuses) {
      for (const s of value.statuses) {
        const updateData: any = { status: s.status.toUpperCase() };

        if (s.status === "delivered") updateData.deliveredAt = new Date(Number(s.timestamp) * 1000);
        if (s.status === "read") updateData.readAt = new Date(Number(s.timestamp) * 1000);
        if (s.status === "failed") updateData.errorReason = s.errors?.[0]?.title || "Failed";

        await prisma.message.updateMany({
          where: { whatsappMsgId: s.id, userId: userId }, // Security: User check
          data: updateData,
        });
      }
    }

    // ── Incoming Messages ───────────────────────────────────
    if (value.messages) {
      for (const msg of value.messages) {
        const fromPhone = msg.from;
        
        // 1. Correct Contact identify karo for THIS user
        let contact = await prisma.contact.findFirst({
          where: { phone: fromPhone, userId: userId },
        });

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              phone: fromPhone,
              name: value.contacts?.[0]?.profile?.name || "New Contact",
              userId: userId,
              optIn: true,
            },
          });
        }

        // 2. Message Type and Media Handling
        let text = "";
        let mediaData: any = {};

        if (msg.type === "text") text = msg.text?.body;
        else if (["image", "video", "document", "audio"].includes(msg.type)) {
          const media = msg[msg.type];
          text = media.caption || "";
          try {
            const savedUrl = await downloadAndSaveMedia(media.id, msg.type);
            mediaData = { mediaId: media.id, mediaType: msg.type, mediaUrl: savedUrl };
          } catch (e) { console.error("Media error", e); }
        }

        // 3. Find Last Campaign (Context ke liye)
        const lastMsg = await prisma.message.findFirst({
          where: { contactId: contact.id, userId: userId },
          orderBy: { createdAt: "desc" },
        });

        // 4. Save Inbound Message
        await prisma.message.create({
          data: {
            userId: userId,
            direction: "INBOUND",
            status: "READ",
            body: text,
            sentAt: new Date(Number(msg.timestamp) * 1000),
            contactId: contact.id,
            campaignId: lastMsg?.campaignId, // Map to existing campaign if any
            ...mediaData
          },
        });

        // 5. Send Blue Tick using CLIENT'S TOKEN
        await markMessageAsRead(msg.id, clientConfig.phoneNumberId, clientConfig.accessToken);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ received: true });
  }
}