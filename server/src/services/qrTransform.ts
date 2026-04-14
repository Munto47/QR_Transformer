import { createRequire } from "node:module";
import { Jimp } from "jimp";

const require = createRequire(import.meta.url);
const jsQR = require("jsqr") as (
  data: Uint8ClampedArray,
  width: number,
  height: number
) => { data: string } | null;

export type TransformSuccess = {
  rawContent: string;
  extractedId: string;
  finalObject: Record<string, unknown>;
  finalContent: string;
};

export class QrTransformError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "QrTransformError";
  }
}

const FINAL_TEMPLATE = {
  businessId: "",
  type: 2,
  content: null,
  url: "/pages/home/recommendation/eventDetails",
} as const;

export async function transformQrImage(buffer: Buffer): Promise<TransformSuccess> {
  let image;
  try {
    image = await Jimp.read(buffer);
  } catch {
    throw new QrTransformError(
      "INVALID_IMAGE",
      "无法读取图片，请上传有效的图片文件",
      400
    );
  }

  const { width, height, data } = image.bitmap;
  if (!width || !height || !data?.length) {
    throw new QrTransformError(
      "INVALID_IMAGE",
      "图片尺寸无效",
      400
    );
  }

  const rgba = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
  const result = jsQR(rgba, width, height);

  if (!result?.data) {
    throw new QrTransformError(
      "QR_NOT_FOUND",
      "未在图片中识别到二维码",
      422
    );
  }

  const rawContent = result.data;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new QrTransformError(
      "INVALID_JSON",
      "二维码内容不是合法的 JSON",
      422
    );
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new QrTransformError(
      "INVALID_FORMAT",
      "二维码 JSON 必须是对象",
      422
    );
  }

  const activityId = (parsed as Record<string, unknown>).activityId;
  if (activityId === undefined || activityId === null) {
    throw new QrTransformError(
      "MISSING_ACTIVITY_ID",
      "JSON 中缺少 activityId 字段",
      422
    );
  }

  const extractedId =
    typeof activityId === "string"
      ? activityId
      : typeof activityId === "number" || typeof activityId === "boolean"
        ? String(activityId)
        : "";

  if (!extractedId) {
    throw new QrTransformError(
      "MISSING_ACTIVITY_ID",
      "activityId 必须是可转换为字符串的值",
      422
    );
  }

  const finalObject = {
    ...FINAL_TEMPLATE,
    businessId: extractedId,
  } as Record<string, unknown>;

  const finalContent = JSON.stringify(finalObject);

  return {
    rawContent,
    extractedId,
    finalObject,
    finalContent,
  };
}
