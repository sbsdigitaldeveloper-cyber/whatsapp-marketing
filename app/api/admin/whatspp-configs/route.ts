// app/api/admin/whatsapp-configs/route.ts

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await requireSuperAdmin(req as any);

    const configs = await prisma.whatsAppConfig.findMany({
      where: {
        user: { isDeleted: false }, // exclude configs of deleted users
      },
      include: {
        user: {
          select: {
            id:      true,
            name:    true,
            email:   true,
            orgName: true,
            status:  true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ configs, total: configs.length });
  } catch (err) {
    console.error("WhatsApp configs error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}