import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LogoIntroProps {
  onComplete?: () => void;
}

export default function LogoIntro({ onComplete }: LogoIntroProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 1800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#fff9e8_0%,#ffe38a_45%,#f6f2ea_100%)]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative flex w-[min(88vw,520px)] flex-col items-center gap-5 rounded-[2rem] border border-white/70 bg-white/72 px-8 py-10 text-center shadow-[0_28px_90px_rgba(78,58,8,0.16)] backdrop-blur-xl"
        >
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-[#f1d675] bg-[#fff4c8] px-4 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-[#8a6500]"
          >
            Order Some
          </motion.div>
          <motion.img
            src="/logos/brand-logo-yellow.png"
            alt="來點什麼"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="h-20 w-auto md:h-24"
          />
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.45 }}
            className="max-w-sm text-sm leading-7 text-[#5f5a4f] md:text-[0.95rem]"
          >
            台式早餐的熟悉感，配上韓系節奏與更明亮的品牌情緒。
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scaleX: 0.6 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.45 }}
            className="h-1.5 w-32 overflow-hidden rounded-full bg-[#f6ebc8]"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#f4b400] via-[#ffd84d] to-[#f7c948]"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
