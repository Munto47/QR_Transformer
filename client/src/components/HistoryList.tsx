import QRCode from "qrcode";
import { useEffect, useState } from "react";
import type { ProcessingLog } from "../api/types";

type Props = {
  logs: ProcessingLog[];
  loading?: boolean;
};

function HistoryQr({ payload }: { payload: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, {
      width: 160,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (!dataUrl) {
    return (
      <div className="flex h-[160px] w-[160px] items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-xs text-zinc-400 dark:border-white/10 dark:bg-zinc-900/40">
        …
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt=""
      width={160}
      height={160}
      className="rounded-xl border border-zinc-200/80 dark:border-white/10"
    />
  );
}

export function HistoryList({ logs, loading }: Props) {
  /** 接口按 createdAt 降序，取最新 2 条 */
  const recent = logs.slice(0, 2);

  if (loading && logs.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200/90 bg-white/70 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
        <p className="text-sm text-zinc-500">正在加载记录…</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200/90 bg-white/70 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          历史记录
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          仅展示最近 2 条生成结果
        </p>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-zinc-500">暂无记录</p>
      ) : (
        <ul className="grid grid-cols-2 gap-6">
          {recent.map((log) => (
            <li key={log.id} className="flex flex-col items-center gap-2">
              <HistoryQr payload={log.finalContent} />
              <time
                className="text-xs text-zinc-500 dark:text-zinc-400"
                dateTime={log.createdAt}
              >
                {new Date(log.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
