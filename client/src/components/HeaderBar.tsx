import { ExternalLink, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

/** 可改为仓库地址 */
const GITHUB_HREF = "https://github.com";

type Props = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

/**
 * 顶栏：品牌名 + GitHub + 主题切换（暗黑优先）
 */
export function HeaderBar({ theme, onToggleTheme }: Props) {
  const isDark = theme === "dark";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-8">
        <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          QR_Transformer
        </span>
        <div className="flex items-center gap-1">
          <a
            href={GITHUB_HREF}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            aria-label="GitHub"
          >
            <ExternalLink className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </a>
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            aria-label={isDark ? "切换为浅色" : "切换为深色"}
          >
            {isDark ? (
              <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} />
            ) : (
              <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
