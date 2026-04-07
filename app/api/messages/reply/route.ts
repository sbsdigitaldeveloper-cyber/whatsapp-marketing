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
// ✅ Updated — agents can only reply to their assigned contacts

// app/api/messages/reply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPayload } from "@/lib/auth";

const WHATSAPP_TOKEN   = process.env.WHATSAPP_TOKEN!;
const PHONE_NUMBER_ID  = process.env.PHONE_NUMBER_ID!;
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
        { error: "contactId and message required" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.findFirst({
      where: { id: Number(contactId), userId },
    });

    if (!contact)
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    // 🔒 Agent restriction — sirf apna assigned contact
    if (role === "agent") {
      if (contact.assignedAgentId !== agentId) {
        return NextResponse.json(
          { error: "You are not assigned to this contact" },
          { status: 403 }
        );
      }
    }

    if (!contact.optIn) {
      return NextResponse.json(
        { error: "Contact has opted out" },
        { status: 400 }
      );
    }

    const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${PHONE_NUMBER_ID}/messages`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to:   contact.phone,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "WhatsApp API failed");

    const whatsappMsgId = data?.messages?.[0]?.id ?? null;

    const lastMessage = await prisma.message.findFirst({
      where:   { contactId: contact.id, direction: "OUTBOUND" },
      orderBy: { sentAt: "desc" },
    });

    await prisma.message.create({
      data: {
        status:        "SENT",
        direction:     "OUTBOUND",
        body:          message,
        sentAt:        new Date(),
        whatsappMsgId,
        campaignId:    lastMessage?.campaignId ?? 1,
        contactId:     contact.id,
      },
    });

    console.log(`✅ Reply sent | by: ${role} ${agentId ?? userId} | to: ${contact.phone}`);

    return NextResponse.json({ success: true, whatsappMsgId });

  } catch (error: any) {
    console.error("Reply error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send reply" },
      { status: 500 }
    );
  }
}