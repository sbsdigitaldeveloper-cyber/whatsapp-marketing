// app/api/messages/reply-media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const WHATSAPP_TOKEN   = process.env.WHATSAPP_TOKEN!;
const PHONE_NUMBER_ID  = process.env.PHONE_NUMBER_ID!;
const WHATSAPP_VERSION = process.env.WHATSAPP_VERSION || "v19.0";

// Maps MIME type → WhatsApp message type
function getWhatsAppMediaType(mimeType: string): "image" | "document" | "video" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

// Step 1: Upload media to WhatsApp and get a media ID
async function uploadMediaToWhatsApp(
  arrayBuffer: ArrayBuffer, // ✅ ArrayBuffer is a valid BlobPart — no TS error
  mimeType: string,
  fileName: string
): Promise<string> {
  const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${PHONE_NUMBER_ID}/media`;

  const blob = new Blob([arrayBuffer], { type: mimeType }); // ✅ no error

  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  formData.append("file", blob, fileName);
  formData.append("type", mimeType);

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to upload media to WhatsApp");

  return data.id as string;
}

// Step 2: Send the media message using the media ID
async function sendWhatsAppMediaMessage(
  phone: string,
  mediaId: string,
  mediaType: "image" | "document" | "video",
  caption: string,
  fileName: string
) {
  const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const mediaObject: Record<string, string> = { id: mediaId };
  if (mediaType === "document") {
    mediaObject.filename = fileName;
    if (caption) mediaObject.caption = caption;
  } else {
    if (caption) mediaObject.caption = caption;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to:          phone,
      type:        mediaType,
      [mediaType]: mediaObject,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "WhatsApp send media failed");

  return data?.messages?.[0]?.id ?? null;
}

// Step 3: Save file locally
async function saveFileLocally(
  arrayBuffer: ArrayBuffer, // ✅ convert to Buffer only here at point of use
  fileName: string
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "media");
  await mkdir(uploadDir, { recursive: true });

  const uniqueName = `${Date.now()}-${fileName}`;
  const filePath   = path.join(uploadDir, uniqueName);

  await writeFile(filePath, Buffer.from(arrayBuffer)); // ✅ Buffer.from(ArrayBuffer) is fine
  return `/uploads/media/${uniqueName}`;
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData  = await req.formData();
    const contactId = formData.get("contactId")?.toString();
    const caption   = formData.get("caption")?.toString() ?? "";
    const file      = formData.get("file") as File | null;

    if (!contactId || !file) {
      return NextResponse.json(
        { error: "contactId and file are required" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 400 });
    }

    const contact = await prisma.contact.findFirst({
      where: { id: Number(contactId), userId },
    });

    if (!contact)
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    if (!contact.optIn)
      return NextResponse.json({ error: "Contact has opted out" }, { status: 400 });

    // ✅ Read once as ArrayBuffer — pass directly, no Buffer at top level
    const arrayBuffer = await file.arrayBuffer();
    const mimeType    = file.type;
    const fileName    = file.name;
    const mediaType   = getWhatsAppMediaType(mimeType);

    // 1️⃣ Upload to WhatsApp → get media ID
    const whatsappMediaId = await uploadMediaToWhatsApp(arrayBuffer, mimeType, fileName);

    // 2️⃣ Send media message via WhatsApp
    const whatsappMsgId = await sendWhatsAppMediaMessage(
      contact.phone,
      whatsappMediaId,
      mediaType,
      caption,
      fileName
    );

    // 3️⃣ Save file locally
    const localUrl = await saveFileLocally(arrayBuffer, fileName);

    // 4️⃣ Save to DB
    const lastMessage = await prisma.message.findFirst({
      where:   { contactId: contact.id, direction: "OUTBOUND" },
      orderBy: { sentAt: "desc" },
    });

    await prisma.message.create({
      data: {
        status:        "SENT",
        direction:     "OUTBOUND",
        body:          caption || null,
        mediaUrl:      localUrl,
        mediaType:     mediaType,
        mediaId:       whatsappMediaId,
        mediaName:     fileName,
        sentAt:        new Date(),
        whatsappMsgId,
        campaignId:    lastMessage?.campaignId ?? 1,
        contactId:     contact.id,
      },
    });

    console.log(`✅ Media sent to ${contact.phone} | type: ${mediaType} | wamid: ${whatsappMsgId}`);

    return NextResponse.json({ success: true, whatsappMsgId, localUrl });

  } catch (error: any) {
    console.error("Media reply error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send media" },
      { status: 500 }
    );
  }
}