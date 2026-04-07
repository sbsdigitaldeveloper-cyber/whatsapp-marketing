// app/api/agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
// import bcrypt from "bcryptjs";

// GET /api/agents — list all agents for this user (admin only)
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agents = await prisma.agent.findMany({
    where: { userId },
    select: {
      id:        true,
      name:      true,
      email:     true,
      createdAt: true,
      _count: {
        select: { contacts: true }, // how many contacts assigned
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ agents });
}

// POST /api/agents — create a new agent (admin only)
export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "name, email and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.agent.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Agent with this email already exists" },
        { status: 409 }
      );
    }

    // const hashedPassword = await bcrypt.hash(password, 10);

    const agent = await prisma.agent.create({
      data: {
        name,
        email,
        password: password,
        userId,
      },
      select: {
        id:        true,
        name:      true,
        email:     true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, agent }, { status: 201 });

  } catch (error: any) {
    console.error("Create agent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create agent" },
      { status: 500 }
    );
  }
}