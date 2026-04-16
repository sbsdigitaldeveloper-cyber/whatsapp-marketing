// app/api/messages/reply-media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPayload } from "@/lib/auth";
// import { decrypt } from "@/lib/encrypt"; // Assuming you use decryption later, currently plain text
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const WHATSAPP_VERSION = process.env.WHATSAPP_VERSION || "v21.0";

// --- Helper Functions (Updated with Token/ID params) ---

function getWhatsAppMediaType(mimeType: string): "image" | "document" | "video" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

async function uploadMediaToWhatsApp(
  arrayBuffer: ArrayBuffer,
  mimeType: string,
  fileName: string,
  phoneNumberId: string, // Dynamic
  accessToken: string    // Dynamic
): Promise<string> {
  const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${phoneNumberId}/media`;
  const blob = new Blob([arrayBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  formData.append("file", blob, fileName);
  formData.append("type", mimeType);

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "WhatsApp Upload Failed");
  return data.id as string;
}

async function sendWhatsAppMediaMessage(
  phone: string,
  mediaId: string,
  mediaType: "image" | "document" | "video",
  caption: string,
  fileName: string,
  phoneNumberId: string, // Dynamic
  accessToken: string    // Dynamic
) {
  const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${phoneNumberId}/messages`;
  const mediaObject: any = { id: mediaId };
  if (mediaType === "document") mediaObject.filename = fileName;
  if (caption) mediaObject.caption = caption;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: mediaType,
      [mediaType]: mediaObject,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "WhatsApp Send Failed");
  return data?.messages?.[0]?.id ?? null;
}

async function saveFileLocally(arrayBuffer: ArrayBuffer, fileName: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "media");
  await mkdir(uploadDir, { recursive: true });
  const uniqueName = `${Date.now()}-${fileName.replace(/\s+/g, "_")}`;
  const filePath = path.join(uploadDir, uniqueName);
  await writeFile(filePath, Buffer.from(arrayBuffer));
  return `/uploads/media/${uniqueName}`;
}

// --- Main Route ---

export async function POST(req: NextRequest) {
  const auth = await getTokenPayload(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, role, agentId } = auth;

  try {
    const formData = await req.formData();
    const contactId = formData.get("contactId")?.toString();
    const caption = formData.get("caption")?.toString() ?? "";
    const file = formData.get("file") as File | null;

    if (!contactId || !file) {
      return NextResponse.json({ error: "contactId and file are required" }, { status: 400 });
    }

    // 1. Fetch THIS client's configuration
    const waConfig = await prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!waConfig || !waConfig.isActive) {
      return NextResponse.json({ error: "WhatsApp inactive or not configured" }, { status: 403 });
    }

    // Security: Server-side use only
    const clientToken = waConfig.accessToken; 
    const phoneNumberId = waConfig.phoneNumberId;

    // 2. Fetch Contact and Check Ownership
    const contact = await prisma.contact.findFirst({
      where: { id: Number(contactId), userId },
    });

    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    
    // Agent Restriction
    if (role === "agent" && contact.assignedAgentId !== agentId) {
      return NextResponse.json({ error: "Access Denied to this contact" }, { status: 403 });
    }

    if (!contact.optIn) return NextResponse.json({ error: "User opted out" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const mediaType = getWhatsAppMediaType(file.type);

    // 3. Step-by-Step Execution with Client Keys
    const whatsappMediaId = await uploadMediaToWhatsApp(
      arrayBuffer, 
      file.type, 
      file.name, 
      phoneNumberId, 
      clientToken
    );

    const whatsappMsgId = await sendWhatsAppMediaMessage(
      contact.phone,
      whatsappMediaId,
      mediaType,
      caption,
      file.name,
      phoneNumberId,
      clientToken
    );

    const localUrl = await saveFileLocally(arrayBuffer, file.name);

    // 4. Save Record to DB
    await prisma.message.create({
      data: {
        userId,
        status: "SENT",
        direction: "OUTBOUND",
        body: caption || null,
        mediaUrl: localUrl,
        mediaType: mediaType,
        mediaId: whatsappMediaId,
        mediaName: file.name,
        sentAt: new Date(),
        whatsappMsgId,
        contactId: contact.id,
        campaignId: null, // Replies usually don't have a campaignId
      },
    });

    return NextResponse.json({ success: true, whatsappMsgId, localUrl });

  } catch (error: any) {
    console.error(`[MEDIA_REPLY_ERROR] User ${userId}:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}