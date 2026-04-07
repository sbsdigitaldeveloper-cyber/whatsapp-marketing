import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: "All fields required" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });

    const user = await prisma.user.create({
      data: { name, email, password }, // plain password store
    });

    return NextResponse.json({ message: "User created", userId: user.id }, { status: 201 });
  } catch (error) {
    console.log(`ERROR REGISTER API: ${error}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
