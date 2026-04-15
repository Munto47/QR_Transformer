import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { shareActivityQr } from "../api/activityQr";
import { getErrorMessage } from "../api/qr";
import { DEFAULT_ACTIVITY_SCHOOL, SCHOOL_OPTIONS } from "../constants/schools";

type Props = {
  qrPayload: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ShareTogetherForm({
  qrPayload,
  onClose,
  onSuccess,
}: Props) {
  const [school, setSchool] = useState<string>(DEFAULT_ACTIVITY_SCHOOL);
  const [activityTitle, setActivityTitle] = useState("");
  /** datetime-local 值，空表示不填签到时间 */
  const [signInLocal, setSignInLocal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const title = activityTitle.trim();
    if (!title) {
      setError("请填写活动标题");
      return;
    }
    let signInAt: string | null = null;
    if (signInLocal) {
      const d = new Date(signInLocal);
      if (Number.isNaN(d.getTime())) {
        setError("签到开始时间无效");
        return;
      }
      signInAt = d.toISOString();
    }
    setBusy(true);
    try {
      await shareActivityQr({
        school,
        activityName: title,
        signInAt,
        qrPayload,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
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
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            大家一起用
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            aria-label="关闭"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
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
                <option key={s} value={s}>
                  {s}
                </option>
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
            活动签到开始时间（选填）
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
              {busy ? "提交中…" : "提交"}
            </button>
          </div>
        </form>
        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </motion.div>
  );
}
