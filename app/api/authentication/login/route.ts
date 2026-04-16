// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// export async function POST(req: NextRequest) {
//   try {
//     const { email, password } = await req.json();

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user)
//       return NextResponse.json(
//         { error: "Invalid credentials" },
//         { status: 401 }
//       );

//     // Simple plain password check
//     if (user.password !== password)
//       return NextResponse.json(
//         { error: "Invalid credentials" },
//         { status: 401 }
//       );

//     const token = jwt.sign(
//       { userId: user.id, email: user.email },
//       JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     return NextResponse.json({ token, userId: user.id, name: user.name });
//   } catch (error) {
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
   console.log("🔑 Login JWT_SECRET:", JWT_SECRET); // ← add this
  try {
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    if (user.password !== password)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = jwt.sign(
      { userId: user.id, email: user.email ,role: user.role, },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // ✅ Set as "token" (consistent with middleware)
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // false on localhost ✅
      sameSite: "lax",   // ✅ lax works better on localhost than strict
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // ✅ Also clear old "auth_token" cookie if it exists
    response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}