// app/api/agents/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

// DELETE /api/agents/:id — delete agent (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    // Make sure this agent belongs to this user
    const agent = await prisma.agent.findFirst({
      where: { id: Number(id), userId },
    });

    if (!agent)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    // Unassign all contacts first
    await prisma.contact.updateMany({
      where: { assignedAgentId: Number(id) },
      data:  { assignedAgentId: null },
    });

    await prisma.agent.delete({ where: { id: Number(id) } });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Delete agent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete agent" },
      { status: 500 }
    );
  }
}