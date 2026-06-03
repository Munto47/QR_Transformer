import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import {
  ArrowLeft, BarChart3, Calendar, ChevronLeft, ChevronRight,
  Database, Eye, EyeOff, FileText, Loader2, Moon, Plus,
  School, Shield, Sun, Trash2, Search, X,
} from "lucide-react";
import { loginAdmin } from "../api/admin";
import { createActivityQr } from "../api/activityQr";
import { getAdminToken, clearAdminToken } from "../api/authStorage";
import { getErrorMessage } from "../api/qr";
import {
  fetchAdminStats, fetchAdminProcessingLogs, deleteAdminProcessingLog,
  fetchAdminActivityQrs, deleteAdminActivityQr,
  type AdminStats, type AdminLogRow, type AdminActivityRow, type PagedResponse,
} from "../api/adminDashboard";
import { SCHOOL_OPTIONS, DEFAULT_ACTIVITY_SCHOOL } from "../constants/schools";

const THEME_KEY = "qr-transformer-theme";
function readStoredTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

const PAGE_LIMIT = 20;
type Tab = "stats" | "logs" | "activities";

function formatTs(iso: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}
function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// ── 小型二维码渲染 ────────────────────────────────────────────────────────────
function QrMini({ payload }: { payload: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, {
      width: 96, margin: 1,
      color: { dark: "#18181b", light: "#ffffff" },
    })
      .then((url) => { if (!cancelled) setDataUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [payload]);

  if (!dataUrl) {
    return <div className="h-24 w-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />;
  }
  return (
    <img
      src={dataUrl}
      alt="二维码"
      width={96}
      height={96}
      className="rounded-lg border border-zinc-200/80 dark:border-white/10"
    />
  );
}

// ── 登录表单 ──────────────────────────────────────────────────────────────────
function LoginCard({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await loginAdmin(pwd);
      onLoggedIn();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-[380px] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-zinc-900"
      >
        <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-zinc-800 to-zinc-900 px-6 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Shield className="h-6 w-6 text-white" strokeWidth={1.75} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">QR_Transformer 管理后台</p>
            <p className="mt-0.5 text-xs text-zinc-400">请使用管理员凭据登录</p>
          </div>
        </div>
        <div className="px-6 py-6">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">账号</label>
            <div className="mt-1.5 flex h-10 items-center rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 text-sm text-zinc-400 select-none dark:border-white/5 dark:bg-zinc-800/50 dark:text-zinc-500">
              admin
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="admin-pwd" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">密码</label>
            <div className="relative mt-1.5">
              <input
                id="admin-pwd"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                autoFocus
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="请输入管理员密码"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 pr-10 text-sm text-zinc-900 outline-none ring-indigo-500/30 transition focus:border-indigo-400 focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                {showPwd ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
              </button>
            </div>
          </div>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-xl border border-red-200/60 bg-red-50 px-3 py-2.5 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400" role="alert">
              {error}
            </motion.p>
          )}
          <button type="submit" disabled={busy}
            className="mt-5 w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">
            {busy ? "验证中…" : "登录"}
          </button>
          <p className="mt-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
            仅限授权人员访问
          </p>
        </div>
      </motion.form>
    </div>
  );
}

// ── 概览 ──────────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{value.toLocaleString()}</p>
      {sub && <p className="mt-0.5 text-[11px] text-zinc-400">{sub}</p>}
    </div>
  );
}

function StatsTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminStats().then(setStats).catch((e) => setErr(getErrorMessage(e))).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-zinc-400" />;
  if (err) return <p className="mt-8 text-center text-sm text-red-600">{err}</p>;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <StatCard label="累计转换" value={stats.totalLogs} sub="次" />
      <StatCard label="今日转换" value={stats.todayLogs} sub="次" />
      <StatCard label="活动二维码" value={stats.totalActivities} sub="条" />
      <StatCard label="今日新增" value={stats.todayActivities} sub="条" />
      <StatCard label="累计下载" value={stats.totalDownloads} sub="次" />
    </div>
  );
}

// ── 分页 ──────────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 dark:border-white/5 dark:bg-zinc-900/40">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200/80 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800">
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />上一页
      </button>
      <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-400">第 {page} / {totalPages} 页</span>
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200/80 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800">
        下一页<ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

