const ICP_NUMBER = "赣ICP备2026008973号-1";
const BEIAN_MPS_NUMBER = "赣公网安备36010802001382号";
const BEIAN_MPS_CODE = "36010802001382";

export function SiteFooter() {
  const mpsHref = `https://beian.mps.gov.cn/#/query/webSearch?code=${BEIAN_MPS_CODE}`;
  const icpHref = "https://beian.miit.gov.cn/";

  return (
    <footer className="mt-auto border-t border-zinc-200/70 bg-white/60 backdrop-blur-sm dark:border-white/[0.06] dark:bg-zinc-950/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 py-5 md:flex-row md:justify-center md:gap-6 md:px-8">
        {/* 公安联网备案 */}
        <a
          href={mpsHref}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-1.5 text-[11px] text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          <img src="/beian-icon.png" alt="公安备案" className="h-4 w-4 shrink-0" />
          {BEIAN_MPS_NUMBER}
        </a>

        {/* 分隔点 */}
        <span className="hidden text-zinc-300 dark:text-zinc-700 md:inline">·</span>

        {/* ICP 备案号 */}
        <a
          href={icpHref}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-1.5 text-[11px] text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          {ICP_NUMBER}
        </a>
      </div>
    </footer>
  );
}
