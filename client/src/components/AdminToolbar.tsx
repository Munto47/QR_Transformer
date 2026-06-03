import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

/**
 * 顶栏管理入口：直接跳转到 /admin 页面，登录和所有管理操作均在 /admin 处理。
 */
export function AdminToolbar() {
  return (
    <Link
      to="/admin"
      className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200 md:px-3"
      aria-label="管理后台"
    >
      <Shield className="h-[17px] w-[17px]" strokeWidth={1.75} />
      <span className="hidden sm:inline">管理后台</span>
    </Link>
  );
}
