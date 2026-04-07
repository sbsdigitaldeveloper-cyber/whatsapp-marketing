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
// lib/auth.ts
import { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const secret     = new TextEncoder().encode(JWT_SECRET);

export async function getUserId(req: NextRequest): Promise<number | null> {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as number;
  } catch (err) {
    console.error("Auth error:", err);
    return null;
  }
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export type TokenPayload = {
  role:    "admin" | "agent";
  userId:  number;
  agentId: number | null;
  name:    string;
  email:   string;
};

export async function getTokenPayload(req: NextRequest): Promise<TokenPayload | null> {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return {
      role:    (payload.role as string) === "agent" ? "agent" : "admin",
      userId:  payload.userId  as number,
      agentId: (payload.agentId as number) ?? null,
      name:    (payload.name   as string)  ?? "",
      email:   (payload.email  as string)  ?? "",
    };
  } catch (err) {
    console.error("Auth error:", err);
    return null;
  }
}

export async function getAgentId(req: NextRequest): Promise<number | null> {
  const payload = await getTokenPayload(req);
  if (!payload || payload.role !== "agent") return null;
  return payload.agentId;
}

export async function signAgentToken(agent: {
  id:     number;
  userId: number;
  name:   string;
  email:  string;
}): Promise<string> {
  return new SignJWT({
    role:    "agent",
    agentId: agent.id,
    userId:  agent.userId,
    name:    agent.name,
    email:   agent.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}