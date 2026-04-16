import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const admin = await requireSuperAdmin(req as any);

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "active"; 
    // filter = "active" | "deleted" | "suspended" | "pending" | "all"

    const whereMap: Record<string, object> = {
      active:    { role: "CLIENT", isDeleted: false, status: "ACTIVE" },
      deleted:   { role: "CLIENT", isDeleted: true },
      suspended: { role: "CLIENT", isDeleted: false, status: "SUSPENDED" },
      pending:   { role: "CLIENT", isDeleted: false, status: "PENDING" },
      all:       { role: "CLIENT" },
    };

    const where = whereMap[filter] ?? whereMap.active;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id:          true,
        name:        true,
        email:       true,
        orgName:     true,
        status:      true,
        isDeleted:   true,
        deletedAt:   true,
        suspendedAt: true,
        createdAt:   true,
        _count: {
          select: {
            contacts:  true,
            campaigns: true,
            agents:    true,
            messages:  true,
          },
        },
        whatsappConfig: {
          select: {
            isActive:      true,
            displayNumber: true,
            phoneNumberId: true,
          },
        },
      },
    });

    return NextResponse.json({ users, total: users.length, filter });
  } catch (err) {
    console.error("Users API error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}


