// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import jwt from "jsonwebtoken";
// import { getTokenPayload} from "@/lib/auth";

// const JWT_SECRET = process.env.JWT_SECRET!;
// const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
// const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID!;
// const VERSION = process.env.WHATSAPP_VERSION || "v19.0";



// async function sendWhatsApp(phone: string, message: string) {
//   const url = `https://graph.facebook.com/${VERSION}/${PHONE_NUMBER_ID}/messages`;

//   const res = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${WHATSAPP_TOKEN}`,
//     },
//     body: JSON.stringify({
//       messaging_product: "whatsapp",
//       to: phone,
//       type: "text",
//       text: { body: message },
//     }),
//   });

//   return res.json();
// }

// export async function POST(req: NextRequest) {
//  const payload = await getTokenPayload(req);

//   if (!payload) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const userId = payload.userId; 

//   const { campaignId, contactIds } = await req.json();

//   const campaign = await prisma.campaign.findFirst({
//     where: { id: Number(campaignId), userId },
//   });

//   if (!campaign)
//     return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

//   await prisma.campaign.update({
//     where: { id: campaign.id },
//     data: { status: "SENDING" },
//   });

//   let sent = 0;
//   let failed = 0;

//   for (const contactId of contactIds) {
//     const contact = await prisma.contact.findFirst({
//       where: { id: Number(contactId), userId },
//     });

//     if (!contact) continue;

//     const msg = await prisma.message.create({
//       data: {
//         userId :userId,
//         campaignId: campaign.id,
//         contactId: contact.id,
//         status: "PENDING",
//       },
//     });

//     try {
//       await sendWhatsApp(contact.phone, campaign.message);

//       await prisma.message.update({
//         where: { id: msg.id },
//         data: {
//           status: "SENT",
//           sentAt: new Date(),
//         },
//       });

//       sent++;
//     } catch {
//       await prisma.message.update({
//         where: { id: msg.id },
//         data: { status: "FAILED" },
//       });

//       failed++;
//     }
//   }

//   await prisma.campaign.update({
//     where: { id: campaign.id },
//     data: { status: "COMPLETED" },
//   });

//   return NextResponse.json({
//     success: true,
//     sent,
//     failed,
//   });
// }




import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPayload } from "@/lib/auth";
import { enqueueBulkMessages } from "@/lib/queue"; // Aapka banaya hua queue helper

export async function POST(req: NextRequest) {
  const payload = await getTokenPayload(req);

  if (!payload || !payload.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.userId;

  try {
    const { campaignId, contactIds } = await req.json();

    if (!campaignId || !contactIds || !Array.isArray(contactIds)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Campaign aur User Config check karein (Security)
    const campaign = await prisma.campaign.findFirst({
      where: { id: Number(campaignId), userId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const userConfig = await prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!userConfig || !userConfig.isActive) {
      return NextResponse.json({ error: "WhatsApp API not configured" }, { status: 400 });
    }

    // 2. Campaign Status update karein
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "QUEUED" }, // Ab ye queued hai, sending nahi
    });

    // 3. Database mein Messages "PENDING" status ke saath create karein
    // Isse humein Message IDs mil jayengi jo hum Queue mein bhejenge
    const messageData = contactIds.map((contactId: number) => ({
      userId: userId,
      campaignId: campaign.id,
      contactId: Number(contactId),
      status: "PENDING",
    }));

    // Bulk Create: Taaki DB par load na pade
    await prisma.message.createMany({
      data: messageData,
    
    });

    // 4. Ab unhi messages ki IDs fetch karein jo abhi create hue
    const createdMessages = await prisma.message.findMany({
      where: { 
        campaignId: campaign.id, 
        status: "PENDING" 
      },
      select: { id: true },
    });

    const messageIds = createdMessages.map((m) => m.id);

    // 5. 🔥 ASYNC MAGIC: BullMQ Queue mein daal dein
    // Ye function instant return karega, worker background mein kaam karega
    await enqueueBulkMessages(messageIds);

    return NextResponse.json({
      success: true,
      message: `${messageIds.length} messages added to queue`,
      campaignId: campaign.id
    });

  } catch (error: any) {
    console.error("Campaign Queue Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start campaign" },
      { status: 500 }
    );
  }
}