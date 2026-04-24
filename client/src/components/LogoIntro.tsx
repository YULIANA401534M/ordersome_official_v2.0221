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
    }, 1600);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#fff0a6_0%,#ffe28a_28%,#fff8e5_72%,#fffdf7_100%)]"
      >
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col items-center gap-5 px-8 text-center"
        >
          <motion.img
            src="/logos/brand-logo-yellow.png"
            alt="來點什麼"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="h-20 w-auto md:h-24"
          />
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="text-[clamp(1.5rem,3vw,2.4rem)] font-black tracking-[-0.06em] text-[#1b1712]"
          >
            台韓兩味，混搭就對
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scaleX: 0.6 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.45, delay: 0.24 }}
            className="h-1.5 w-28 overflow-hidden rounded-full bg-[#f4e7b7]"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 0.7, delay: 0.32, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#f4b400] via-[#ffd84d] to-[#f4b400]"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
