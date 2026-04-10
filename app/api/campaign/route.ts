// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getUserId } from "@/lib/auth"; // ✅ only this import needed

// // GET campaigns
// export async function GET(req: NextRequest) {
//   const userId = await getUserId(req); // ✅ await added
//   if (!userId)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const campaigns = await prisma.campaign.findMany({
//     where: { userId },
//     orderBy: { createdAt: "desc" },
//     include: {
//       _count: { select: { messages: true } },
//     },
//   });

//   return NextResponse.json(campaigns);
// }

// // CREATE campaign
// export async function POST(req: NextRequest) {
//   const userId = await getUserId(req); // ✅ await added
//   if (!userId)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const { name, message } = await req.json();

//   if (!name || !message)
//     return NextResponse.json(
//       { error: "Name and message required" },
//       { status: 400 }
//     );

//   const campaign = await prisma.campaign.create({
//     data: {
//       name,
//       message,
//       status: "DRAFT",
//       userId,
//     },
//   });

//   return NextResponse.json(campaign);
// }



import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      messages: {
        select: { status: true },
      },
    },
  });

  // ✅ Stats calculate karo har campaign ke liye
  const result = campaigns.map((c) => ({
    ...c,
    stats: {
      sent:      c.messages.filter((m) => m.status === "SENT").length,
      delivered: c.messages.filter((m) => m.status === "DELIVERED").length,
      read:      c.messages.filter((m) => m.status === "READ").length,
      failed:    c.messages.filter((m) => m.status === "FAILED").length,
    },
    messages: undefined, // Frontend ko raw messages mat bhejo
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, message } = await req.json();

  if (!name || !message)
    return NextResponse.json(
      { error: "Name and message required" },
      { status: 400 }
    );

  const campaign = await prisma.campaign.create({
    data: {
      name,
      message,
      status: "DRAFT",
      userId,
    },
  });

  return NextResponse.json(campaign);
}