// app/api/webhook/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadAndSaveMedia } from "@/lib/mediaStorage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("MODE:", mode);
  console.log("TOKEN RECEIVED:", token);
  console.log("ENV TOKEN:", process.env.WHATSAPP_VERIFY_TOKEN);

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "1234567890";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return new Response(challenge || "OK");
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📥 Webhook POST:", JSON.stringify(body, null, 2));

    const value = body?.entry?.[0]?.changes?.[0]?.value;
    if (!value) return NextResponse.json({ received: true });

    // ── Status updates ─────────────────────────────────────────
    if (value.statuses) {
      for (const s of value.statuses) {
        const status = s.status; // "sent" | "delivered" | "read" | "failed"

        const updateData: any = {};

        if (status === "delivered") {
          updateData.status      = "DELIVERED";
          updateData.deliveredAt = new Date(Number(s.timestamp) * 1000);
        } else if (status === "read") {
          updateData.status  = "READ";
          updateData.readAt  = new Date(Number(s.timestamp) * 1000);
        } else if (status === "failed") {
          updateData.status   = "FAILED";
          // updateData.errorMsg = s.errors?.[0]?.title || "Delivery failed";
          updateData.errorReason = s.errors?.[0]?.title || "Delivery failed";
          console.error(`❌ Delivery failed for ${s.id}:`, s.errors);
        } else if (status === "sent") {
          updateData.status = "SENT";
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.message.updateMany({
            where: { whatsappMsgId: s.id },  // 👈 waMessageId — schema se match
            data: updateData,
          });
          console.log(`📬 ${s.id} → ${status.toUpperCase()}`);
        }
      }
    }

    // ── Incoming reply ──────────────────────────────────────────
    if (value.messages) {
      for (const msg of value.messages) {
        const fromPhone = msg.from;
        // const text      = msg.text?.body ?? "";
        const timestamp = new Date(Number(msg.timestamp) * 1000);
         const profileName = value.contacts?.find(
          (c: any) => c.wa_id === fromPhone
        )?.profile?.name ?? null;

        // 👇 Message type detect karo
    let text        = "";
    let mediaId     = null;
    let mediaType   = null; // "image" | "video" | "document" | "audio"
    let mediaName   = null; // filename for documents

    if (msg.type === "text") {
      text = msg.text?.body ?? "";

    } else if (msg.type === "image") {
      mediaId   = msg.image?.id;
      mediaType = "image";
      text      = msg.image?.caption ?? "";

    } else if (msg.type === "video") {
      mediaId   = msg.video?.id;
      mediaType = "video";
      text      = msg.video?.caption ?? "";

    } else if (msg.type === "document") {
      mediaId   = msg.document?.id;
      mediaType = "document";
      mediaName = msg.document?.filename ?? "document";
      text      = msg.document?.caption ?? "";

    } else if (msg.type === "audio") {
      mediaId   = msg.audio?.id;
      mediaType = "audio";

    } else {
      console.log(`Unsupported message type: ${msg.type}`);
      continue;
    }

    // Media URL fetch karo agar media hai
    // let mediaUrl = null;
    // if (mediaId) {
    //   try {
    //     const mediaRes = await fetch(
    //       `https://graph.facebook.com/${process.env.WHATSAPP_VERSION || "v19.0"}/${mediaId}`,
    //       { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
    //     );
    //     const mediaData = await mediaRes.json();
    //     mediaUrl = mediaData?.url ?? null;
    //   } catch {
    //     console.warn("Failed to fetch media URL for:", mediaId);
    //   }
    // }


      // ─────────────────────────────
        // ✅ Download & store media
        // ─────────────────────────────
        let mediaUrl: string | null = null;

        if (mediaId && mediaType) {
          try {
            mediaUrl = await downloadAndSaveMedia(
              mediaId,
              mediaType
            );
            console.log("📁 Media saved:", mediaUrl);
          } catch (err) {
            console.error("❌ Media download failed:", err);
          }
        }

        console.log(`↩ Reply from ${fromPhone}: "${text}"`);

        let contact = await prisma.contact.findFirst({
          where: { phone: { contains: fromPhone } },
        });

        // if (!contact) {
        //   console.warn(`⚠️ Contact not found: ${fromPhone}`);
        //   continue;
        // }

         if (!contact) {
          // 👇 Naya contact automatically create karo
          contact = await prisma.contact.create({
            data: {
              phone:  fromPhone,
              name:   profileName,   // WhatsApp profile name
              userId: 1,             // default user
              optIn:  true,
            },
          });
          console.log(`✅ New contact auto-created: ${fromPhone} (${profileName ?? "no name"})`);
 
        } else if (profileName && !contact.name) {
          // Profile name update karo agar missing tha
          await prisma.contact.update({
            where: { id: contact.id },
            data:  { name: profileName },
          });
        }

        const lastOutbound = await prisma.message.findFirst({
          where: { contactId: contact.id, direction: "OUTBOUND" },
          orderBy: { sentAt: "desc" },
        });

        await prisma.message.create({
          data: {
            status:     "READ",
            direction:  "INBOUND",
            body:       text,
            sentAt:     timestamp,
            campaignId: lastOutbound?.campaignId ?? 1,
            contactId:  contact.id,
    //      mediaId: msg.image?.id ?? msg.video?.id ?? msg.document?.id ?? msg.audio?.id,
    // mediaType: msg.type,
    // mediaUrl: msg.image?.url ?? msg.video?.url ?? msg.document?.url ?? msg.audio?.url,
    // mediaName: msg.document?.filename ?? null,
    mediaId,
            mediaType,
            mediaUrl,   // ✅ permanent saved file
            mediaName,
          },
        });

        console.log(`✅ Reply saved for contact ${contact.id}`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ received: true }); // always 200
  }
}
