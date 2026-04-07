import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    // ✅ Clear the HttpOnly cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // expires immediately
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}