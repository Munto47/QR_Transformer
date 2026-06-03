import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ExternalLink, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

const GITHUB_HREF = "https://github.com/Munto47/QR_Transformer";

type Props = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  trailing?: ReactNode;
};

export function HeaderBar({ theme, onToggleTheme, trailing }: Props) {
  const isDark = theme === "dark";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 md:px-8">
        <Link
          to="/"
          className="text-[15px] font-semibold tracking-tight text-zinc-900 hover:text-indigo-600 transition-colors dark:text-zinc-100 dark:hover:text-indigo-400"
        >
          QR_Transformer
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          {trailing}
          <Link
            to="/tutorial"
            className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            aria-label="使用教程"
          >
            <BookOpen className="h-[17px] w-[17px]" strokeWidth={1.75} />
            <span className="hidden sm:inline">使用教程</span>
          </Link>
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
