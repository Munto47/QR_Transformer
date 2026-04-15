import { useCallback, useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { fetchActivityQrs } from "../api/activityQr";
import type { ActivityQr } from "../api/types";
import { DEFAULT_ACTIVITY_SCHOOL, SCHOOL_OPTIONS } from "../constants/schools";
import { downloadActivityPosterPng } from "../utils/activityPosterDownload";

const PAGE_SIZE = 5;
const MAX_ACTIVITIES = 10;

type Props = {
  /** 递增以触发重新拉取列表 */
  refreshKey: number;
};

function safeDownloadBaseName(name: string, id: string): string {
  const cleaned = name.replace(/[/\\:*?"<>|]/g, "_").trim().slice(0, 80);
  return cleaned || `activity-${id.slice(0, 8)}`;
}

const ActivityImage = memo(function ActivityImage({ id }: { id: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="mt-3 flex justify-center rounded-lg bg-white p-2 dark:bg-zinc-950/50">
      <img
        src={`/api/activity-qrs/${id}/image`}
        alt=""
        className="max-h-40 w-auto max-w-full object-contain"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
});

function formatIso(iso: string): string {
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
  const [schoolFilter, setSchoolFilter] = useState<string>(
    DEFAULT_ACTIVITY_SCHOOL
  );
  const [items, setItems] = useState<ActivityQr[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  /** 1 或 2，每页 {PAGE_SIZE} 条 */
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await fetchActivityQrs(schoolFilter);
      setItems(data);
      setPage(1);
    } catch {
      setErr("活动列表加载失败");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [schoolFilter]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const totalPages = Math.min(2, Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
  const safePage = Math.min(page, totalPages);
  const pageItems = items.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handleDownloadPoster = async (item: ActivityQr) => {
    setDownloadingId(item.id);
    try {
      await downloadActivityPosterPng({
        activityName: item.activityName,
        qrImageUrl: `/api/activity-qrs/${item.id}/image`,
        fileBaseName: safeDownloadBaseName(item.activityName, item.id),
      });
    } catch {
      // 静默失败；可后续接入 toast
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <aside
      className="w-full shrink-0 lg:sticky lg:top-[4.5rem] lg:w-80 lg:self-start"
      aria-label="近期活动二维码"
    >
      <div className="rounded-2xl border border-zinc-200/90 bg-white/80 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          近期活动
        </h2>
        <label className="mt-3 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
          筛选学校
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {SCHOOL_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          在所选学校下，按与当前时间接近程度排序，最多 {MAX_ACTIVITIES}{" "}
          条；每页 {PAGE_SIZE} 条，共 2 页
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
          {pageItems.map((item, i) => (
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
                {item.signInAt
                  ? `签到 ${formatIso(item.signInAt)}`
                  : `活动 ${formatIso(item.activityAt)}`}
              </p>
              <ActivityImage id={item.id} />
              <button
                type="button"
                disabled={downloadingId === item.id}
                onClick={() => void handleDownloadPoster(item)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                {downloadingId === item.id ? "生成中…" : "下载标题+二维码图"}
              </button>
            </motion.li>
          ))}
        </ul>

        {!loading && !err && items.length > PAGE_SIZE && (
          <nav
            className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-2 py-2 dark:border-white/5 dark:bg-zinc-900/40"
            aria-label="活动列表分页"
          >
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200/80 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              上一页
            </button>
            <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
              第 {safePage} / {totalPages} 页
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={safePage >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200/80 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              下一页
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </nav>
        )}
      </div>
    </aside>
  );
}
