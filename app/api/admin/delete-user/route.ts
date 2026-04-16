import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const admin = await requireSuperAdmin(req as any);

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isDeleted: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "SUPERADMIN") {
      return NextResponse.json(
        { error: "Cannot delete a super admin" },
        { status: 403 }
      );
    }

    if (user.isDeleted) {
      return NextResponse.json({ message: "User already deleted" });
    }

    // Soft delete all agents under this user first
    await prisma.agent.updateMany({
      where: { userId },
      data:  { isDeleted: true, deletedAt: new Date() },
    });

    // Soft delete the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted:  true,
        deletedAt:  new Date(),
        deletedBy:  admin.id,
        status:     "SUSPENDED",
      },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}