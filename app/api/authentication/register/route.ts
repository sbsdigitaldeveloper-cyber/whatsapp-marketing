import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(req: NextRequest) {
  try {
    const { name, email, orgName, password } = await req.json();

    if (!name || !email || !orgName || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    // 🛡️ Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        orgName, 
        password: password,
        status: "PENDING" // Onboarding ke liye pending rakhein
      },
    });

    return NextResponse.json({ message: "Success", userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("REGISTER_ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}