import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { upload } from "../middleware/upload.js";
import { resolveActivityStoredImage } from "../services/activityQrImage.js";

export const activityQrRoutes = Router();

function handleMulterError(err: unknown, res: Response) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: "文件过大，最大 5MB",
        },
      });
      return;
    }
  }
  if (err instanceof Error && err.message === "仅支持图片文件") {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_FILE_TYPE", message: err.message },
    });
    return;
  }
  console.error(err);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
  });
}

activityQrRoutes.post(
  "/activity-qrs",
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        handleMulterError(err, res);
        return;
      }
      next();
    });
  },
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file?.buffer?.length) {
        res.status(400).json({
          success: false,
          error: {
            code: "FILE_REQUIRED",
            message: "请上传活动二维码图片（字段名 image）",
          },
        });
        return;
      }
      const activityName =
        typeof req.body?.activityName === "string"
          ? req.body.activityName.trim()
          : "";
      const activityAtRaw =
        typeof req.body?.activityAt === "string"
          ? req.body.activityAt.trim()
          : "";
      if (!activityName) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "请填写活动名称" },
        });
        return;
      }
      if (!activityAtRaw) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "请填写活动时间" },
        });
        return;
      }
      const activityAt = new Date(activityAtRaw);
      if (Number.isNaN(activityAt.getTime())) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "活动时间格式无效" },
        });
        return;
      }

      const stored = await resolveActivityStoredImage(file);

      const row = await prisma.activityQr.create({
        data: {
          activityName,
          activityAt,
          imageBytes: Buffer.from(stored.imageBytes),
          mimeType: stored.mimeType,
          originalName: file.originalname || null,
          sizeBytes: stored.sizeBytes,
        },
        select: {
          id: true,
          activityName: true,
          activityAt: true,
          createdAt: true,
          mimeType: true,
          originalName: true,
          sizeBytes: true,
        },
      });

      res.json({
        success: true,
        data: { ...row, usedTransform: stored.usedTransform },
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
      });
    }
  }
);

activityQrRoutes.get("/activity-qrs", async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        activityName: string;
        activityAt: Date;
        createdAt: Date;
        mimeType: string;
        originalName: string | null;
        sizeBytes: number;
      }>
    >(Prisma.sql`
      SELECT id, "activityName", "activityAt", "createdAt", "mimeType", "originalName", "sizeBytes"
      FROM "ActivityQr"
      ORDER BY abs(extract(epoch from ("activityAt" - now())))
      LIMIT 5
    `);
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
    });
  }
});

activityQrRoutes.get(
  "/activity-qrs/:id/image",
  async (req: Request, res: Response) => {
    try {
      const log = await prisma.activityQr.findUnique({
        where: { id: req.params.id },
        select: { imageBytes: true, mimeType: true },
      });
      if (!log) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "记录不存在" },
        });
        return;
      }
      res.setHeader("Content-Type", log.mimeType);
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.send(Buffer.from(log.imageBytes));
    } catch (e) {
      console.error(e);
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
      });
    }
  }
);
