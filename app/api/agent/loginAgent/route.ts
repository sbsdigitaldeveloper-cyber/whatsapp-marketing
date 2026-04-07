// app/api/agent/login/route.ts
// whatsapp-saas/app/api/agent/loginAgent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAgentToken } from "@/lib/auth";


export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({ where: { email } });

    if (!agent) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = password == agent.password ;
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ✅ Sign JWT using same jose helper as admin
    const token = await signAgentToken({
      id:     agent.id,
      userId: agent.userId,
      name:   agent.name,
      email:  agent.email,
    });

    const res = NextResponse.json({
      success: true,
      agent: {
        id:    agent.id,
        name:  agent.name,
        email: agent.email,
      },
    });

    // ✅ Set HttpOnly cookie — same as admin login
    res.cookies.set("token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7, // 7 days
      path:     "/",
    });

    return res;

  } catch (error: any) {
    console.error("Agent login error:", error);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}