import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { subscribeAdminUnauthorized } from "./api/client";
import { getAdminToken } from "./api/authStorage";
import { getErrorMessage, transformImage } from "./api/qr";
import { ActivityQrSidebar } from "./components/ActivityQrSidebar";
import { AdminToolbar } from "./components/AdminToolbar";
import { DomainNotice } from "./components/DomainNotice";
import { HeaderBar } from "./components/HeaderBar";
import { HeroSection } from "./components/HeroSection";
import { QrDisplay } from "./components/QrDisplay";
import { ShareTogetherForm } from "./components/ShareTogetherForm";
import { UploadZone } from "./components/UploadZone";

const THEME_KEY = "qr-transformer-theme";

function readStoredTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const v = localStorage.getItem(THEME_KEY);
  if (v === "light" || v === "dark") return v;
  return "dark";
}

export default function App() {
  const [finalContent, setFinalContent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showParseReference, setShowParseReference] = useState(false);
  /** 当前任务原图本地预览（object URL） */
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(readStoredTheme);
  const [adminLoggedIn, setAdminLoggedIn] = useState(
    () => !!getAdminToken()
  );
  const [activityQrRefresh, setActivityQrRefresh] = useState(0);
  const [showShareTogether, setShowShareTogether] = useState(false);
  const shareTogetherAnchorRef = useRef<HTMLDivElement | null>(null);

  const openShareTogether = useCallback(() => {
    setShowShareTogether(true);
    requestAnimationFrame(() => {
      shareTogetherAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  useEffect(() => {
    return subscribeAdminUnauthorized(() => setAdminLoggedIn(false));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const revokePreview = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    return () => revokePreview(previewUrl);
  }, [previewUrl, revokePreview]);

  const handleFile = async (file: File) => {
    setError(null);
    setShowParseReference(false);
    setFinalContent(null);
    setBusy(true);

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);

    try {
      const res = await transformImage(file);
      if (res.success) {
        setFinalContent(res.data.finalContent);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setShowParseReference(true);
    } finally {
      setBusy(false);
    }
  };

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <HeaderBar
        theme={theme}
        onToggleTheme={toggleTheme}
        trailing={
          <AdminToolbar
            adminLoggedIn={adminLoggedIn}
            onLoginStateChange={setAdminLoggedIn}
            onActivityCreated={() =>
              setActivityQrRefresh((n) => n + 1)
            }
          />
        }
      />

      <main>
        <DomainNotice />
        <div ref={shareTogetherAnchorRef} className="scroll-mt-16" />
        <AnimatePresence>
          {showShareTogether && finalContent && (
            <ShareTogetherForm
              key="share-together"
              qrPayload={finalContent}
              onClose={() => setShowShareTogether(false)}
              onSuccess={() => setActivityQrRefresh((n) => n + 1)}
            />
          )}
        </AnimatePresence>

        <HeroSection />

        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 pb-16 md:px-8 lg:flex-row lg:items-start lg:gap-10">
          <div className="min-w-0 flex-1 space-y-10">
          {error && (
            <div
              className="rounded-2xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
              role="alert"
            >
              {error}
            </div>
          )}

          {showParseReference && (
            <section
              className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/80 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]"
              aria-label="解析失败参考示意"
            >
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                解析失败时可参考下图示意
              </p>
              <div className="flex justify-center">
                <img
                  src="/image.png"
                  alt=""
                  className="max-h-[min(70vh,640px)] w-auto max-w-full rounded-xl object-contain"
                />
              </div>
            </section>
          )}

          {/* 主操作区：无结果或未在处理中时显示大上传区；处理中同区变为 Loading */}
          {!finalContent && (
            <UploadZone
              onFile={handleFile}
              disabled={busy}
              busy={busy}
              previewUrl={previewUrl}
            />
          )}

          <QrDisplay
            payload={finalContent}
            originalSrc={previewUrl}
            onShareTogether={openShareTogether}
          />

          {/* 已有结果后：紧凑上传入口 */}
          {finalContent && !busy && (
            <UploadZone
              variant="compact"
              onFile={handleFile}
              disabled={busy}
              busy={false}
            />
          )}

          </div>

          <ActivityQrSidebar refreshKey={activityQrRefresh} />
        </div>
      </main>
    </div>
  );
}
