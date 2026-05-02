// app/api/whatsapp/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTokenPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const WHATSAPP_VERSION = process.env.WHATSAPP_VERSION || "v21.0";

export async function GET(req: NextRequest) {
  const payload = await getTokenPayload(req);

  if (!payload || !payload.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.userId;

  try {
    const config = await prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!config || !config.isActive) {
      return NextResponse.json(
        { error: "WhatsApp not configured or inactive" },
        { status: 404 }
      );
    }

    const decryptedToken = config.accessToken;
    const wabaId = config.businessId;

    const url = `https://graph.facebook.com/${WHATSAPP_VERSION}/${wabaId}/message_templates?status=APPROVED&limit=100&fields=name,language,status,components`;

    console.log("🌐 Fetching Meta Templates...");
    console.log("📡 URL:", url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${decryptedToken}`,
      },
    });

    const rawData = await res.json();

    // 🔥 RAW META RESPONSE
    console.log("📥 RAW META RESPONSE:");
    console.dir(rawData, { depth: null });

    if (!res.ok) {
      throw new Error(rawData.error?.message || "Failed to fetch templates");
    }

    console.log(`📦 Total Templates from Meta: ${rawData.data?.length || 0}`);

    const templates = rawData.data.map((t: any, index: number) => {
      console.log(`\n================ TEMPLATE ${index + 1} ================`);
      console.log("📌 NAME:", t.name);
      console.log("🌍 LANGUAGE:", t.language);
      console.log("📊 STATUS:", t.status);
      console.log("🧩 COMPONENTS:");
      console.dir(t.components, { depth: null });

      const bodyComp = t.components?.find((c: any) => c.type === "BODY");
      const headerComp = t.components?.find((c: any) => c.type === "HEADER");
      const footerComp = t.components?.find((c: any) => c.type === "FOOTER");
      const buttonsComp = t.components?.find((c: any) => c.type === "BUTTONS");

      const body = bodyComp?.text || "";

      const allVarMatches = body.match(/\{\{(\w+)\}\}/g) || [];
      const variableNames = allVarMatches.map((m: string) =>
        m.replace(/\{\{|\}\}/g, "")
      );

      const mapped = {
        name: t.name,
        language: t.language,
        status: t.status,

        bodyText: body,
        variableNames,

        headerType: headerComp?.format || null,
        headerText:
          headerComp?.format === "TEXT" ? headerComp?.text || null : null,
        headerMediaUrl: headerComp?.example?.header_handle?.[0] || null,

        footerText: footerComp?.text || null,

        buttons:
          buttonsComp?.buttons?.map((b: any) => ({
            type: b.type,
            text: b.text,
            url: b.url,
            phone: b.phone_number,
          })) || [],

        rawComponents: t.components,
      };

      console.log("✅ MAPPED TEMPLATE:");
      console.dir(mapped, { depth: null });

      return mapped;
    });

    console.log(`\n🚀 FINAL TEMPLATE COUNT: ${templates.length}`);

    return NextResponse.json({ templates });

  } catch (error: any) {
    console.error("❌ TEMPLATE FETCH ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}