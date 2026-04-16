// app/api/admin/approve-user/route.ts

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await requireSuperAdmin(req as any);

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, isDeleted: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot approve a deleted user — restore them first
    if (user.isDeleted) {
      return NextResponse.json(
        { error: "User is deleted. Restore them before approving." },
        { status: 400 }
      );
    }

    if (user.status === "ACTIVE") {
      return NextResponse.json({ message: "User already active" });
    }

    await prisma.user.update({
      where: { id: userId },
      data:  { status: "ACTIVE" },
    });

    return NextResponse.json({ message: "User approved successfully" });
  } catch (err) {
    console.error("Approve user error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}