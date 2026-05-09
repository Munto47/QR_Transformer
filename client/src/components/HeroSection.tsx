import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchProcessingCount } from "../api/qr";

export function HeroSection() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetchProcessingCount()
      .then(setCount)
      .catch(() => {});
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-5xl px-5 pb-10 pt-12 text-center md:px-8 md:pb-14 md:pt-16"
    >
      <h1 className="text-balance text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
        活动二维码，一键焕新为签到码
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-base">
        上传活动平台的活动二维码图片，自动解析并生成可用于签到/签退的焕新二维码。安全、快速、无需注册。
      </p>
      {count !== null && (
        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
          已累计处理 {count.toLocaleString()} 次
        </p>
      )}
    </motion.section>
  );
}
