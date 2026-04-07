import fs   from "fs";
import path from "path";

export async function downloadAndSaveMedia(
  mediaId:   string,
  mediaType: string
): Promise<string | null> {
  try {
    // Step 1 — Meta se fresh URL lo
    const metaRes  = await fetch(
      `https://graph.facebook.com/${process.env.WHATSAPP_VERSION || "v19.0"}/${mediaId}`,
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
    );
    const metaData = await metaRes.json();
    const mediaUrl = metaData?.url;
    if (!mediaUrl) return null;

    // Step 2 — File download karo
    const fileRes     = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    });
    const buffer      = await fileRes.arrayBuffer();
    const contentType = fileRes.headers.get("content-type") || "image/jpeg";

    // Step 3 — Extension
    const ext = contentType.includes("jpeg")    ? "jpg"
              : contentType.includes("png")     ? "png"
              : contentType.includes("webp")    ? "webp"
              : contentType.includes("pdf")     ? "pdf"
              : contentType.includes("mp4")     ? "mp4"
              : contentType.includes("ogg")     ? "ogg"
              : contentType.includes("mp3")     ? "mp3"
              : contentType.includes("msword")  ? "doc"
              : "bin";

    // Step 4 — Folder banao
    const uploadDir = path.join(process.cwd(), "public", "media");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Step 5 — Already exists check karo — dobara download mat karo
    const fileName = `${mediaId}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, Buffer.from(buffer));
      console.log(`💾 Saved: /media/${fileName}`);
    } else {
      console.log(`⚡ Already exists: /media/${fileName}`);
    }

    return `/media/${fileName}`; // public URL

  } catch (err) {
    console.error("Media save failed:", err);
    return null;
  }
}