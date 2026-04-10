import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueBulkMessages } from "@/lib/queue";
import { getUserId } from "@/lib/auth";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      campaignName,
      templateName,
      templateLanguage = "en",
      templateParams = [],
      contactIds,
    } = await req.json();

    if (!templateName)
      return NextResponse.json(
        { error: "templateName required" },
        { status: 400 }
      );

    if (!contactIds || contactIds.length === 0)
      return NextResponse.json(
        { error: "No contacts selected" },
        { status: 400 }
      );

    // ✅ Valid opted-in contacts pehle lo
    const contacts = await prisma.contact.findMany({
      where: {
        userId,
        optIn: true,
        id: { in: contactIds },
      },
      select: { id: true },
    });

    if (contacts.length === 0)
      return NextResponse.json(
        { error: "No valid opted-in contacts" },
        { status: 400 }
      );

    // ✅ Campaign banao
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name: campaignName ||
          `Template: ${templateName} - ${new Date().toLocaleDateString()}`,
        message: "",
        messageType: "TEMPLATE",
        templateName,
        templateLanguage,
        templateParams: JSON.stringify(templateParams),
        status: "QUEUED",
      },
    });

    // ✅ Bulk insert — 1 query mein saare messages
    await prisma.message.createMany({
      data: contacts.map((contact) => ({
        campaignId: campaign.id,
        contactId:  contact.id,
        status:     "PENDING",
      })),
    });

    // ✅ Message IDs lo
    const messages = await prisma.message.findMany({
      where:  { campaignId: campaign.id },
      select: { id: true },
    });

    // ✅ Bulk queue mein daalo — ek call
    const messageIds = messages.map((m) => m.id);
    await enqueueBulkMessages(messageIds);

    // ✅ Campaign SENDING
    await prisma.campaign.update({
      where: { id: campaign.id },
      data:  { status: "SENDING" },
    });

    // ✅ Worker auto start
    const workerProcess = spawn(
      "tsx",
      ["worker.ts"],
      {
        cwd: "/var/www/whatsapp-marketing",
        env: { ...process.env, NODE_ENV: "production" },
        detached: true,
        stdio: "ignore",
      }
    );
    workerProcess.unref();
    console.log(`🚀 Worker started — ${contacts.length} contacts queued`);

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