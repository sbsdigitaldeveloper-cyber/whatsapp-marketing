
// import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose"; // ✅ edge compatible

// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// const protectedRoutes = ["/dashboard"];
// const authRoutes = ["/login", "/register"];

// export async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;

//   const token =
//     req.cookies.get("token")?.value ||
//     req.cookies.get("auth_token")?.value;

//   console.log("🔍 Middleware hit:", pathname);
//   console.log("🔍 Token found:", !!token);

//   const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
//   const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

//   if (isProtected) {
//     if (!token) {
//       console.log("❌ No token — redirecting to login");
//       return NextResponse.redirect(new URL("/login", req.url));
//     }

//     try {
//       // ✅ jose uses Uint8Array secret, not plain string
//       const secret = new TextEncoder().encode(JWT_SECRET);
//       await jwtVerify(token, secret);
//       console.log("✅ Token valid — allowing access");
//       return NextResponse.next();
//     } catch (err: any) {
//       console.log("❌ JWT Error:", err.message);
//       const response = NextResponse.redirect(new URL("/login", req.url));
//       response.cookies.set("token", "", { maxAge: 0, path: "/" });
//       response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
//       return response;
//     }
//   }

//   if (isAuthRoute && token) {
//     try {
//       const secret = new TextEncoder().encode(JWT_SECRET);
//       await jwtVerify(token, secret);
//       console.log("✅ Already logged in — redirecting to dashboard");
//       return NextResponse.redirect(new URL("/dashboard", req.url));
//     } catch {
//       return NextResponse.next();
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/authentication).*)",
//   ],
// };








import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Admin protected routes
const adminProtected = ["/dashboard"];
const adminAuthRoutes = ["/login", "/register"];

// Agent protected routes
const agentProtected  = ["/agent/dashboard"];
const agentAuthRoutes = ["/agent/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token =
    req.cookies.get("token")?.value ||
    req.cookies.get("auth_token")?.value;

  console.log("🔍 Middleware hit:", pathname);
  console.log("🔍 Token found:", !!token);

  const secret = new TextEncoder().encode(JWT_SECRET);

  // ── Helper: verify token and return payload ──────────
  async function getPayload() {
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload;
    } catch {
      return null;
    }
  }

  // ── Helper: clear cookies and redirect ───────────────
  function redirectWithClear(url: string) {
    const res = NextResponse.redirect(new URL(url, req.url));
    res.cookies.set("token",      "", { maxAge: 0, path: "/" });
    res.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
    return res;
  }

  // ════════════════════════════════════════════════════
  // 1. ADMIN protected routes  (/dashboard/...)
  // ════════════════════════════════════════════════════
  if (adminProtected.some((r) => pathname.startsWith(r))) {
    const payload = await getPayload();

    if (!payload) {
      console.log("❌ No token — redirecting to /login");
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Agent trying to access admin dashboard → send to agent dashboard
    if (payload.role === "agent") {
      console.log("⛔ Agent tried admin route — redirecting to /agent/dashboard");
      return NextResponse.redirect(new URL("/agent/dashboard", req.url));
    }

    console.log("✅ Admin token valid — allowing access");
    return NextResponse.next();
  }

  // ════════════════════════════════════════════════════
  // 2. ADMIN auth routes (/login, /register)
  //    If already logged in → redirect to correct dashboard
  // ════════════════════════════════════════════════════
  if (adminAuthRoutes.some((r) => pathname.startsWith(r))) {
    const payload = await getPayload();
    if (payload) {
      const dest = payload.role === "agent" ? "/agent/dashboard" : "/dashboard";
      console.log("✅ Already logged in — redirecting to", dest);
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // ════════════════════════════════════════════════════
  // 3. AGENT protected routes (/agent/dashboard/...)
  // ════════════════════════════════════════════════════
  if (agentProtected.some((r) => pathname.startsWith(r))) {
    const payload = await getPayload();

    if (!payload) {
      console.log("❌ No token — redirecting to /agent/login");
      return NextResponse.redirect(new URL("/agent/login", req.url));
    }

    // Admin trying to access agent dashboard → send to admin dashboard
    if (payload.role !== "agent") {
      console.log("⛔ Admin tried agent route — redirecting to /dashboard");
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    console.log("✅ Agent token valid — allowing access");
    return NextResponse.next();
  }

  // ════════════════════════════════════════════════════
  // 4. AGENT auth route (/agent/login)
  //    If already logged in → redirect to correct dashboard
  // ════════════════════════════════════════════════════
  if (agentAuthRoutes.some((r) => pathname.startsWith(r))) {
    const payload = await getPayload();
    if (payload) {
      const dest = payload.role === "agent" ? "/agent/dashboard" : "/dashboard";
      console.log("✅ Already logged in — redirecting to", dest);
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/authentication).*)",
  ],
};
