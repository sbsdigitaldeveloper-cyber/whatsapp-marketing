import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getUserId } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// Code
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_VERSION = process.env.WHATSAPP_VERSION || "v19.0";

// function getUserId(req: NextRequest): number | null {
//   const auth = req.headers.get("authorization");
//   if (!auth) return null;
//   try {
//     const token = auth.replace("Bearer ", "");
//     const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
//     return decoded.userId;
//   } catch {
//     return null;
//   }
// }

// Send single WhatsApp message
async function sendWhatsAppMessage(phone: string, message: string) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    return {
      ok: false,
      error: "WhatsApp credentials not configured",
    };
  }

  const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${PHONE_NUMBER_ID}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
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
      console.error("WhatsApp API Error:", data);
      return {
        ok: false,
        error: data.error?.message || "Failed to send",
        data,
      };
    }

    return { ok: true, data };
  } catch (error: any) {
    console.error("Network error:", error);
    return {
      ok: false,
      error: error.message || "Network error",
    };
  }
}

// POST - Send single message
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { phone, message, messageId } = await req.json();

    if (!phone || !message) {
      return NextResponse.json(
        { error: "phone and message are required" },
        { status: 400 }
      );
    }

    // Send message
    const result = await sendWhatsAppMessage(phone, message);

    // If messageId provided, update status in DB
    if (messageId) {
      try {
        await prisma.message.update({
          where: { id: Number(messageId) },
          data: {
            status: result.ok ? "SENT" : "FAILED",
            sentAt: result.ok ? new Date() : null,
          },
        });
      } catch (error) {
        console.error("Failed to update message status:", error);
      }
    }

    return NextResponse.json({
      success: result.ok,
      error: result.error,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Send single message error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}