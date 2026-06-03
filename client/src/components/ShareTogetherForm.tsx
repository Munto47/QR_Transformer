import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, X } from "lucide-react";
import { shareActivityQr, fetchSchoolStats } from "../api/activityQr";
import { getErrorMessage } from "../api/qr";
import { DEFAULT_ACTIVITY_SCHOOL, SCHOOL_OPTIONS } from "../constants/schools";

type Props = {
  qrPayload: string;
  onClose: () => void;
  onSuccess: () => void;
};

type SchoolStats = { activityCount: number; totalDownloads: number };

export function ShareTogetherForm({ qrPayload, onClose, onSuccess }: Props) {
  const [school, setSchool] = useState<string>(DEFAULT_ACTIVITY_SCHOOL);
  const [activityTitle, setActivityTitle] = useState("");
  const [signInLocal, setSignInLocal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SchoolStats | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const title = activityTitle.trim();
    if (!title) { setError("请填写活动标题"); return; }
    let signInAt: string | null = null;
    if (signInLocal) {
      const d = new Date(signInLocal);
      if (Number.isNaN(d.getTime())) { setError("签到开始时间无效"); return; }
      signInAt = d.toISOString();
    }
    setBusy(true);
    try {
      await shareActivityQr({ school, activityName: title, signInAt, qrPayload });
      onSuccess();
      // 拉取学校统计，展示正反馈
      const s = await fetchSchoolStats(school).catch(() => null);
      setStats(s);
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="border-b border-zinc-200/90 bg-white/95 py-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/95"
      role="region"
      aria-label="大家一起用投稿"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">大家一起用</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            aria-label="关闭"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* 投稿成功后的反馈横幅 */}
        {stats !== null ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2 py-4 text-center"
          >
            <CheckCircle className="h-8 w-8 text-emerald-500" strokeWidth={1.75} />
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              投稿成功！
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              你的活动已加入{school}活动库。
              该校目前共有{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {stats.activityCount}
              </span>{" "}
              个活动，累计下载{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {stats.totalDownloads}
              </span>{" "}
              次 🎉
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              把海报发到班级群，让更多同学直接扫码签到吧！
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              好的
            </button>
          </motion.div>
        ) : (
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
          >
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              选择学校
              <select
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {SCHOOL_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 sm:col-span-2">
              活动标题
              <input
                type="text"
                required
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                placeholder="必填"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              签到开始时间（选填）
              <input
                type="datetime-local"
                value={signInLocal}
                onChange={(e) => setSignInLocal(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1 lg:flex-row lg:items-center lg:justify-end">
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50 lg:w-auto"
              >
                {busy ? "提交中…" : "投稿"}
              </button>
            </div>
            {error && (
              <p className="col-span-full mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </motion.div>
  );
}
