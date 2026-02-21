import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface CountUpNumberProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  label: string;
  icon?: React.ReactNode;
}

export default function CountUpNumber({
  end,
  duration = 2,
  suffix = "",
  prefix = "",
  label,
  icon,
}: CountUpNumberProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      // 使用 easeOutQuart 緩動函數
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(startValue + (end - startValue) * easeOutQuart);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, isInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="text-center"
    >
      <div className="flex flex-col items-center gap-3">
        {icon && (
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
            {icon}
          </div>
        )}
        <div>
          <div className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
            {prefix}
            {count.toLocaleString()}
            {suffix}
          </div>
          <div className="text-sm md:text-base text-gray-600 font-medium">
            {label}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
