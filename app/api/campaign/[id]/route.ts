// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getUserId } from "@/lib/auth"; // ✅

// export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//   const userId = await getUserId(req); // ✅
//   if (!userId)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   try {
//     const { id } = await params;

//     const campaign = await prisma.campaign.findUnique({
//       where: { id: Number(id) },
//     });

//     if (!campaign || campaign.userId !== userId) // ✅
//       return NextResponse.json({ error: "Not found" }, { status: 404 });

//     return NextResponse.json({ status: campaign.status });

//   } catch {
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }



import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id: Number(id) },
      include: {
        messages: {
          include: {
            contact: true,
          },
        },
      },
    });

    if (!campaign || campaign.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ✅ Compute stats
    const stats = {
      total: campaign.messages.length,
      pending: campaign.messages.filter((m) => m.status === "PENDING").length,
      sent: campaign.messages.filter((m) => m.status === "SENT").length,
      delivered: campaign.messages.filter((m) => m.status === "DELIVERED").length,
      read: campaign.messages.filter((m) => m.status === "READ").length,
      failed: campaign.messages.filter((m) => m.status === "FAILED").length,
    };

    return NextResponse.json({
      ...campaign,
      stats,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}