// app/api/contacts/[id]/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

// PATCH /api/contacts/:id/assign
// Body: { agentId: number | null }
// agentId: null = unassign
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { agentId } = await req.json();

    // Validate contact belongs to this user
    const contact = await prisma.contact.findFirst({
      where: { id: Number(id), userId },
    });

    if (!contact)
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    // If assigning, validate agent belongs to this user
    if (agentId !== null && agentId !== undefined) {
      const agent = await prisma.agent.findFirst({
        where: { id: Number(agentId), userId },
      });

      if (!agent)
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const updated = await prisma.contact.update({
      where: { id: Number(id) },
      data:  { assignedAgentId: agentId ?? null },
      select: {
        id:   true,
        name: true,
        phone: true,
        assignedAgentId: true,
        assignedAgent: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, contact: updated });

  } catch (error: any) {
    console.error("Assign agent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assign agent" },
      { status: 500 }
    );
  }
}