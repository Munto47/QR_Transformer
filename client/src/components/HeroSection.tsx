import { motion } from "framer-motion";

/**
 * 核心引导区：英文标题 + 副标题
 */
export function HeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-5xl px-5 pb-10 pt-12 text-center md:px-8 md:pb-14 md:pt-16"
    >
      <h1 className="text-balance text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
        Transform Your QR Code
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-base">
        上传、解析、焕新。安全、快速、无需注册。
      </p>
    </motion.section>
  );
}
