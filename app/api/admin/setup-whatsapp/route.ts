// app/api/admin/setup-whatsapp/route.ts

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await requireSuperAdmin(req as any);

    const body = await req.json();
    const { userId, phoneNumberId, accessToken,
            verifyToken, displayNumber, businessId } = body;

    // Validate required fields
    if (!userId || !phoneNumberId || !accessToken || !verifyToken || !displayNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check user exists and is not deleted
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isDeleted: true, status: true },
    });

    if (!user || user.isDeleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert — update if exists, create if not
    const config = await prisma.whatsAppConfig.upsert({
      where:  { userId },
      update: { phoneNumberId, accessToken, verifyToken,
                displayNumber, businessId, isActive: true },
      create: { userId, phoneNumberId, accessToken,
                verifyToken, displayNumber, businessId, isActive: true },
    });

    return NextResponse.json({ message: "WhatsApp configured", config });
  } catch (err) {
    console.error("Setup WhatsApp error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}