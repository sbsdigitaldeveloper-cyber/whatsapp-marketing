import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getUserId } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET!;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID!;
const VERSION = process.env.WHATSAPP_VERSION || "v19.0";

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

async function sendWhatsApp(phone: string, message: string) {
  const url = `https://graph.facebook.com/${VERSION}/${PHONE_NUMBER_ID}/messages`;

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

  return res.json();
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId, contactIds } = await req.json();

  const campaign = await prisma.campaign.findFirst({
    where: { id: Number(campaignId), userId },
  });

  if (!campaign)
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "SENDING" },
  });

  let sent = 0;
  let failed = 0;

  for (const contactId of contactIds) {
    const contact = await prisma.contact.findFirst({
      where: { id: Number(contactId), userId },
    });

    if (!contact) continue;

    const msg = await prisma.message.create({
      data: {
        campaignId: campaign.id,
        contactId: contact.id,
        status: "PENDING",
      },
    });

    try {
      await sendWhatsApp(contact.phone, campaign.message);

      await prisma.message.update({
        where: { id: msg.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      sent++;
    } catch {
      await prisma.message.update({
        where: { id: msg.id },
        data: { status: "FAILED" },
      });

      failed++;
    }
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({
    success: true,
    sent,
    failed,
  });
}