import { useCallback, useEffect, useState } from "react";
import {
  fetchProcessingLogs,
  transformImage,
} from "./api/qr";
import type { ProcessingLog } from "./api/types";
import { HistoryList } from "./components/HistoryList";
import { QrDisplay } from "./components/QrDisplay";
import { UploadZone } from "./components/UploadZone";

export default function App() {
  const [finalContent, setFinalContent] = useState<string | null>(null);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 仅在上传解析失败时展示参考图 */
  const [showParseReference, setShowParseReference] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const data = await fetchProcessingLogs();
      setLogs(data);
    } catch {
      setError("加载失败");
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const handleFile = async (file: File) => {
    setError(null);
    setShowParseReference(false);
    setBusy(true);
    try {
      const res = await transformImage(file);
      if (res.success) {
        setFinalContent(res.data.finalContent);
        await loadLogs();
      }
    } catch {
      setError("处理失败");
      setShowParseReference(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <h1 className="text-2xl font-bold tracking-tight">QR_Transfomer</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100"
            role="alert"
          >
            {error}
          </div>
        )}

        {showParseReference && (
          <section
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="解析失败参考示意"
          >
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
              解析失败时可参考下图示意
            </p>
            <div className="flex justify-center">
              <img
                src="/image.png"
                alt=""
                className="max-h-[min(70vh,640px)] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </section>
        )}

        <UploadZone onFile={handleFile} disabled={busy} />

        <QrDisplay payload={finalContent} />

        <HistoryList logs={logs} loading={logsLoading} />
      </main>
    </div>
  );
}
