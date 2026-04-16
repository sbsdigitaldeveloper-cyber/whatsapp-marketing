// app/api/whatsapp/templates/route.ts
// app/api/whatsapp/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTokenPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // DB connection


const WHATSAPP_VERSION = process.env.WHATSAPP_VERSION || "v21.0";

export async function GET(req: NextRequest) {
  const payload = await getTokenPayload(req);

  if (!payload || !payload.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.userId; 

  try {
    // 1. Database se is specific client ki config nikalein
    const config = await prisma.whatsAppConfig.findUnique({
      where: { userId: userId },
    });

    if (!config || !config.isActive) {
      return NextResponse.json({ error: "WhatsApp not configured or inactive" }, { status: 404 });
    }

    // 2. Token ko decrypt karein (Kyuki humne use database me secure rakha tha)
    const decryptedToken = config.accessToken;
    const wabaId = config.businessId; // Meta Business Account ID

    if (!wabaId) {
      throw new Error("WABA ID is missing for this client");
    }

    // 3. Dynamic URL - Ab Meta wahi templates dega jo is WABA ID ke hain
    const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${wabaId}/message_templates?status=APPROVED&limit=100&fields=name,language,status,components`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${decryptedToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Failed to fetch templates from Meta");
    }

    const data = await res.json();

    // 4. Clean up response (Same logic as yours)
    const templates = data.data.map((t: any) => {
      const body = t.components?.find((c: any) => c.type === "BODY")?.text || "";
      return {
        name: t.name,
        language: t.language,
        status: t.status,
        bodyText: body,
        headerText: t.components?.find((c: any) => c.type === "HEADER")?.text || null,
        footerText: t.components?.find((c: any) => c.type === "FOOTER")?.text || null,
        hasVariables: body.includes("{{"),
        variableCount: (body.match(/{{\d+}}/g) || []).length,
      };
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("[TEMPLATES_FETCH_ERROR]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}