import crypto from "node:crypto";
import { Router, type Request, type Response } from "express";
import { signAdminToken } from "../lib/jwt.js";

export const adminRoutes = Router();

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

adminRoutes.post("/admin/login", async (req: Request, res: Response) => {
  try {
    const password =
      typeof req.body?.password === "string" ? req.body.password.trim() : "";
    const expected = process.env.ADMIN_PASSWORD?.trim();
    if (!expected) {
      console.error("ADMIN_PASSWORD 未配置");
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_MISCONFIGURED",
          message: "服务器未配置管理员口令",
        },
      });
      return;
    }
    if (!timingSafeStringEqual(password, expected)) {
      res.status(401).json({
        success: false,
        error: { code: "INVALID_PASSWORD", message: "密码错误" },
      });
      return;
    }
    const { token, expiresAt } = await signAdminToken();
    res.json({
      success: true,
      data: { token, expiresAt: expiresAt.toISOString() },
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("JWT_SECRET")) {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_MISCONFIGURED",
          message: "服务器未配置 JWT_SECRET",
        },
      });
      return;
    }
    console.error(e);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
    });
  }
});
