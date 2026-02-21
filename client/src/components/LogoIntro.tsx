import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface LogoIntroProps {
  onComplete?: () => void;
}

export default function LogoIntro({ onComplete }: LogoIntroProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // 動畫持續 3 秒後自動結束
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      >
        {/* 桌面版背景圖片 - 橫向 1920x1080 */}
        <motion.img
          src="/images/logo-intro-desktop.png"
          alt="YULIAN"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="hidden md:block w-full h-full object-cover"
        />
        
        {/* 手機版背景圖片 - 直立 1080x1920 */}
        <motion.img
          src="/images/logo-intro-mobile.png"
          alt="YULIAN"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="block md:hidden w-full h-full object-cover"
        />
      </motion.div>
    </AnimatePresence>
  );
}
