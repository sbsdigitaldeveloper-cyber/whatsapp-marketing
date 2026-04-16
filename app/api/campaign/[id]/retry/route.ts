// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getUserId } from "@/lib/auth";
// import { enqueueBulkMessages } from "@/lib/queue";
// import { spawn } from "child_process";

// export async function POST(
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   const userId = await getUserId(req);
//   if (!userId)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   try {
//     const { id } = await params;

//     const campaign = await prisma.campaign.findUnique({
//       where: { id: Number(id) },
//     });

//     if (!campaign || campaign.userId !== userId)
//       return NextResponse.json({ error: "Not found" }, { status: 404 });

//     // ✅ Failed messages find karo
//     const failedMessages = await prisma.message.findMany({
//       where: {
//         campaignId: Number(id),
//         status: "FAILED",
//       },
//     });

//     if (failedMessages.length === 0)
//       return NextResponse.json({ error: "No failed messages" }, { status: 400 });

//     // ✅ Reset to PENDING
//     await prisma.message.updateMany({
//       where: {
//         campaignId: Number(id),
//         status: "FAILED",
//       },
//       data: {
//         status: "PENDING",
//         errorReason: null,
//         retryCount: 0,
//       },
//     });

//     // ✅ Queue mein daalo
//     const messageIds = failedMessages.map((m) => m.id);
//     await enqueueBulkMessages(messageIds);

//     // ✅ Campaign status update
//     await prisma.campaign.update({
//       where: { id: Number(id) },
//       data: { status: "SENDING" },
//     });

//     // ✅ Worker start karo
//     const workerProcess = spawn("tsx", ["worker.ts"], {
//       cwd: "/var/www/whatsapp-marketing",
//       env: { ...process.env, NODE_ENV: "production" },
//       detached: true,
//       stdio: "ignore",
//     });
//     workerProcess.unref();

//     return NextResponse.json({
//       success: true,
//       retrying: failedMessages.length,
//     });

//   } catch (error: any) {
//     console.error("Retry error:", error);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }



import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { enqueueBulkMessages } from "@/lib/queue";
import { getTokenPayload } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
 const payload = await getTokenPayload(req);
 
   if (!payload || !payload.userId) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
 
   const userId = payload.userId;

  try {
    const { id } = await params;
    const campaignId = Number(id);

    // 1. Campaign owner check
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 2. Sirf FAILED messages fetch karein
    const failedMessages = await prisma.message.findMany({
      where: {
        campaignId: campaignId,
        status: "FAILED",
      },
      select: { id: true }, // Sirf ID chahiye memory bachane ke liye
    });

    if (failedMessages.length === 0) {
      return NextResponse.json({ error: "No failed messages to retry" }, { status: 400 });
    }

    // 3. Database mein reset karein (PENDING ya QUEUED status)
    await prisma.message.updateMany({
      where: {
        campaignId: campaignId,
        status: "FAILED",
      },
      data: {
        status: "PENDING",
        errorReason: null,
        // retryCount: 0, // Agar aapke schema mein hai toh
      },
    });

    // 4. 🔥 Redis Queue mein wapis bhejein
    const messageIds = failedMessages.map((m) => m.id);
    await enqueueBulkMessages(messageIds);

    // 5. Campaign status update
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "SENDING" },
    });

    /**
     * ❌ SPAWN HATA DIYA: 
     * Kyunki worker PM2 se background mein pehle se chal raha hai, 
     * wo apne aap naye jobs "Pick" kar lega. 
     * Aapko yahan se start karne ki zaroorat nahi hai.
     */

    return NextResponse.json({
      success: true,
      retryingCount: failedMessages.length,
    });

  } catch (error: any) {
    console.error("Retry API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}