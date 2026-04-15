import * as jose from "jose";

const JWT_TTL_SECONDS = 2 * 60 * 60;

function getJwtSecret(): Uint8Array {
  const s = process.env.JWT_SECRET?.trim();
  if (!s) {
    throw new Error("JWT_SECRET 未配置");
  }
  return new TextEncoder().encode(s);
}

export async function signAdminToken(): Promise<{ token: string; expiresAt: Date }> {
  const secret = getJwtSecret();
  const expiresAt = new Date(Date.now() + JWT_TTL_SECONDS * 1000);
  const token = await new jose.SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);
  return { token, expiresAt };
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}
