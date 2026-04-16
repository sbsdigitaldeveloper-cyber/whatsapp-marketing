// app/api/admin/stats/route.ts

import { requireSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    await requireSuperAdmin(req as any);

    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { status: "ACTIVE" }
    });
    const pendingUsers = await prisma.user.count({
      where: { status: "PENDING" }
    });

    const totalMessages = await prisma.message.count();

    return NextResponse.json({
      totalUsers,
      activeUsers,
      pendingUsers,
      totalMessages
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}