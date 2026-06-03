import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import QRCode from "qrcode";
import { isValidSchool } from "../constants/schools.js";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { upload } from "../middleware/upload.js";
import { resolveActivityStoredImage } from "../services/activityQrImage.js";

export const activityQrRoutes = Router();

const MAX_QR_PAYLOAD_LENGTH = 16_384;

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

/** 公开：将当前转换得到的二维码内容投稿为「大家一起用」活动 */
activityQrRoutes.post(
  "/activity-qrs/share",
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown> | undefined;
      const school =
        typeof body?.school === "string" ? body.school.trim() : "";
      const activityName =
        typeof body?.activityName === "string"
          ? body.activityName.trim()
          : "";
      const signInAtRaw =
        typeof body?.signInAt === "string" ? body.signInAt.trim() : "";
      const qrPayload =
        typeof body?.qrPayload === "string" ? body.qrPayload : "";

      if (!school || !isValidSchool(school)) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "请选择有效学校" },
        });
        return;
      }
      if (!activityName) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "请填写活动标题" },
        });
        return;
      }
      if (!qrPayload || qrPayload.length > MAX_QR_PAYLOAD_LENGTH) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "二维码内容无效或过长",
          },
        });
        return;
      }

      let signInAt: Date | null = null;
      if (signInAtRaw) {
        const d = new Date(signInAtRaw);
        if (Number.isNaN(d.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "签到开始时间格式无效",
            },
          });
          return;
        }
        signInAt = d;
      }

      const activityAt = signInAt ?? new Date();

      let png: Buffer;
      try {
        png = await QRCode.toBuffer(qrPayload, {
          width: 280,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#18181b", light: "#ffffff" },
        });
      } catch (e) {
        console.error("share QR render failed", e);
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "无法根据内容生成二维码图片",
          },
        });
        return;
      }

      const row = await prisma.activityQr.create({
        data: {
          activityName,
          activityAt,
          school,
          signInAt,
          imageBytes: new Uint8Array(png),
          mimeType: "image/png",
          originalName: null,
          sizeBytes: png.length,
        },
        select: {
          id: true,
          activityName: true,
          activityAt: true,
          school: true,
          signInAt: true,
          createdAt: true,
          mimeType: true,
          originalName: true,
          sizeBytes: true,
        },
      });

      res.json({ success: true, data: row });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
      });
    }
  }
);

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
      const schoolRaw =
        typeof req.body?.school === "string" ? req.body.school.trim() : "";
      const signInAtRaw =
        typeof req.body?.signInAt === "string"
          ? req.body.signInAt.trim()
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
      if (!schoolRaw || !isValidSchool(schoolRaw)) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "请选择有效学校" },
        });
        return;
      }

      let signInAt: Date | null = null;
      if (signInAtRaw) {
        const d = new Date(signInAtRaw);
        if (Number.isNaN(d.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "签到开始时间格式无效",
            },
          });
          return;
        }
        signInAt = d;
      }

      const stored = await resolveActivityStoredImage(file);

      const row = await prisma.activityQr.create({
        data: {
          activityName,
          activityAt,
          school: schoolRaw,
          signInAt,
          imageBytes: Buffer.from(stored.imageBytes),
          mimeType: stored.mimeType,
          originalName: file.originalname || null,
          sizeBytes: stored.sizeBytes,
        },
        select: {
          id: true,
          activityName: true,
          activityAt: true,
          school: true,
          signInAt: true,
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

/** 本周热门活动（按下载数排序，静态路由须在 /:id 之前） */
activityQrRoutes.get("/activity-qrs/hot", async (_req: Request, res: Response) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await prisma.activityQr.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, downloadCount: { gt: 0 } },
      orderBy: { downloadCount: "desc" },
      take: 5,
      select: {
        id: true,
        activityName: true,
        activityAt: true,
        school: true,
        signInAt: true,
        createdAt: true,
        mimeType: true,
        originalName: true,
        sizeBytes: true,
        downloadCount: true,
      },
    });
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "服务器内部错误" } });
  }
});

/** 学校活动统计（投稿成功后反馈用） */
activityQrRoutes.get("/activity-qrs/school-stats", async (req: Request, res: Response) => {
  try {
    const school = typeof req.query.school === "string" ? req.query.school.trim() : "";
    if (!school || !isValidSchool(school)) {
      res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "请提供有效学校" } });
      return;
    }
    const [activityCount, agg] = await Promise.all([
      prisma.activityQr.count({ where: { school } }),
      prisma.activityQr.aggregate({ where: { school }, _sum: { downloadCount: true } }),
    ]);
    res.json({
      success: true,
      data: { activityCount, totalDownloads: agg._sum.downloadCount ?? 0 },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "服务器内部错误" } });
  }
});

activityQrRoutes.get("/activity-qrs", async (req: Request, res: Response) => {
  try {
    const schoolParam = req.query.school;
    if (typeof schoolParam !== "string" || !isValidSchool(schoolParam)) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "请提供有效的 school 查询参数",
        },
      });
      return;
    }

    // 用 Prisma ORM 查询，兼容所有数据库；用 JS 按"与当前时间接近程度"排序
    const all = await prisma.activityQr.findMany({
      where: { school: schoolParam },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        activityName: true,
        activityAt: true,
        school: true,
        signInAt: true,
        createdAt: true,
        mimeType: true,
        originalName: true,
        sizeBytes: true,
        downloadCount: true,
      },
    });

    const now = Date.now();
    const sorted = all
      .sort((a, b) => {
        const aMs = (a.signInAt ?? a.activityAt ?? a.createdAt).getTime();
        const bMs = (b.signInAt ?? b.activityAt ?? b.createdAt).getTime();
        return Math.abs(aMs - now) - Math.abs(bMs - now);
      })
      .slice(0, 10);

    res.json({ success: true, data: sorted });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
    });
  }
});

/** 下载图片并自增 downloadCount */
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
      // 异步自增，不阻塞响应
      prisma.activityQr
        .update({ where: { id: req.params.id }, data: { downloadCount: { increment: 1 } } })
        .catch((e: unknown) => console.error("downloadCount increment failed", e));

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
