import QRCode from "qrcode";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  /** 解析得到的内容，用于客户端生成新二维码 */
  payload: string | null;
  /** 用户上传的原图预览（object URL） */
  originalSrc?: string | null;
};

function QrInner({
  payload,
  originalSrc,
}: {
  payload: string;
  originalSrc: string | null;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#18181b", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null);
          setError("生成失败");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        {error}
      </div>
    );
  }

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
        <div className="flex flex-1 flex-col items-center justify-center gap-5 rounded-xl bg-zinc-100/80 p-4 dark:bg-zinc-900/50">
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
              <a
                href={dataUrl}
                download="qr-transformer.png"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
              >
                <Download className="h-4 w-4" strokeWidth={2} />
                免费下载
              </a>
              <p className="text-center text-xs text-zinc-500">
                保存为 PNG 到本地设备
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

/**
 * 结果区：有 payload 时展示原图与新二维码对比；无 payload 时不渲染占位（由页面其它区域承担引导）
 */
export function QrDisplay({ payload, originalSrc = null }: Props) {
  if (!payload) return null;

  return (
    <section
      className="mx-auto max-w-5xl px-5 md:px-8"
      aria-label="转换结果"
    >
      <h2 className="mb-6 text-sm font-medium text-zinc-500">转换结果</h2>
      <QrInner payload={payload} originalSrc={originalSrc} />
    </section>
  );
}
