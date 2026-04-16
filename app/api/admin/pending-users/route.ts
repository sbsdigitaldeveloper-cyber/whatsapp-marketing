// app/api/admin/pending-users/route.ts

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await requireSuperAdmin(req as any);

    const users = await prisma.user.findMany({
      where: {
        status:    "PENDING",
        isDeleted: false,        // never show deleted users in pending list
      },
      orderBy: { createdAt: "desc" },
      select: {
        id:        true,
        name:      true,
        email:     true,
        orgName:   true,
        status:    true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users, total: users.length });
  } catch (err) {
    console.error("Pending users error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}