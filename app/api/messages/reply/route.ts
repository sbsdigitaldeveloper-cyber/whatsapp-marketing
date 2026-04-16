// // app/api/messages/reply/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getUserId } from "@/lib/auth"; // ✅

// const WHATSAPP_TOKEN   = process.env.WHATSAPP_TOKEN!;
// const PHONE_NUMBER_ID  = process.env.PHONE_NUMBER_ID!;
// const WHATSAPP_VERSION = process.env.WHATSAPP_VERSION || "v19.0";

// export async function POST(req: NextRequest) {
//   const userId = await getUserId(req); // ✅ await added
//   if (!userId)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   try {
//     const { contactId, message } = await req.json();

//     if (!contactId || !message?.trim()) {
//       return NextResponse.json(
//         { error: "contactId and message required" },
//         { status: 400 }
//       );
//     }

//     const contact = await prisma.contact.findFirst({
//       where: { id: Number(contactId), userId },
//     });

//     if (!contact) {
//       return NextResponse.json({ error: "Contact not found" }, { status: 404 });
//     }

//     if (!contact.optIn) {
//       return NextResponse.json(
//         { error: "Contact has opted out" },
//         { status: 400 }
//       );
//     }

//     // ✅ WhatsApp API call — Authorization header here is for WhatsApp, not our app
//     const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${PHONE_NUMBER_ID}/messages`;

//     const res = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${WHATSAPP_TOKEN}`, // ✅ this stays — it's for WhatsApp API
//       },
//       body: JSON.stringify({
//         messaging_product: "whatsapp",
//         to:   contact.phone,
//         type: "text",
//         text: { body: message },
//       }),
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       throw new Error(data.error?.message || "WhatsApp API failed");
//     }

//     const whatsappMsgId = data?.messages?.[0]?.id ?? null;

//     const lastMessage = await prisma.message.findFirst({
//       where:   { contactId: contact.id, direction: "OUTBOUND" },
//       orderBy: { sentAt: "desc" },
//     });

//     await prisma.message.create({
//       data: {
//         status:        "SENT",
//         direction:     "OUTBOUND",
//         body:          message,
//         sentAt:        new Date(),
//         whatsappMsgId,
//         campaignId:    lastMessage?.campaignId ?? 1,
//         contactId:     contact.id,
//       },
//     });

//     console.log(`✅ Reply sent to ${contact.phone} | wamid: ${whatsappMsgId}`);

//     return NextResponse.json({ success: true, whatsappMsgId });

//   } catch (error: any) {
//     console.error("Reply error:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to send reply" },
//       { status: 500 }
//     );
//   }
// }






// app/api/messages/reply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPayload } from "@/lib/auth";

const WHATSAPP_VERSION = process.env.WHATSAPP_VERSION || "v19.0";

export async function POST(req: NextRequest) {
  const auth = await getTokenPayload(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, agentId, role } = auth;

  try {
    const { contactId, message } = await req.json();

    if (!contactId || !message?.trim()) {
      return NextResponse.json(
        { error: "contactId and message are required" },
        { status: 400 }
      );
    }

    // ── 1. Verify contact belongs to this user ──────────────────────────────
    const contact = await prisma.contact.findFirst({
      where: {
        id:        Number(contactId),
        userId,
        user: { isDeleted: false },   // never message on behalf of deleted user
      },
    });

    if (!contact)
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    // ── 2. Agent restriction — only assigned contact ────────────────────────
    if (role === "agent") {
      if (contact.assignedAgentId !== agentId) {
        return NextResponse.json(
          { error: "You are not assigned to this contact" },
          { status: 403 }
        );
      }
    }

    // ── 3. Opt-in check ─────────────────────────────────────────────────────
    if (!contact.optIn) {
      return NextResponse.json(
        { error: "Contact has opted out" },
        { status: 400 }
      );
    }

    // ── 4. Fetch THIS client's own WhatsApp keys from DB ────────────────────
    // FIX: was using global env vars — breaks multi-tenant
    const waConfig = await prisma.whatsAppConfig.findUnique({
      where:  { userId },
      select: {
        phoneNumberId: true,
        accessToken:   true,   // server-side only, never sent to browser
        isActive:      true,
      },
    });

    if (!waConfig) {
      return NextResponse.json(
        { error: "WhatsApp not configured for your account. Contact admin." },
        { status: 403 }
      );
    }

    if (!waConfig.isActive) {
      return NextResponse.json(
        { error: "WhatsApp account is inactive. Contact admin." },
        { status: 403 }
      );
    }

    // ── 5. Send via Meta API using client's own keys ────────────────────────
    const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${waConfig.phoneNumberId}/messages`;

    const waRes = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${waConfig.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to:   contact.phone,
        type: "text",
        text: { body: message.trim() },
      }),
    });

    const waData = await waRes.json();

    // ── 6. Handle WhatsApp API failure — still save to DB ───────────────────
    if (!waRes.ok) {
      await prisma.message.create({
        data: {
          userId,
          contactId:   contact.id,
          campaignId:  null,          // FIX: was hardcoded to 1 — use null for replies
          status:      "FAILED",
          direction:   "OUTBOUND",
          body:        message.trim(),
          errorReason: waData?.error?.message ?? "WhatsApp API error",
        },
      });

      return NextResponse.json(
        { error: waData?.error?.message ?? "WhatsApp API failed" },
        { status: 400 }
      );
    }

    const whatsappMsgId = waData?.messages?.[0]?.id ?? null;

    // ── 7. Save successful message ──────────────────────────────────────────
    // FIX: removed hardcoded campaignId: 1 — replies are not part of a campaign
    const saved = await prisma.message.create({
      data: {
        userId,
        contactId:     contact.id,
        campaignId:    null,          // FIX: reply = no campaign
        status:        "SENT",
        direction:     "OUTBOUND",
        body:          message.trim(),
        whatsappMsgId,
        sentAt:        new Date(),
      },
    });

    console.log(
      `✅ Reply sent | by: ${role} ${agentId ?? userId} | to: ${contact.phone} | msgId: ${whatsappMsgId}`
    );

    return NextResponse.json({
      success:       true,
      messageId:     saved.id,
      whatsappMsgId,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send reply";
    console.error("Reply error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}