// ── 转换记录 Tab（卡片 + 二维码） ─────────────────────────────────────────────
function LogsTab() {
  const [paged, setPaged] = useState<PagedResponse<AdminLogRow> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminProcessingLogs(page, PAGE_LIMIT, debouncedSearch || undefined);
      setPaged(data);
    } catch { /* 静默 */ }
    finally { setLoading(false); }
  }, [page, debouncedSearch]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除这条记录？")) return;
    setDeletingId(id);
    try { await deleteAdminProcessingLog(id); void load(); }
    catch { /* 静默 */ }
    finally { setDeletingId(null); }
  };

  return (
    <div>
      {/* 搜索栏 */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" strokeWidth={2} />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索内容或 ID…"
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100" />
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
      </div>

      <p className="mb-4 text-xs text-zinc-500">共 {paged?.total ?? "…"} 条，每页 {PAGE_LIMIT} 条</p>

      {/* 卡片网格 */}
      {!loading && paged?.rows.length === 0 && (
        <p className="py-16 text-center text-sm text-zinc-400">暂无转换记录</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paged?.rows.map((row) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]"
          >
            {/* 二维码 */}
            <div className="shrink-0">
              <QrMini payload={row.finalContent} />
            </div>

            {/* 信息 */}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                <Calendar className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                {formatTs(row.createdAt)}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">extractedId</p>
              <p className="mt-0.5 break-all font-mono text-[11px] text-zinc-700 dark:text-zinc-300" title={row.extractedId}>
                {row.extractedId.slice(0, 28)}{row.extractedId.length > 28 ? "…" : ""}
              </p>
              <p className="mt-2 text-[11px] text-zinc-400">{formatBytes(row.sizeBytes)} · {row.mimeType}</p>
            </div>

            {/* 删除 */}
            <button
              type="button"
              onClick={() => void handleDelete(row.id)}
              disabled={deletingId === row.id}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:text-zinc-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              aria-label="删除"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </motion.div>
        ))}
      </div>

      <Pagination page={page} totalPages={paged?.totalPages ?? 1} onPage={setPage} />
    </div>
  );
}

