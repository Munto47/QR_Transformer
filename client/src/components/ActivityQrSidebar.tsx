import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { fetchActivityQrs } from "../api/activityQr";
import type { ActivityQr } from "../api/types";

type Props = {
  /** 递增以触发重新拉取列表 */
  refreshKey: number;
};

function formatActivityAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ActivityQrSidebar({ refreshKey }: Props) {
  const [items, setItems] = useState<ActivityQr[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await fetchActivityQrs();
      setItems(data);
    } catch {
      setErr("活动列表加载失败");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <aside
      className="w-full shrink-0 lg:sticky lg:top-[4.5rem] lg:w-80 lg:self-start"
      aria-label="近期活动二维码"
    >
      <div className="rounded-2xl border border-zinc-200/90 bg-white/80 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          近期活动
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          按与当前时间接近程度排序，最多 5 条
        </p>

        {loading && (
          <p className="mt-4 text-sm text-zinc-500">加载中…</p>
        )}
        {err && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {err}
          </p>
        )}
        {!loading && !err && items.length === 0 && (
          <p className="mt-4 text-sm text-zinc-500">暂无活动二维码</p>
        )}

        <ul className="mt-4 space-y-4">
          {items.map((item, i) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 dark:border-white/5 dark:bg-zinc-900/40"
            >
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {item.activityName}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                {formatActivityAt(item.activityAt)}
              </p>
              <div className="mt-3 flex justify-center rounded-lg bg-white p-2 dark:bg-zinc-950/50">
                <img
                  src={`/api/activity-qrs/${item.id}/image`}
                  alt=""
                  className="max-h-40 w-auto max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
