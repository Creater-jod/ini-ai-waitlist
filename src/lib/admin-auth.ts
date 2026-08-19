import { createHmac } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "iniai.in2026";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "ini-ai-session-secret-2026";
const COOKIE_NAME = "admin_session";
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SessionPayload {
  role: "admin";
  iat: number;
  exp: number;
}

function sign(payload: string): string {
  return createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex");
}

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function createSessionToken(): string {
  const payload: SessionPayload = {
    role: "admin",
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return false;

    // Verify signature
    const expectedSignature = sign(encoded);
    if (signature !== expectedSignature) return false;

    // Verify expiry
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    ) as SessionPayload;

    if (payload.role !== "admin") return false;
    if (Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
