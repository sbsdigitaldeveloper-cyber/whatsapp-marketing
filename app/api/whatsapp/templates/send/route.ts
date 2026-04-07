// app/api/whatsapp/templates/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whatsappQueue } from "@/lib/queue";
import jwt from "jsonwebtoken";
import { getUserId } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// function getUserId(req: NextRequest): number | null {
//   const auth = req.headers.get("authorization");
//   if (!auth) return null;
//   try {
//     const token = auth.replace("Bearer ", "");
//     const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
//     return decoded.userId;
//   } catch {
//     return null;
//   }
// }

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      templateName,
      templateLanguage = "en",
      templateParams = [],
      contactIds,
    } = await req.json();

    if (!templateName)
      return NextResponse.json({ error: "templateName required" }, { status: 400 });

    if (!contactIds || contactIds.length === 0)
      return NextResponse.json({ error: "No contacts selected" }, { status: 400 });

    // Auto-create a campaign for this template send
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name: `Template: ${templateName} - ${new Date().toLocaleDateString()}`,
        message: "",
        messageType: "TEMPLATE",
        templateName,
        templateLanguage,
        templateParams: JSON.stringify(templateParams), // 👈 stringify for SQL Server
        status: "QUEUED",
      },
    });

    const contacts = await prisma.contact.findMany({
      where: {
        userId,
        optIn: true,
        id: { in: contactIds },
      },
    });

    if (contacts.length === 0) {
      // Clean up campaign if no valid contacts
      await prisma.campaign.delete({ where: { id: campaign.id } });
      return NextResponse.json({ error: "No valid opted-in contacts" }, { status: 400 });
    }

    // Queue a job per contact
    await Promise.all(
      contacts.map(async (contact) => {
        const msg = await prisma.message.create({
          data: {
            campaignId: campaign.id,
            contactId: contact.id,
            status: "DRAFT",
          },
        });

        return whatsappQueue.add("send-message", { messageId: msg.id });
      })
    );

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