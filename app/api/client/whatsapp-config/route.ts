// app/api/client/whatsapp-config/route.ts
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req as any);

    const config = await prisma.whatsAppConfig.findUnique({
      where: { userId: user.userId },
      select: {
        phoneNumberId: true,
        displayNumber: true,
        businessId:    true,
        isActive:      true,
        verifyToken:   true,
        // accessToken intentionally NOT selected — never expose to client side
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: "WhatsApp not configured yet. Contact your admin." },
        { status: 404 }
      );
    }

    if (!config.isActive) {
      return NextResponse.json(
        { error: "WhatsApp config is inactive. Contact your admin." },
        { status: 403 }
      );
    }

    return NextResponse.json(config);
  } catch (err) {
    console.error("WA config error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}