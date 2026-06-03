import QRCode from "qrcode";
import { motion } from "framer-motion";
import { Check, Copy, Download, Users } from "lucide-react";
import { useEffect, useState } from "react";

const SITE_URL = "www.breezecode.top";

type QrMeta = {
  rawContent: string;
  convertedAt: number;
};

type Props = {
  payload: string | null;
  originalSrc?: string | null;
  onShareTogether?: () => void;
  qrMeta?: QrMeta | null;
};

/** 从原始 QR JSON 中尝试提取活动主题，找不到返回 null */
function extractActivityName(rawContent: string): string | null {
  try {
    const obj = JSON.parse(rawContent) as Record<string, unknown>;
    for (const key of ["activityName", "name", "title", "activityTitle", "eventName"]) {
      if (typeof obj[key] === "string" && (obj[key] as string).trim()) {
        return (obj[key] as string).trim();
      }
    }
    return null;
  } catch {
    return null;
  }
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 用 Canvas 将二维码、活动信息、网址合成为一张 PNG，返回 dataURL。
 * activityName 为 null 时不绘制顶部文字区。
 */
async function buildCompositeDataUrl(
  qrDataUrl: string,
  activityName: string | null,
  convertedAt: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const qrImg = new Image();
    qrImg.onload = () => {
      const pad = 28;
      const qrSize = 280;
      const canvasW = qrSize + pad * 2;

      // 顶部文字区高度（仅有活动名时才显示）
      const topH = activityName ? 22 + 4 + 16 + 16 : 0; // name行 + 间距 + time行 + QR前间距

      // 底部：网址行 + 下边距
      const bottomH = 14 + 20;

      const canvasH = pad + topH + qrSize + 12 + bottomH;

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas context unavailable")); return; }

      // 白色背景
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasW, canvasH);

      let y = pad;

      if (activityName) {
        // 活动主题（深色加粗）
        ctx.fillStyle = "#1e1b4b";
        ctx.font = "bold 16px system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(activityName, canvasW / 2, y, qrSize);
        y += 22 + 4;

        // 制造时间（靛蓝色）
        ctx.fillStyle = "#6366f1";
        ctx.font = "12px system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif";
        ctx.fillText(formatDateTime(convertedAt), canvasW / 2, y, qrSize);
        y += 16 + 16;
      }

      // 二维码
      ctx.drawImage(qrImg, pad, y, qrSize, qrSize);
      y += qrSize + 12;

      // 项目网址（灰色小字）
      ctx.fillStyle = "#71717a";
      ctx.font = "11px system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(SITE_URL, canvasW / 2, y, qrSize);

      resolve(canvas.toDataURL("image/png"));
    };
    qrImg.onerror = () => reject(new Error("QR image load failed"));
    qrImg.src = qrDataUrl;
  });
}

function buildShareUrl(payload: string): string {
  const encoded = btoa(encodeURIComponent(payload));
  return `${window.location.origin}/?p=${encoded}`;
}

function CopyShareLink({ payload }: { payload: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(payload));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级静默失败
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800/60 sm:min-w-[140px]"
      title="复制分享链接，发给同学直接打开"
    >
      {copied ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
      ) : (
        <Copy className="h-4 w-4 shrink-0" strokeWidth={2} />
      )}
      {copied ? "已复制！" : "复制链接"}
    </button>
  );
}

