import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await requireSuperAdmin(req as any);

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isDeleted: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isDeleted) {
      return NextResponse.json({ message: "User is not deleted" });
    }

    // Restore all agents under this user
    await prisma.agent.updateMany({
      where: { userId },
      data:  { isDeleted: false, deletedAt: null },
    });

    // Restore the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted:  false,
        deletedAt:  null,
        deletedBy:  null,
        status:     "ACTIVE",
      },
    });

    return NextResponse.json({ message: "User restored successfully" });
  } catch (err) {
    console.error("Restore user error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}