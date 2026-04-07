import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth"; // ✅ only this import needed

// GET campaigns
export async function GET(req: NextRequest) {
  const userId = await getUserId(req); // ✅ await added
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(campaigns);
}

// CREATE campaign
export async function POST(req: NextRequest) {
  const userId = await getUserId(req); // ✅ await added
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