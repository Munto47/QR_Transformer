import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Moon, Sun } from "lucide-react";

const THEME_KEY = "qr-transformer-theme";

function readStoredTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const v = localStorage.getItem(THEME_KEY);
  return v === "light" ? "light" : "dark";
}

const STEPS = [
  {
    title: "步骤一：找到活动平台的活动二维码",
    desc: "打开活动平台 App，进入目标活动详情页，找到活动二维码。长按或截图保存原始二维码图片。注意：请确保截图完整包含二维码区域，不要裁剪过多边缘。",
    img: "/docs/image1.png",
    alt: "在活动平台找到活动二维码示例",
  },
  {
    title: "步骤二：上传并获取签到码",
    desc: "回到本工具，将保存的截图拖拽到上传区，或点击「选择文件」，也可以直接 Ctrl+V 粘贴截图。工具会自动解析并生成焕新后的签到二维码，点击「免费下载」保存到本地即可使用。",
    img: "/docs/image2.png",
    alt: "上传图片并下载焕新二维码示例",
  },
];

const FAQS = [
  {
    q: "为什么解析失败？",
    a: "常见原因：截图不完整（二维码被裁剪）、图片过度压缩模糊、二维码上有遮挡。建议重新截取，保持二维码清晰完整。",
  },
  {
    q: "生成的二维码安全吗？",
    a: "安全。图片通过加密传输，服务器仅提取二维码内容并转换格式，不会记录您的个人信息。",
  },
  {
    q: "转换后的二维码可以直接用于签到吗？",
    a: "是的。生成的二维码与原始活动二维码内容完全一致，可以直接展示给扫码设备签到/签退。",
  },
  {
    q: "支持哪些图片格式？",
    a: "支持 JPG、PNG、WebP 等常见图片格式，单张建议不超过 5MB。",
  },
];

export default function TutorialPage() {
  const [theme, setTheme] = useState<"dark" | "light">(readStoredTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* 顶栏 */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-4 md:px-8">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            返回主页
          </Link>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">使用教程</span>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            aria-label="切换主题"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">如何使用 QR_Transformer</h1>
          <p className="mt-4 text-[15px] text-zinc-600 dark:text-zinc-400">
            两步即可将活动二维码转换为可用的签到码
          </p>
        </motion.div>

        {/* 步骤 */}
        <div className="space-y-10">
          {STEPS.map((step, idx) => (
            <motion.section
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 + 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/80 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="p-6 md:p-8">
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {idx + 1}
                  </span>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {step.title}
                  </h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {step.desc}
                </p>
              </div>
              <div className="border-t border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-white/5 dark:bg-zinc-900/30">
                <img
                  src={step.img}
                  alt={step.alt}
                  className="mx-auto max-h-[min(70vh,520px)] w-auto max-w-full rounded-xl object-contain"
                  loading="lazy"
                />
              </div>
            </motion.section>
          ))}
        </div>

        {/* 常见问题 */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="mt-14"
        >
          <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">常见问题</h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{faq.q}</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 返回 CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
          >
            开始使用
          </Link>
        </div>
      </main>
    </div>
  );
}