function QrInner({
  payload,
  originalSrc,
  onShareTogether,
  qrMeta,
}: {
  payload: string;
  originalSrc: string | null;
  onShareTogether?: () => void;
  qrMeta?: QrMeta | null;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 生成裸二维码
  useEffect(() => {
    let cancelled = false;
    setCompositeUrl(null);
    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#18181b", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) { setDataUrl(url); setError(null); }
      })
      .catch(() => {
        if (!cancelled) { setDataUrl(null); setError("生成失败"); }
      });
    return () => { cancelled = true; };
  }, [payload]);

  // 有裸二维码后，合成带信息的完整图片
  useEffect(() => {
    if (!dataUrl) return;
    let cancelled = false;
    const activityName = qrMeta ? extractActivityName(qrMeta.rawContent) : null;
    const convertedAt = qrMeta?.convertedAt ?? Date.now();
    buildCompositeDataUrl(dataUrl, activityName, convertedAt)
      .then((url) => { if (!cancelled) setCompositeUrl(url); })
      .catch(() => { /* 合成失败时下载降级为裸 QR */ });
    return () => { cancelled = true; };
  }, [dataUrl, qrMeta]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        {error}
      </div>
    );
  }

  // 提取活动名（仅用于 UI 展示判断）
  const activityName = qrMeta ? extractActivityName(qrMeta.rawContent) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="grid gap-6 md:grid-cols-2 md:gap-8"
    >
      {/* 原图 */}
      <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          原始图片
        </p>
        <div className="flex flex-1 items-center justify-center rounded-xl bg-zinc-100/80 p-3 dark:bg-zinc-900/50">
          {originalSrc ? (
            <img
              src={originalSrc}
              alt=""
              className="max-h-[min(50vh,320px)] w-full max-w-[280px] rounded-lg object-contain"
            />
          ) : (
            <p className="text-sm text-zinc-500">无预览</p>
          )}
        </div>
      </div>

      {/* 新二维码 */}
      <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          焕新二维码
        </p>

        {/* 活动信息头部：仅在识别到活动名时显示 */}
        {activityName && qrMeta && (
          <div className="mb-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2.5 dark:border-indigo-500/20 dark:bg-indigo-950/30">
            <p className="text-[11px] font-medium uppercase tracking-wider text-indigo-400 dark:text-indigo-500">
              活动主题
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {activityName}
            </p>
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-indigo-400 dark:text-indigo-500">
              制造时间
            </p>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">
              {formatDateTime(qrMeta.convertedAt)}
            </p>
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl bg-zinc-100/80 p-4 dark:bg-zinc-900/50">
          {dataUrl ? (
            <>
              <motion.img
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                src={dataUrl}
                alt=""
                width={280}
                height={280}
                className="rounded-xl border border-zinc-200/90 dark:border-zinc-700/80"
              />

              {/* 项目网址 */}
              <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
                {SITE_URL}
              </p>

              <div className="flex w-full max-w-[min(100%,380px)] flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
                {/* 下载合成图（含活动信息 + 网址），合成完成前降级为裸 QR */}
                <a
                  href={compositeUrl ?? dataUrl}
                  download="qr-breezecode.png"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 sm:min-w-[120px]"
                >
                  <Download className="h-4 w-4 shrink-0" strokeWidth={2} />
                  {compositeUrl ? "免费下载" : "生成中…"}
                </a>
                <CopyShareLink payload={payload} />
                {onShareTogether && (
                  <button
                    type="button"
                    onClick={onShareTogether}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:border-indigo-500/40 dark:bg-zinc-900/80 dark:text-indigo-300 dark:hover:bg-indigo-950/50 sm:min-w-[120px]"
                  >
                    <Users className="h-4 w-4 shrink-0" strokeWidth={2} />
                    大家一起用
                  </button>
                )}
              </div>
              <p className="text-center text-xs text-zinc-500">
                下载 PNG · 复制链接发给同学 · 投稿到活动列表
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-500">生成中…</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function QrDisplay({ payload, originalSrc = null, onShareTogether, qrMeta }: Props) {
  if (!payload) return null;

  return (
    <section className="w-full" aria-label="转换结果">
      <h2 className="mb-6 text-sm font-medium text-zinc-500">转换结果</h2>
      <QrInner payload={payload} originalSrc={originalSrc} onShareTogether={onShareTogether} qrMeta={qrMeta} />
    </section>
  );
}
