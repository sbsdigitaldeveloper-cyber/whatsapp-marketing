// app/api/agent/stream/route.ts
// SSE endpoint — agent ke assigned contacts ke naye messages push karta hai

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPayload } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // SSE needs Node.js runtime, not edge

export async function GET(req: NextRequest) {
  const auth = await getTokenPayload(req);
  if (!auth || auth.role !== "agent") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { agentId, userId } = auth;

  // SSE headers
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  function send(data: object) {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  }

  // Track last seen message id per contact
  // Initialize with current latest message ids
  const lastSeenMap = new Map<number, number>();

  async function initLastSeen() {
    const contacts = await prisma.contact.findMany({
      where: { assignedAgentId: agentId!, userId },
      select: {
        id: true,
        messages: {
          orderBy: { id: "desc" },
          take: 1,
          select: { id: true },
        },
      },
    });
    for (const c of contacts) {
      lastSeenMap.set(c.id, c.messages[0]?.id ?? 0);
    }
  }

  async function checkNewMessages() {
    try {
      const contacts = await prisma.contact.findMany({
        where: { assignedAgentId: agentId!, userId },
        select: { id: true },
      });

      for (const contact of contacts) {
        const lastId = lastSeenMap.get(contact.id) ?? 0;

        const newMessages = await prisma.message.findMany({
          where: {
            contactId: contact.id,
            id: { gt: lastId },
          },
          orderBy: { id: "asc" },
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
        });

        if (newMessages.length > 0) {
          // Update last seen
          lastSeenMap.set(contact.id, newMessages[newMessages.length - 1].id);

          // Push to client
          send({
            type:      "new_messages",
            contactId: contact.id,
            messages:  newMessages,
          });
        }
      }
    } catch (err) {
      console.error("SSE poll error:", err);
    }
  }

  // Init + start polling every 2 seconds
  await initLastSeen();
  send({ type: "connected", agentId });

  const interval = setInterval(checkNewMessages, 2000);

  // Cleanup when client disconnects
  req.signal.addEventListener("abort", () => {
    clearInterval(interval);
    writer.close();
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}