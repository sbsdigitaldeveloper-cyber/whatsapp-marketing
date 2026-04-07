// app/api/whatsapp/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getUserId } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
const WABA_ID = process.env.WABA_ID!; // WhatsApp Business Account ID
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

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${WABA_ID}/message_templates?status=APPROVED&limit=50&fields=name,language,status,components`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Failed to fetch templates");
    }

    const data = await res.json();

    // Clean up response — only send what frontend needs
    const templates = data.data.map((t: any) => ({
      name: t.name,
      language: t.language,
      status: t.status,
      bodyText: t.components?.find((c: any) => c.type === "BODY")?.text || "",
      headerText: t.components?.find((c: any) => c.type === "HEADER")?.text || null,
      footerText: t.components?.find((c: any) => c.type === "FOOTER")?.text || null,
      hasVariables: (t.components?.find((c: any) => c.type === "BODY")?.text || "").includes("{{"),
      variableCount: ((t.components?.find((c: any) => c.type === "BODY")?.text || "").match(/{{\d+}}/g) || []).length,
    }));

    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}