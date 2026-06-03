import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { getErrorMessage, transformImage } from "../api/qr";
import { ActivityQrSidebar } from "../components/ActivityQrSidebar";
import { AdminToolbar } from "../components/AdminToolbar";
import { HeaderBar } from "../components/HeaderBar";
import { HeroSection } from "../components/HeroSection";
import { HistoryPanel } from "../components/HistoryPanel";
import { QrDisplay } from "../components/QrDisplay";
import { ShareTogetherForm } from "../components/ShareTogetherForm";
import { UploadZone } from "../components/UploadZone";
import { addHistory, clearHistory, loadHistory, type HistoryEntry } from "../utils/history";

const THEME_KEY = "qr-transformer-theme";

function readStoredTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const v = localStorage.getItem(THEME_KEY);
  if (v === "light" || v === "dark") return v;
  return "dark";
}

function fireConfetti() {
  void confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.55 },
    colors: ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"],
    disableForReducedMotion: true,
  });
}

function decodeShareParam(p: string): string | null {
  try {
    return decodeURIComponent(atob(p));
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [finalContent, setFinalContent] = useState<string | null>(() => {
    const p = searchParams.get("p");
    return p ? decodeShareParam(p) : null;
  });
  const [qrMeta, setQrMeta] = useState<{ rawContent: string; convertedAt: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showParseReference, setShowParseReference] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(readStoredTheme);
  const [activityQrRefresh, setActivityQrRefresh] = useState(0);
  const [showShareTogether, setShowShareTogether] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(() => loadHistory());
  const shareTogetherAnchorRef = useRef<HTMLDivElement | null>(null);
  const prevFinalRef = useRef<string | null>(finalContent);

  // 有分享参数时清理 URL，保持干净
  useEffect(() => {
    if (searchParams.get("p")) {
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 成功时触发 confetti + 写入历史
  useEffect(() => {
    if (finalContent && prevFinalRef.current !== finalContent) {
      fireConfetti();
      setHistoryEntries(addHistory(finalContent));
    }
    prevFinalRef.current = finalContent;
  }, [finalContent]);

  const openShareTogether = useCallback(() => {
    setShowShareTogether(true);
    requestAnimationFrame(() => {
      shareTogetherAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = async (file: File) => {
    setError(null);
    setShowParseReference(false);
    setFinalContent(null);
    setQrMeta(null);
    setBusy(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const res = await transformImage(file);
      if (res.success) {
        setFinalContent(res.data.finalContent);
        setQrMeta({ rawContent: res.data.raw, convertedAt: Date.now() });
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setShowParseReference(true);
    } finally {
      setBusy(false);
    }
  };

  // 从历史记录还原：不触发 confetti，直接设置内容
  const handleHistoryRestore = useCallback((payload: string) => {
    setError(null);
    setShowParseReference(false);
    setPreviewUrl(null);
    prevFinalRef.current = payload;
    setFinalContent(payload);
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistoryEntries(clearHistory());
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <HeaderBar
        theme={theme}
        onToggleTheme={toggleTheme}
        trailing={<AdminToolbar />}
      />

      <main>
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
                  解析失败时可参考下图示意，或查看{" "}
                  <a
                    href="/tutorial"
                    className="text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    使用教程
                  </a>
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

            {!finalContent && (
              <UploadZone onFile={handleFile} disabled={busy} busy={busy} previewUrl={previewUrl} />
            )}

            <QrDisplay
              payload={finalContent}
              originalSrc={previewUrl}
              onShareTogether={openShareTogether}
              qrMeta={qrMeta}
            />

            {finalContent && !busy && (
              <UploadZone variant="compact" onFile={handleFile} disabled={busy} busy={false} />
            )}

            {historyEntries.length > 0 && (
              <HistoryPanel
                entries={historyEntries}
                onRestore={handleHistoryRestore}
                onClear={handleClearHistory}
              />
            )}
          </div>

          <ActivityQrSidebar refreshKey={activityQrRefresh} />
        </div>
      </main>
    </div>
  );
}
