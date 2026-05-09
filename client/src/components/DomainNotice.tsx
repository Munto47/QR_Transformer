import { ExternalLink, X } from "lucide-react";
import { useState } from "react";

const DOMAIN = "www.breezecode.top";

export function DomainNotice() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mx-auto max-w-5xl px-5 pt-6 md:px-8">
      <div className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm backdrop-blur-sm dark:border-amber-800/40 dark:bg-amber-950/30">
        <span className="text-amber-700 dark:text-amber-300">
          Railway 部署即将到期，推荐使用新域名访问：
        </span>
        <a
          href={`https://${DOMAIN}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
        >
          {DOMAIN}
          <ExternalLink className="h-3 w-3" />
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-amber-500 transition-colors hover:bg-amber-200/50 hover:text-amber-700 dark:hover:bg-amber-800/30 dark:hover:text-amber-300"
          aria-label="关闭提示"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