// ── 活动二维码 Tab ────────────────────────────────────────────────────────────
function ActivitiesTab() {
  const [paged, setPaged] = useState<PagedResponse<AdminActivityRow> | null>(null);
  const [page, setPage] = useState(1);
  const [school, setSchool] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminActivityQrs(page, PAGE_LIMIT, {
        school: school || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: debouncedSearch || undefined,
      });
      setPaged(data);
    } catch { /* 静默 */ }
    finally { setLoading(false); }
  }, [page, school, dateFrom, dateTo, debouncedSearch]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除该活动？")) return;
    setDeletingId(id);
    try { await deleteAdminActivityQr(id); void load(); }
    catch { /* 静默 */ }
    finally { setDeletingId(null); }
  };

  return (
    <div>
      {/* 操作栏 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" strokeWidth={2} />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索活动名称…"
            className="rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-indigo-500/30 focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100" />
        </div>
        <select value={school} onChange={(e) => { setSchool(e.target.value as typeof SCHOOL_OPTIONS[number]); setPage(1); }}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100">
          <option value="">全部学校</option>
          {SCHOOL_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100" />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
        <button type="button" onClick={() => setShowUpload(true)}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
          <Plus className="h-4 w-4" strokeWidth={2} />上传活动
        </button>
      </div>

      <p className="mb-4 text-xs text-zinc-500">共 {paged?.total ?? "…"} 条，每页 {PAGE_LIMIT} 条</p>

      {/* 卡片网格 */}
      {!loading && paged?.rows.length === 0 && (
        <p className="py-16 text-center text-sm text-zinc-400">暂无活动二维码</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paged?.rows.map((row) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <button type="button" onClick={() => void handleDelete(row.id)} disabled={deletingId === row.id}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:text-zinc-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              aria-label="删除">
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>

            <div className="flex justify-center">
              <img
                src={`/api/activity-qrs/${row.id}/image`}
                alt={row.activityName}
                className="h-28 w-28 rounded-xl border border-zinc-200/80 object-contain dark:border-white/10"
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50 text-center leading-snug">
              {row.activityName}
            </p>
            <div className="mt-2 space-y-1 text-center">
              <p className="flex items-center justify-center gap-1 text-[11px] text-zinc-500">
                <School className="h-3 w-3" strokeWidth={1.75} />{row.school}
              </p>
              <p className="flex items-center justify-center gap-1 text-[11px] text-zinc-400">
                <Calendar className="h-3 w-3" strokeWidth={1.75} />
                {row.signInAt ? `签到 ${formatTs(row.signInAt)}` : `活动 ${formatTs(row.activityAt)}`}
              </p>
              <p className="text-[11px] text-zinc-400">下载 {row.downloadCount} 次 · {formatTs(row.createdAt)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Pagination page={page} totalPages={paged?.totalPages ?? 1} onPage={setPage} />

      {/* 上传活动弹窗 */}
      <UploadActivityModal open={showUpload} onClose={() => setShowUpload(false)} onSuccess={() => { void load(); setShowUpload(false); }} />
    </div>
  );
}

// ── 上传活动二维码弹窗 ────────────────────────────────────────────────────────
function UploadActivityModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [activityName, setActivityName] = useState("");
  const [activityAt, setActivityAt] = useState("");
  const [school, setSchool] = useState(DEFAULT_ACTIVITY_SCHOOL);
  const [signInAt, setSignInAt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setActivityName(""); setActivityAt(""); setSchool(DEFAULT_ACTIVITY_SCHOOL); setSignInAt(""); setImageFile(null); setError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!activityName.trim()) { setError("请填写活动名称"); return; }
    if (!activityAt) { setError("请选择活动时间"); return; }
    if (!imageFile) { setError("请选择二维码图片"); return; }
    const iso = new Date(activityAt).toISOString();
    let signInIso: string | null = null;
    if (signInAt) {
      const d = new Date(signInAt);
      if (Number.isNaN(d.getTime())) { setError("签到时间格式无效"); return; }
      signInIso = d.toISOString();
    }
    setBusy(true);
    try {
      await createActivityQr({ activityName: activityName.trim(), activityAt: iso, school, signInAt: signInIso, image: imageFile });
      reset();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]"
          onClick={(e) => { if (e.target === e.currentTarget) { reset(); onClose(); } }}
        >
          <motion.form
            initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onSubmit={(e) => void handleSubmit(e)}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-white/5">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">上传活动二维码</h2>
              <button type="button" onClick={() => { reset(); onClose(); }} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="space-y-3 p-5">
              {[
                { id: "an", label: "活动名称", type: "text", value: activityName, onChange: setActivityName, placeholder: "例如：春季分享会" },
                { id: "at", label: "活动时间", type: "datetime-local", value: activityAt, onChange: setActivityAt },
                { id: "si", label: "签到开始时间（选填）", type: "datetime-local", value: signInAt, onChange: setSignInAt },
              ].map(({ id, label, type, value, onChange, placeholder }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">{label}</label>
                  <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                    className="mt-1.5 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
              ))}
              <div>
                <label htmlFor="sc" className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">学校</label>
                <select id="sc" value={school} onChange={(e) => setSchool(e.target.value as typeof SCHOOL_OPTIONS[number])}
                  className="mt-1.5 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100">
                  {SCHOOL_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="img" className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">二维码图片</label>
                <input id="img" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="mt-1.5 w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium dark:text-zinc-300 dark:file:bg-white/10 dark:file:text-zinc-200" />
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400" role="alert">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-4 dark:border-white/5">
              <button type="button" onClick={() => { reset(); onClose(); }} className="rounded-xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5">取消</button>
              <button type="submit" disabled={busy}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                {busy ? "提交中…" : "提交"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: "stats", label: "概览", icon: BarChart3 },
  { id: "logs", label: "转换记录", icon: FileText },
  { id: "activities", label: "活动二维码", icon: Database },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"dark" | "light">(readStoredTheme);
  const [loggedIn, setLoggedIn] = useState(() => !!getAdminToken());
  const [tab, setTab] = useState<Tab>("stats");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const handleLogout = () => {
    clearAdminToken();
    setLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5 md:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">返回主页</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">管理后台</span>
          </div>
          <div className="flex items-center gap-2">
            {loggedIn && (
              <button type="button" onClick={handleLogout}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200">
                退出登录
              </button>
            )}
            <button type="button" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5" aria-label="切换主题">
              {theme === "dark" ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        {!loggedIn ? (
          <LoginCard onLoggedIn={() => setLoggedIn(true)} />
        ) : (
          <>
            <div className="mb-6 flex gap-1 rounded-xl border border-zinc-200/80 bg-zinc-100/80 p-1 dark:border-white/5 dark:bg-zinc-900/60 w-fit">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setTab(id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    tab === id
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                {tab === "stats" && <StatsTab />}
                {tab === "logs" && <LogsTab />}
                {tab === "activities" && <ActivitiesTab />}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}
