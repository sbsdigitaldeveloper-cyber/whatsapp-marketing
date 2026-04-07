// app/api/agent/me/route.ts
// Returns current agent info decoded from JWT cookie

import { NextRequest, NextResponse } from "next/server";
import { getTokenPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getTokenPayload(req);
  if (!auth || auth.role !== "agent")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    agentId: auth.agentId,
    userId:  auth.userId,
    name:    auth.name,
    email:   auth.email,
    role:    auth.role,
  });
}