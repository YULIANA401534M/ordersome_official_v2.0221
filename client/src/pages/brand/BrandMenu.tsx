import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { injectSchema } from "@/hooks/schemaUtils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

function RevealText({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

function StaggerGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.97 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE_OUT_EXPO } },
      }}
    >
      {children}
    </motion.div>
  );
}

function SkeletonPulse() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-2xl animate-pulse"
          style={{ background: "oklch(0.92 0.04 85)" }}
        />
      ))}
    </div>
  );
}

export default function BrandMenu() {
  const { data: menuItems, isLoading } = trpc.menu.list.useQuery();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "24%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    document.title = "來點什麼 完整菜單｜必吃韓式飯捲、台式蛋餅與特色鐵板麵";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "查看來點什麼最新菜單！獨家韓式飯捲、酥脆台式蛋餅、經典鐵板麵，滿足您對台韓式早午餐的所有渴望。"
    );
    document.querySelector('meta[name="keywords"]')?.setAttribute(
      "content",
      "來點什麼菜單, 台中早餐菜單, 韓式飯捲, 台式蛋餅, 鐵板麵"
    );

    const schema = {
      "@context": "https://schema.org",
      "@type": "Menu",
      "name": "來點什麼完整菜單",
      "description": "台韓式早午餐菜單",
      "url": "https://ordersome.com.tw/brand/menu",
      "hasMenuSection": [
        { "@type": "MenuSection", "name": "韓式飯捲", "description": "獨家韓式飯捲系列" },
        { "@type": "MenuSection", "name": "台式蛋餅", "description": "酥脆台式蛋餅系列" },
        { "@type": "MenuSection", "name": "鐵板麵", "description": "經典鐵板麵系列" },
      ],
    };
    const cleanup = injectSchema("menu", schema);
    return cleanup;
  }, []);

  const groupedItems = menuItems?.reduce((acc, item) => {
    if (!acc[item.categoryName]) acc[item.categoryName] = [];
    acc[item.categoryName].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  const categories = groupedItems ? Object.keys(groupedItems) : [];

  useEffect(() => {
    if (categories.length > 0 && activeCategory === null) {
      setActiveCategory(categories[0]);
    }
  }, [categories.length]);

  const displayItems = activeCategory && groupedItems ? groupedItems[activeCategory] ?? [] : [];

  return (
    <BrandLayout>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[70vh] overflow-hidden flex items-end"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        {/* 視差背景大字 */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none whitespace-nowrap"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(100px, 24vw, 340px)",
              color: "oklch(0.92 0.06 85)",
              letterSpacing: "-0.04em",
            }}
          >
            MENU
          </span>
        </motion.div>

        {/* 右上角食物圖 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.2 }}
          className="absolute top-12 right-8 w-[38vw] max-w-[440px] aspect-[3/4] overflow-hidden rounded-2xl"
        >
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/CApeTRjJBNflTLdV.jpg"
            alt="混醬厚片，來點什麼招牌必點"
            className="w-full h-full object-cover"
            style={{ filter: "saturate(1.1)" }}
          />
          {/* 四邊漸層融合 */}
          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(to bottom, oklch(0.97 0.02 85) 0%, transparent 18%)",
                "linear-gradient(to top, oklch(0.97 0.02 85) 0%, transparent 18%)",
                "linear-gradient(to right, oklch(0.97 0.02 85) 0%, transparent 20%)",
                "linear-gradient(to left, oklch(0.97 0.02 85) 0%, transparent 10%)",
              ].join(", "),
            }}
          />
        </motion.div>

        {/* 主文字 */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 w-full pb-16 px-6 md:px-12 lg:px-20"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-5"
          >
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full"
              style={{
                background: "oklch(0.75 0.18 70)",
                color: "oklch(0.98 0.01 85)",
              }}
            >
              台韓混血早午餐
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.15 }}
            className="whitespace-nowrap"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(36px, 6vw, 88px)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              color: "oklch(0.18 0.02 60)",
            }}
          >
            今天，來點什麼？
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.35 }}
            className="mt-5 max-w-sm text-base leading-relaxed"
            style={{ color: "oklch(0.42 0.03 60)" }}
          >
            韓式飯捲、台式蛋餅、鐵板麵，真材實料不說廢話。
          </motion.p>
        </motion.div>
      </section>

      {/* ── 菜單圖片 ──────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{ background: "oklch(0.18 0.02 60)" }}
      >
        <div className="px-6 md:px-12 lg:px-20 mb-10">
          <RevealText>
            <h2
              className="font-black leading-none"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(32px, 5vw, 64px)",
                color: "oklch(0.97 0.02 85)",
                letterSpacing: "-0.02em",
              }}
            >
              完整菜單
              <span className="ml-3" style={{ color: "oklch(0.75 0.18 70)" }}>2026</span>
            </h2>
            <p className="mt-3 text-sm" style={{ color: "oklch(0.62 0.04 70)" }}>
              點擊圖片可放大查看
            </p>
          </RevealText>
        </div>

        <StaggerGrid className="px-6 md:px-12 lg:px-20 grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {[
            {
              src: "/menu/2026菜單-01_0.jpg",
              alt: "來點什麼菜單 — 黑黑大大堡、鐵板炒麵、厚醬厚片",
              label: "主食系列",
            },
            {
              src: "/menu/2026菜單-02_0.jpg",
              alt: "來點什麼菜單 — 韓式飯捲、減醣輕食、米台韓混合",
              label: "飯捲輕食",
            },
          ].map((img) => (
            <StaggerItem key={img.src}>
              <button
                className="group relative w-full overflow-hidden rounded-2xl block text-left"
                onClick={() => setSelectedImage(img.src)}
                aria-label={`放大查看：${img.label}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.03]"
                  style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
                />
                {/* 貼紙標籤 */}
                <div className="absolute top-4 left-4">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: "oklch(0.75 0.18 70)",
                      color: "oklch(0.98 0.01 85)",
                    }}
                  >
                    {img.label}
                  </span>
                </div>
                {/* 放大提示 */}
                <div
                  className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{
                    background: "oklch(0.12 0.01 60 / 0.8)",
                    color: "oklch(0.97 0.02 85)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  放大
                </div>
              </button>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      {/* ── 品項列表 ──────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        <div className="px-6 md:px-12 lg:px-20">
          <RevealText>
            <h2
              className="font-black leading-none mb-10"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(32px, 5vw, 64px)",
                color: "oklch(0.18 0.02 60)",
                letterSpacing: "-0.02em",
              }}
            >
              每一口都算數
            </h2>
          </RevealText>

          {/* 分類 Tab */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-5 py-2 rounded-full text-sm font-bold transition-all duration-200"
                  style={
                    activeCategory === cat
                      ? {
                          background: "oklch(0.75 0.18 70)",
                          color: "oklch(0.98 0.01 85)",
                          boxShadow: "0 4px 16px oklch(0.75 0.18 70 / 0.35)",
                        }
                      : {
                          background: "oklch(0.92 0.04 85)",
                          color: "oklch(0.35 0.03 60)",
                        }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* 載入中 */}
          {isLoading && <SkeletonPulse />}

          {/* 品項磚 */}
          {!isLoading && displayItems && displayItems.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {(displayItems as any[]).map((item: any, i: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: i * 0.04 }}
                    className="group relative overflow-hidden rounded-2xl aspect-square"
                    style={{ background: "oklch(0.92 0.04 85)" }}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                        style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src="/logos/brand-icon.png"
                          alt="來點什麼"
                          className="w-16 h-16 opacity-20"
                        />
                      </div>
                    )}

                    {/* 底部 overlay */}
                    <div
                      className="absolute inset-x-0 bottom-0 px-4 py-3 translate-y-1 group-hover:translate-y-0 transition-transform duration-300"
                      style={{
                        background: "linear-gradient(to top, oklch(0.12 0.01 60 / 0.85) 0%, transparent 100%)",
                        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                      }}
                    >
                      <p className="text-sm font-bold leading-tight" style={{ color: "oklch(0.97 0.02 85)" }}>
                        {item.name}
                      </p>
                      {item.description && (
                        <p
                          className="text-xs mt-0.5 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ color: "oklch(0.80 0.04 70)" }}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Empty 狀態 */}
          {!isLoading && (!menuItems || menuItems.length === 0) && (
            <div className="text-center py-24">
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/VjlyUhcBYLeXUEcB.jpg"
                alt="來點什麼好料"
                className="w-40 h-40 object-cover rounded-2xl mx-auto mb-6"
                style={{ filter: "saturate(1.1)" }}
              />
              <p
                className="font-bold text-lg"
                style={{ color: "oklch(0.18 0.02 60)", fontFamily: "var(--font-brand)" }}
              >
                更多好料，到門市現點
              </p>
              <p className="text-sm mt-2" style={{ color: "oklch(0.55 0.04 70)" }}>
                歡迎蒞臨各地門市，現場享用美味
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 放大燈箱 ──────────────────────────────────────────── */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-0">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full transition-colors duration-150"
            style={{ background: "oklch(0.12 0.01 60 / 0.7)", color: "oklch(0.97 0.02 85)" }}
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="來點什麼菜單"
              className="w-full h-auto rounded-2xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </BrandLayout>
  );
}
