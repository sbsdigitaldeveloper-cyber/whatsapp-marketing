// app/api/admin/delete-whatsapp/route.ts

import { requireSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    await requireSuperAdmin(req as any);

    const { id } = await req.json();

    await prisma.whatsAppConfig.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}