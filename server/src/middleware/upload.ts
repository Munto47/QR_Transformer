import multer from "multer";

const maxBytes = 5 * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("仅支持图片文件"));
      return;
    }
    cb(null, true);
  },
});
