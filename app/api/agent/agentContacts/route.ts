// app/api/agent/contacts/route.ts
// Returns only contacts assigned to the logged-in agent

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getTokenPayload(req);
  if (!auth || auth.role !== "agent")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId, userId } = auth;

  const contacts = await prisma.contact.findMany({
    where: {
      assignedAgentId: agentId!,
      userId,
    },
    include: {
      messages: {
        orderBy: { sentAt: "asc" },
        select: {
          id:        true,
          body:      true,
          direction: true,
          status:    true,
          sentAt:    true,
          mediaType: true,
          mediaUrl:  true,
          mediaName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = contacts.map((c) => ({
    ...c,
    messageCount: c.messages.length,
  }));

  return NextResponse.json({ contacts: result });
}