import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { enqueueBulkMessages } from "@/lib/queue";
import { spawn } from "child_process";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id: Number(id) },
    });

    if (!campaign || campaign.userId !== userId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ✅ Failed messages find karo
    const failedMessages = await prisma.message.findMany({
      where: {
        campaignId: Number(id),
        status: "FAILED",
      },
    });

    if (failedMessages.length === 0)
      return NextResponse.json({ error: "No failed messages" }, { status: 400 });

    // ✅ Reset to PENDING
    await prisma.message.updateMany({
      where: {
        campaignId: Number(id),
        status: "FAILED",
      },
      data: {
        status: "PENDING",
        errorReason: null,
        retryCount: 0,
      },
    });

    // ✅ Queue mein daalo
    const messageIds = failedMessages.map((m) => m.id);
    await enqueueBulkMessages(messageIds);

    // ✅ Campaign status update
    await prisma.campaign.update({
      where: { id: Number(id) },
      data: { status: "SENDING" },
    });

    // ✅ Worker start karo
    const workerProcess = spawn("tsx", ["worker.ts"], {
      cwd: "/var/www/whatsapp-marketing",
      env: { ...process.env, NODE_ENV: "production" },
      detached: true,
      stdio: "ignore",
    });
    workerProcess.unref();

    return NextResponse.json({
      success: true,
      retrying: failedMessages.length,
    });

  } catch (error: any) {
    console.error("Retry error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}