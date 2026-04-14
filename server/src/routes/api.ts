import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { upload } from "../middleware/upload.js";
import { transformQrImage, QrTransformError } from "../services/qrTransform.js";

export const apiRouter = Router();

function handleError(err: unknown, res: Response) {
  if (err instanceof QrTransformError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }
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
    error: {
      code: "INTERNAL_ERROR",
      message: "服务器内部错误",
    },
  });
}

apiRouter.post(
  "/transform",
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        handleError(err, res);
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file?.buffer?.length) {
        res.status(400).json({
          success: false,
          error: {
            code: "FILE_REQUIRED",
            message: "请上传图片文件（字段名 image）",
          },
        });
        return;
      }

      const out = await transformQrImage(file.buffer);

      await prisma.processingLog.create({
        data: {
          rawContent: out.rawContent,
          extractedId: out.extractedId,
          finalContent: out.finalContent,
        },
      });

      res.json({
        success: true,
        data: {
          raw: out.rawContent,
          extractedId: out.extractedId,
          final: out.finalObject,
          finalContent: out.finalContent,
        },
      });
    } catch (e) {
      handleError(e, res);
    }
  }
);

apiRouter.get("/processing-logs", async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.processingLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ success: true, data: logs });
  } catch (e) {
    handleError(e, res);
  }
});
