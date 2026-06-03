import QRCode from "qrcode";
import { motion } from "framer-motion";
import { Clock, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { HistoryEntry } from "../utils/history";

type Props = {
  entries: HistoryEntry[];
  onRestore: (payload: string) => void;
  onClear: () => void;
};

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  return `${Math.floor(hr / 24)} 天前`;
}

function HistoryQrThumb({ payload }: { payload: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, {
      width: 80,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#18181b", light: "#ffffff" },
    })
      .then((url) => { if (!cancelled) setDataUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [payload]);

  if (!dataUrl) {
    return (
      <div className="h-14 w-14 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="历史二维码"
      width={56}
      height={56}
      className="h-14 w-14 shrink-0 rounded-lg border border-zinc-200/80 object-contain dark:border-zinc-700/60"
    />
  );
}

export function HistoryPanel({ entries, onRestore, onClear }: Props) {
  if (entries.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-zinc-200/90 bg-white/80 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]"
      aria-label="最近转换记录"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Clock className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
          最近转换记录
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/5 dark:hover:text-zinc-300"
          aria-label="清空历史"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          清空
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onRestore(entry.payload)}
              title={formatRelative(entry.at)}
              className="flex items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-2 transition hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-white/5 dark:bg-zinc-900/40 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-950/30"
            >
              <HistoryQrThumb payload={entry.payload} />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
        点击记录可恢复上次的二维码，数据仅存在本地。
      </p>
    </motion.section>
  );
}
