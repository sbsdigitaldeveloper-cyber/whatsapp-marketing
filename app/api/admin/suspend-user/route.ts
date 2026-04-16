// app/api/admin/suspend-user/route.ts

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const admin = await requireSuperAdmin(req as any);

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

    if (user.isDeleted) {
      return NextResponse.json(
        { error: "User is already deleted" },
        { status: 400 }
      );
    }

    // Block suspending another super admin
    if (user.role === "SUPERADMIN") {
      return NextResponse.json(
        { error: "Cannot suspend a super admin" },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json({ message: "User already suspended" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        status:      "SUSPENDED",
        suspendedAt: new Date(),
        suspendedBy: admin.id,   // track which admin did it
      },
    });

    return NextResponse.json({ message: "User suspended successfully" });
  } catch (err) {
    console.error("Suspend user error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}