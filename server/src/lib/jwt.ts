import { createHash } from "node:crypto";
import * as jose from "jose";

const JWT_TTL_SECONDS = 2 * 60 * 60;

/** 将环境变量中的字符串派生为 32 字节密钥，避免 HMAC 密钥过短或含异常字节导致签发/校验失败 */
function getJwtSecretKeyBytes(): Uint8Array {
  const s = process.env.JWT_SECRET?.trim();
  if (!s) {
    throw new Error("JWT_SECRET 未配置");
  }
  return new Uint8Array(createHash("sha256").update(s, "utf8").digest());
}

export async function signAdminToken(): Promise<{ token: string; expiresAt: Date }> {
  const secret = getJwtSecretKeyBytes();
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
    const secret = getJwtSecretKeyBytes();
    const { payload } = await jose.jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}
