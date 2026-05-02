import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueBulkMessages } from "@/lib/queue";
import { getTokenPayload} from "@/lib/auth";
import { spawn } from "child_process";

// export async function POST(req: NextRequest) {
//   const payload = await getTokenPayload(req);

//   if (!payload) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const userId = payload.userId; 

//   try {
//     const {
//       campaignName,
//       templateName,
//       templateLanguage,
//       templateParams = [],
//         templateHeaderType = null,        
//   templateHeaderMediaUrl = null,
//   templateComponents = null,   
//       contactIds,
//     } = await req.json();

//     if (!templateName)
//       return NextResponse.json(
//         { error: "templateName required" },
//         { status: 400 }
//       );

//     if (!contactIds || contactIds.length === 0)
//       return NextResponse.json(
//         { error: "No contacts selected" },
//         { status: 400 }
//       );

//     // ✅ Valid opted-in contacts pehle lo
//     const contacts = await prisma.contact.findMany({
//       where: {
//         userId,
//         optIn: true,
//         id: { in: contactIds },
//       },
//       select: { id: true },
//     });

//     if (contacts.length === 0)
//       return NextResponse.json(
//         { error: "No valid opted-in contacts" },
//         { status: 400 }
//       );

//       console.log("🔍 templateComponents received:", JSON.stringify(templateComponents));





//     // ✅ Campaign banao
//     const campaign = await prisma.campaign.create({
//       data: {
//         userId,
//         name: campaignName ||
//           `Template: ${templateName} - ${new Date().toLocaleDateString()}`,
//         message: "",
//         messageType: "TEMPLATE",
//         templateName,
//         templateLanguage,
//         templateParams: JSON.stringify(templateParams),
//         templateHeaderType,          // ✅ Naya
//         templateHeaderMediaUrl,      // ✅ Naya
//         templateComponents: templateComponents    // ✅ Naya
//       ? JSON.stringify(templateComponents)
//       : null,
//         status: "QUEUED",
//       },
//     });

//     console.log("✅ Campaign created, templateComponents saved:", campaign.templateComponents);

//     // ✅ Bulk insert — 1 query mein saare messages
//     await prisma.message.createMany({
//       data: contacts.map((contact) => ({
//         userId :userId ,
//         campaignId: campaign.id,
//         contactId:  contact.id,
//         status:     "PENDING",
//       })),
//     });

//     // ✅ Message IDs lo
//     const messages = await prisma.message.findMany({
//       where:  { campaignId: campaign.id },
//       select: { id: true },
//     });

//     // ✅ Bulk queue mein daalo — ek call
//     const messageIds = messages.map((m) => m.id);
//     await enqueueBulkMessages(messageIds);

//     // ✅ Campaign SENDING
//     await prisma.campaign.update({
//       where: { id: campaign.id },
//       data:  { status: "SENDING" },
//     });

//     // ✅ Worker auto start
//     // const workerProcess = spawn(
//     //   "tsx",
//     //   ["worker.ts"],
//     //   {
//     //     cwd: "/var/www/whatsapp-marketing",
//     //     env: { ...process.env, NODE_ENV: "production" },
//     //     detached: true,
//     //     stdio: "ignore",
//     //   }
//     // );
//     // workerProcess.unref();
//     // console.log(`🚀 Worker started — ${contacts.length} contacts queued`);

//     return NextResponse.json({
//       success: true,
//       campaignId: campaign.id,
//       queued: contacts.length,
//     });

//   } catch (error: any) {
//     console.error("Template send error:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to send template" },
//       { status: 500 }
//     );
//   }
// }





export async function POST(req: NextRequest) {
  const payload = await getTokenPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.userId;

  try {
    const body = await req.json();

    let {
      campaignName,
      templateName,
      templateLanguage,
      templateParams = [],       // Body variables array
      templateButtonParams = [], // Button variables array
      templateHeaderType = null,
      templateHeaderMediaUrl = null,
      templateComponents = null,
      contactIds,
    } = body;

    // 1. Validation
    if (!templateName) {
      return NextResponse.json({ error: "templateName required" }, { status: 400 });
    }

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: "No contacts selected" }, { status: 400 });
    }

    // 2. Fetch Contacts
    const contacts = await prisma.contact.findMany({
      where: {
        userId,
        optIn: true,
        id: { in: contactIds },
      },
      select: { id: true, phone: true },
    });

    if (!contacts.length) {
      return NextResponse.json({ error: "No valid opted-in contacts" }, { status: 400 });
    }

    // 3. Create Campaign
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name: campaignName || `Template: ${templateName} - ${new Date().toLocaleDateString()}`,
        message: "",
        messageType: "TEMPLATE",
        templateName,
        templateLanguage,
        
        // IMPORTANT: Inhe hamesha stringify karke save karein
        templateParams: typeof templateParams === "string" ? templateParams : JSON.stringify(templateParams),
        
        // Button Params ko save karna miss mat karein
        templateButtonParams: typeof templateButtonParams === "string" ? templateButtonParams : JSON.stringify(templateButtonParams),
        
        templateHeaderType,
        templateHeaderMediaUrl,
        
        // Full structure jo worker use karega matching ke liye
        templateComponents: typeof templateComponents === "string" ? templateComponents : JSON.stringify(templateComponents),
        
        status: "QUEUED",
      },
    });

    // 4. Create Messages
    // Note: createMany message ID return nahi karta, isliye niche wala findMany zaroori hai
    await prisma.message.createMany({
      data: contacts.map((c) => ({
        userId,
        campaignId: campaign.id,
        contactId: c.id,
        status: "PENDING",
      })),
    });

    // 5. Enqueue Messages
    const messageIds = await prisma.message.findMany({
      where: { campaignId: campaign.id },
      select: { id: true },
    });

    await enqueueBulkMessages(messageIds.map((m) => m.id));

    // 6. Update Campaign Status
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "SENDING" },
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      queued: contacts.length,
    });

  } catch (error: any) {
    console.error("Template send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send template" },
      { status: 500 }
    );
  }
}