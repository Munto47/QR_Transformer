import QRCode from "qrcode";
import { transformQrImage, QrTransformError } from "./qrTransform.js";

type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

/**
 * 若上传图可经 {@link transformQrImage} 转换，则用转换后的内容生成 PNG 再入库；
 * 否则保留原始上传图（与主站「解析失败仍可展示原图」一致）。
 */
export async function resolveActivityStoredImage(
  file: UploadedImage
): Promise<{
  imageBytes: Uint8Array;
  mimeType: string;
  sizeBytes: number;
  usedTransform: boolean;
}> {
  const buf = file.buffer;
  const original = (): {
    imageBytes: Uint8Array;
    mimeType: string;
    sizeBytes: number;
    usedTransform: boolean;
  } => ({
    imageBytes: new Uint8Array(buf),
    mimeType: file.mimetype,
    sizeBytes: file.size,
    usedTransform: false,
  });

  try {
    const out = await transformQrImage(Buffer.from(buf));
    try {
      const png: Buffer = await QRCode.toBuffer(out.finalContent, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#18181b", light: "#ffffff" },
      });
      return {
        imageBytes: new Uint8Array(png),
        mimeType: "image/png",
        sizeBytes: png.length,
        usedTransform: true,
      };
    } catch (renderErr) {
      console.error("activity QR PNG render failed", renderErr);
      return original();
    }
  } catch (e) {
    if (e instanceof QrTransformError) {
      // 不符合转换格式或无法解析：直接使用上传文件
    } else {
      console.error("activity QR transform unexpected error", e);
    }
    return original();
  }
}
