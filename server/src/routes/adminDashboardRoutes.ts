import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { isValidSchool } from "../constants/schools.js";

export const adminDashboardRoutes = Router();

const MAX_LIMIT = 50;

function safeInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function handleError(e: unknown, res: Response) {
  console.error(e);
  res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "服务器内部错误" } });
}

/** 总览统计 */
adminDashboardRoutes.get(
  "/admin/stats",
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [totalLogs, todayLogs, totalActivities, todayActivities, totalDownloads] =
        await Promise.all([
          prisma.processingLog.count(),
          prisma.processingLog.count({ where: { createdAt: { gte: todayStart } } }),
          prisma.activityQr.count(),
          prisma.activityQr.count({ where: { createdAt: { gte: todayStart } } }),
          prisma.activityQr.aggregate({ _sum: { downloadCount: true } }),
        ]);

      res.json({
        success: true,
        data: {
          totalLogs,
          todayLogs,
          totalActivities,
          todayActivities,
          totalDownloads: totalDownloads._sum.downloadCount ?? 0,
        },
      });
    } catch (e) {
      handleError(e, res);
    }
  }
);

/** 分页查询转换记录（不含 imageBytes 大字段） */
adminDashboardRoutes.get(
  "/admin/processing-logs",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const limit = Math.min(safeInt(req.query.limit, 20), MAX_LIMIT);
      const page = safeInt(req.query.page, 1);
      const skip = (page - 1) * limit;
      const search =
        typeof req.query.search === "string" && req.query.search.trim()
          ? req.query.search.trim()
          : undefined;

      const where = search
        ? {
            OR: [
              { rawContent: { contains: search } },
              { extractedId: { contains: search } },
              { finalContent: { contains: search } },
              { originalName: { contains: search } },
            ],
          }
        : undefined;

      const [rows, total] = await Promise.all([
        prisma.processingLog.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          where,
          select: {
            id: true,
            rawContent: true,
            extractedId: true,
            finalContent: true,
            createdAt: true,
            mimeType: true,
            originalName: true,
            sizeBytes: true,
          },
        }),
        prisma.processingLog.count({ where }),
      ]);

      res.json({
        success: true,
        data: { rows, total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (e) {
      handleError(e, res);
    }
  }
);

/** 删除单条转换记录 */
adminDashboardRoutes.delete(
  "/admin/processing-logs/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      await prisma.processingLog.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e) {
      handleError(e, res);
    }
  }
);

/** 分页查询活动二维码（不含 imageBytes） */
adminDashboardRoutes.get(
  "/admin/activity-qrs",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const limit = Math.min(safeInt(req.query.limit, 20), MAX_LIMIT);
      const page = safeInt(req.query.page, 1);
      const skip = (page - 1) * limit;
      const schoolRaw = typeof req.query.school === "string" ? req.query.school.trim() : "";
      const dateFrom = typeof req.query.dateFrom === "string" ? req.query.dateFrom : undefined;
      const dateTo = typeof req.query.dateTo === "string" ? req.query.dateTo : undefined;
      const search =
        typeof req.query.search === "string" && req.query.search.trim()
          ? req.query.search.trim()
          : undefined;

      const where: Record<string, unknown> = {};
      if (schoolRaw && isValidSchool(schoolRaw)) where.school = schoolRaw;
      if (dateFrom || dateTo) {
        where.createdAt = {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        };
      }
      if (search) {
        where.activityName = { contains: search };
      }

      const [rows, total] = await Promise.all([
        prisma.activityQr.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          where,
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
        }),
        prisma.activityQr.count({ where }),
      ]);

      res.json({
        success: true,
        data: { rows, total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (e) {
      handleError(e, res);
    }
  }
);

/** 删除活动二维码 */
adminDashboardRoutes.delete(
  "/admin/activity-qrs/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      await prisma.activityQr.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e) {
      handleError(e, res);
    }
  }
);
