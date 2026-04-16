import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPayload } from "@/lib/auth";

// Send single WhatsApp message (Dynamic Config ke saath)
async function sendWhatsAppMessage(
  phone: string, 
  message: string, 
  config: { accessToken: string; phoneNumberId: string }
) {
  const version = process.env.WHATSAPP_VERSION || "v21.0";
  const url = `https://graph.facebook.com/${version}/${config.phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: data.error?.message || "Failed to send",
        data,
      };
    }

    return { ok: true, data };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || "Network error",
    };
  }
}

// POST - Send single message
export async function POST(req: NextRequest) {
  const payload = await getTokenPayload(req);

  if (!payload || !payload.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.userId;

  try {
    const { phone, message, messageId } = await req.json();

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Phone and message are required" },
        { status: 400 }
      );
    }

    // 1. User ka WhatsApp Configuration fetch karein
    const userConfig = await prisma.whatsAppConfig.findUnique({
      where: { userId: userId },
    });

    if (!userConfig || !userConfig.isActive) {
      return NextResponse.json(
        { error: "WhatsApp credentials not configured or inactive" },
        { status: 400 }
      );
    }

    // 2. Message bhejein User ke credentials use karke
    const result = await sendWhatsAppMessage(phone, message, {
      accessToken: userConfig.accessToken,
      phoneNumberId: userConfig.phoneNumberId,
    });

    // 3. Status update karein DB mein
    if (messageId) {
      await prisma.message.update({
        where: { id: Number(messageId) },
        data: {
          status: result.ok ? "SENT" : "FAILED",
          sentAt: result.ok ? new Date() : null,
          errorReason: result.ok ? null : result.error,
          whatsappMsgId: result.data?.messages?.[0]?.id || null,
        },
      });
    }

    return NextResponse.json({
      success: result.ok,
      error: result.error,
      waId: result.data?.messages?.[0]?.id
    });

  } catch (error: any) {
    console.error("Send single message error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}