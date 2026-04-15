import type { NextFunction, Request, Response } from "express";
import { verifyAdminToken } from "../lib/jwt.js";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "需要管理员登录" },
    });
    return;
  }
  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "需要管理员登录" },
    });
    return;
  }
  const ok = await verifyAdminToken(token);
  if (!ok) {
    res.status(401).json({
      success: false,
      error: { code: "INVALID_TOKEN", message: "登录已失效，请重新登录" },
    });
    return;
  }
  next();
}
