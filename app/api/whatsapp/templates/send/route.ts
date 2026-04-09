import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueBulkMessages } from "@/lib/queue";  // ✅ bulk use karo
import { getUserId } from "@/lib/auth";

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

    // Campaign banao
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name: `Template: ${templateName} - ${new Date().toLocaleDateString()}`,
        message: "",
        messageType: "TEMPLATE",
        templateName,
        templateLanguage,
        templateParams: JSON.stringify(templateParams),
        status: "QUEUED",
      },
    });

    // Valid opted-in contacts lo
    const contacts = await prisma.contact.findMany({
      where: {
        userId,
        optIn: true,
        id: { in: contactIds },
      },
    });

    if (contacts.length === 0) {
      await prisma.campaign.delete({ where: { id: campaign.id } });
      return NextResponse.json(
        { error: "No valid opted-in contacts" },
        { status: 400 }
      );
    }

    // ✅ Saare messages ek saath banao — bulk insert
    const messages = await prisma.$transaction(
      contacts.map((contact) =>
        prisma.message.create({
          data: {
            campaignId: campaign.id,
            contactId: contact.id,
            status: "PENDING",  // ✅ DRAFT nahi — PENDING
          },
        })
      )
    );

    // ✅ Bulk queue mein daalo — kam Redis commands
    const messageIds = messages.map((m) => m.id);
    await enqueueBulkMessages(messageIds);

    // ✅ Campaign status update
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