// import { NextRequest } from "next/server";
// import { jwtVerify } from "jose"; // ✅ works everywhere (edge + node)

// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// export async function getUserId(req: NextRequest): Promise<number | null> {
//   try {
//     // ✅ Read token from HttpOnly cookie (production-safe)
//     const token = req.cookies.get("token")?.value;

//     if (!token) return null;

//     const secret = new TextEncoder().encode(JWT_SECRET);
//     const { payload } = await jwtVerify(token, secret);

//     return payload.userId as number;

//   } catch (err) {
//     console.error("Auth error:", err);
//     return null;
//   }
// }

// // ✅ Helper to return 401 response
// export function unauthorizedResponse() {
//   return Response.json({ error: "Unauthorized" }, { status: 401 });
// }








// lib/auth.ts
import { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const secret = new TextEncoder().encode(JWT_SECRET);

// ================= TYPES =================

export type TokenPayload = {
  id :number ,
  role: "super_admin" | "admin" | "agent";
  userId: number;
  agentId: number | null;
  name: string;
  email: string;
};

// ================= GET TOKEN =================

export async function getTokenPayload(req: NextRequest): Promise<TokenPayload | null> {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.userId as number,
      role:
        payload.role === "super_admin"
          ? "super_admin"
          : payload.role === "agent"
          ? "agent"
          : "admin",
      userId: payload.userId as number,
      agentId: (payload.agentId as number) ?? null,
      name: (payload.name as string) ?? "",
      email: (payload.email as string) ?? "",
    };
  } catch (err) {
    console.error("Auth error:", err);
    return null;
  }
}

// ================= ROLE CHECK =================

export async function requireSuperAdmin(req: NextRequest) {
  const user = await getTokenPayload(req);
  if (!user || user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin(req: NextRequest) {
  const user = await getTokenPayload(req);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAgent(req: NextRequest) {
  const user = await getTokenPayload(req);
  if (!user || user.role !== "agent") {
    throw new Error("Unauthorized");
  }
  return user;
}



export async function requireAuth(req: NextRequest): Promise<TokenPayload> {
  const user = await getTokenPayload(req);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

// ================= TOKEN GENERATORS =================

export async function signSuperAdminToken(user: any) {
  return new SignJWT({
    role: "super_admin",
    userId: user.id,
    agentId: null,
    name: user.name,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function signAdminToken(user: any) {
  return new SignJWT({
    role: "admin",
    userId: user.id,
    agentId: null,
    name: user.name,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function signAgentToken(agent: any) {
  return new SignJWT({
    role: "agent",
    userId: agent.userId,
    agentId: agent.id,
    name: agent.name,
    email: agent.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}