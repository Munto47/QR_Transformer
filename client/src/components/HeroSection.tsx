import { motion } from "framer-motion";

/**
 * 核心引导区：中英主副标题，强调安全与效率
 */
export function HeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-5xl px-5 pb-10 pt-12 text-center md:px-8 md:pb-14 md:pt-16"
    >
      <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl">
        重塑你的二维码
        <span className="mt-2 block text-xl font-normal text-zinc-500 dark:text-zinc-500 md:text-2xl md:font-light">
          Transform Your QR Code
        </span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-base">
        上传、解析、焕新。安全、快速、无需注册。
      </p>
    </motion.section>
  );
}
