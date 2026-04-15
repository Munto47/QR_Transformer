import { CloudUpload, Lock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
  /** 处理中时的本地预览 URL */
  previewUrl?: string | null;
  busy?: boolean;
  /** 已有结果后的紧凑上传条 */
  variant?: "default" | "compact";
};

const STAGE_MESSAGES = [
  "正在提取数据…",
  "正在重新生成图形…",
  "正在完成校验…",
] as const;

/** 处理中遮罩：独立挂载，用 key 重置轮播，避免在 effect 里同步 reset state */
function ProcessingOverlay({ previewUrl }: { previewUrl: string }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGE_MESSAGES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative aspect-[16/10] min-h-[200px] w-full md:aspect-[21/9] md:min-h-[240px]"
    >
      <img
        src={previewUrl}
        alt=""
        className="h-full w-full object-contain object-center"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] dark:bg-zinc-950/65">
        <div className="mb-4 h-9 w-9 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600 dark:border-white/20 dark:border-t-indigo-400" />
        <AnimatePresence mode="wait">
          <motion.p
            key={stageIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            {STAGE_MESSAGES[stageIndex]}
          </motion.p>
        </AnimatePresence>
        <p className="mt-2 text-xs text-zinc-500">请稍候，过程通常只需数秒</p>
      </div>
    </motion.div>
  );
}

/**
 * 拖拽上传区：初始虚线大区域；处理中显示缩略图 + 半透明 Loading 与阶段文案
 */
export function UploadZone({
  onFile,
  disabled,
  previewUrl,
  busy,
  variant = "default",
}: Props) {
  const [drag, setDrag] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      const file = list?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const isCompact = variant === "compact";
  const showProcessing = Boolean(busy && previewUrl);

  return (
    <motion.div
      layout
      className={`relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/70 backdrop-blur-md transition-shadow dark:border-white/10 dark:bg-white/[0.03] ${
        drag ? "ring-1 ring-indigo-400/40" : ""
      } ${disabled && !showProcessing ? "pointer-events-none opacity-50" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const files = e.dataTransfer.files;
        if (files[0] && !files[0].type.startsWith("image/")) return;
        handleFiles(files);
      }}
    >
      <AnimatePresence mode="wait">
        {showProcessing && previewUrl ? (
          <ProcessingOverlay key={previewUrl} previewUrl={previewUrl} />
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex flex-col items-center justify-center border border-dashed border-zinc-300/90 bg-zinc-50/80 px-6 transition-colors hover:border-zinc-400/80 hover:bg-zinc-100/80 dark:border-white/15 dark:bg-zinc-950/20 dark:hover:border-white/25 dark:hover:bg-zinc-900/30 ${
              isCompact ? "py-8" : "py-14 md:py-20"
            }`}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="flex flex-col items-center"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200/90 bg-white text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
                <CloudUpload className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="mb-1 text-[15px] font-medium text-zinc-800 dark:text-zinc-200">
                {isCompact ? "上传另一张图片" : "点击或拖拽图片到此处"}
              </p>
              <p className="mb-6 text-xs text-zinc-500">
                支持常见图片格式，单张建议不超过 5MB
              </p>
              <label className="cursor-pointer rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={disabled}
                  onChange={(e) => handleFiles(e.target.files)}
                />
                选择文件
              </label>
            </motion.div>

            <div className="mt-8 flex max-w-md items-start gap-2 text-left text-[11px] leading-relaxed text-zinc-500 md:text-xs">
              <Lock
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-600"
                strokeWidth={1.75}
                aria-hidden
              />
              <span>您的文件通过端到端加密传输。</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
