export async function GET(
  req: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const { mediaId } = await params; // ✅ FIX

  // Step 1 — Get fresh media URL
  const metaRes = await fetch(
    `https://graph.facebook.com/${process.env.WHATSAPP_VERSION || "v19.0"}/${mediaId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
    }
  );

  const metaData = await metaRes.json();
  const mediaUrl = metaData?.url;

  if (!mediaUrl) {
    return new Response("Media not found", { status: 404 });
  }

  // Step 2 — Fetch actual file
  const fileRes = await fetch(mediaUrl, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    },
  });

  const buffer = await fileRes.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": fileRes.headers.get("content-type") || "application/octet-stream",
    },
  });
}