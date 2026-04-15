import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, PlusCircle, Shield } from "lucide-react";
import { loginAdmin } from "../api/admin";
import { createActivityQr } from "../api/activityQr";
import { clearAdminToken } from "../api/authStorage";
import { getErrorMessage } from "../api/qr";

type Props = {
  /** 由父组件与 sessionStorage 同步 */
  adminLoggedIn: boolean;
  onLoginStateChange: (loggedIn: boolean) => void;
  onActivityCreated: () => void;
};

export function AdminToolbar({
  adminLoggedIn,
  onLoginStateChange,
  onActivityCreated,
}: Props) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activityName, setActivityName] = useState("");
  const [activityAt, setActivityAt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const closeLogin = () => {
    setLoginOpen(false);
    setPassword("");
    setError(null);
  };

  const closeSubmit = () => {
    setSubmitOpen(false);
    setActivityName("");
    setActivityAt("");
    setImageFile(null);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password.trim()) {
      setError("请输入密码");
      return;
    }
    setBusy(true);
    try {
      await loginAdmin(password);
      onLoginStateChange(true);
      closeLogin();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    onLoginStateChange(false);
    closeSubmit();
    closeLogin();
  };

  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!activityName.trim()) {
      setError("请填写活动名称");
      return;
    }
    if (!activityAt) {
      setError("请选择活动时间");
      return;
    }
    const iso = new Date(activityAt).toISOString();
    if (Number.isNaN(Date.parse(iso))) {
      setError("活动时间无效");
      return;
    }
    if (!imageFile) {
      setError("请选择二维码图片");
      return;
    }
    setBusy(true);
    try {
      await createActivityQr({
        activityName: activityName.trim(),
        activityAt: iso,
        image: imageFile,
      });
      onActivityCreated();
      closeSubmit();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-0.5">
        {!adminLoggedIn ? (
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200 md:px-3"
            aria-label="管理员登录"
          >
            <Shield className="h-[17px] w-[17px]" strokeWidth={1.75} />
            <span className="hidden sm:inline">管理员</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 md:px-3"
              aria-label="提交活动二维码"
            >
              <PlusCircle className="h-[17px] w-[17px]" strokeWidth={1.75} />
              <span className="hidden sm:inline">活动二维码</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 items-center gap-1.5 rounded-xl px-2 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
              aria-label="退出管理员"
            >
              <LogOut className="h-[17px] w-[17px]" strokeWidth={1.75} />
              <span className="hidden sm:inline">退出</span>
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {loginOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-login-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/45 p-4 pb-10 pt-[min(14vh,4rem)] backdrop-blur-[2px] sm:pt-[min(18vh,5.5rem)]"
            onClick={(ev) => {
              if (ev.target === ev.currentTarget) closeLogin();
            }}
          >
            <motion.form
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              onSubmit={handleLogin}
              noValidate
              className="w-full max-w-sm rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="admin-login-title"
                className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
              >
                管理员登录
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                使用服务器配置的管理员密码登录
              </p>
              <label className="mt-4 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                密码
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              {error && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeLogin}
                  className="rounded-xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  {busy ? "登录中…" : "登录"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {submitOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-submit-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/45 p-4 pb-10 pt-[min(14vh,4rem)] backdrop-blur-[2px] sm:pt-[min(18vh,5.5rem)]"
            onClick={(ev) => {
              if (ev.target === ev.currentTarget) closeSubmit();
            }}
          >
            <motion.form
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              onSubmit={handleSubmitActivity}
              noValidate
              className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="admin-submit-title"
                className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
              >
                提交活动二维码
              </h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="activity-name"
                    className="block text-xs font-medium text-zinc-600 dark:text-zinc-300"
                  >
                    活动名称
                  </label>
                  <input
                    id="activity-name"
                    type="text"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
                    placeholder="例如：春季分享会"
                  />
                </div>
                <div>
                  <label
                    htmlFor="activity-at"
                    className="block text-xs font-medium text-zinc-600 dark:text-zinc-300"
                  >
                    活动时间
                  </label>
                  <input
                    id="activity-at"
                    type="datetime-local"
                    value={activityAt}
                    onChange={(e) => setActivityAt(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="activity-image"
                    className="block text-xs font-medium text-zinc-600 dark:text-zinc-300"
                  >
                    二维码图片
                  </label>
                  <input
                    id="activity-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setImageFile(e.target.files?.[0] ?? null)
                    }
                    className="mt-1.5 w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-800 dark:text-zinc-300 dark:file:bg-white/10 dark:file:text-zinc-200"
                  />
                </div>
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeSubmit}
                  className="rounded-xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                >
                  {busy ? "提交中…" : "提交"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
