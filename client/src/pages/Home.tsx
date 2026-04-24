import { Link } from "wouter";
import { ArrowRight, Store, Calendar, Users } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { injectSchema } from "@/hooks/schemaUtils";
import LogoIntro from "@/components/LogoIntro";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── CountUp ─────────────────────────────────────────────────── */

function CountUp({ end, suffix = "", duration = 2.2 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.floor(end * eased));
      if (p < 1) requestAnimationFrame(tick);
      else setCount(end);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── 主頁面 ──────────────────────────────────────────────────── */

export default function Home() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    document.title = "來點什麼 Ordersome｜台中早午餐加盟首選、高人氣台韓式早餐";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "來點什麼 (Ordersome) 結合台灣經典與韓國風味，提供高利潤人氣美食。全台 15 間門市，大台中早午餐加盟、小資餐飲創業最佳推薦品牌。"
    );
    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "來點什麼 Ordersome",
      "url": "https://ordersome.com.tw",
      "logo": "https://ordersome.com.tw/logo.png",
      "description": "台中台韓式早午餐品牌",
      "address": { "@type": "PostalAddress", "addressRegion": "台中市", "addressCountry": "TW" },
    };
    const cleanup = injectSchema("organization", schema);
    return cleanup;
  }, []);

  return (
    <>
      <LogoIntro onComplete={() => setShowContent(true)} />

      <div
        className="relative min-h-screen overflow-hidden"
        style={{ background: "oklch(0.10 0.01 60)" }}
      >
        {/* ── 背景 ── */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div style={{
            position: "absolute", top: -160, left: -120,
            width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle, oklch(0.65 0.18 70 / 0.10) 0%, transparent 65%)",
          }} />
          <div style={{
            position: "absolute", bottom: -100, right: -80,
            width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle, oklch(0.55 0.12 55 / 0.07) 0%, transparent 65%)",
          }} />
          {/* 細噪點 */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.025,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "160px",
          }} />
        </div>

        {/* ── 主內容 ── */}
        <div
          className="relative z-10 flex min-h-screen flex-col"
          style={{ opacity: showContent ? 1 : 0, transition: "opacity 0.8s ease" }}
        >
          {/* ── Hero ── */}
          <div className="flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-24">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mb-8 text-center"
            >
              <span style={{
                display: "inline-block",
                padding: "0.3rem 1rem",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "oklch(0.75 0.18 70)",
                background: "oklch(0.75 0.18 70 / 0.08)",
                border: "1px solid oklch(0.75 0.18 70 / 0.18)",
                borderRadius: 2,
                fontFamily: "var(--font-brand)",
              }}>
                Ordersome · 宇聯國際
              </span>
            </motion.div>

            {/* 大標題 */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: EASE, delay: 0.06 }}
              style={{
                fontSize: "clamp(3.8rem, 11vw, 9rem)",
                fontWeight: 900,
                lineHeight: 0.88,
                letterSpacing: "-0.03em",
                color: "oklch(0.97 0.02 85)",
                fontFamily: "var(--font-brand)",
                textAlign: "center",
                marginBottom: "1.5rem",
              }}
            >
              宇聯國際
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.14 }}
              style={{
                fontSize: "clamp(0.88rem, 1.4vw, 1.05rem)",
                color: "oklch(0.75 0.02 85 / 0.55)",
                lineHeight: 1.9,
                textAlign: "center",
                maxWidth: 480,
                marginBottom: "3.5rem",
                fontFamily: "var(--font-corporate)",
              }}
            >
              宇聯國際文化餐飲有限公司，致力於打造優質餐飲品牌，<br className="hidden md:block" />
              為顧客帶來美好的用餐體驗
            </motion.p>

            {/* ── 兩張入口卡片 ── */}
            <div className="grid w-full max-w-4xl gap-4 md:grid-cols-2 mb-12">

              {/* 卡片 A：來點什麼 */}
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.18 }}
              >
                <Link href="/brand">
                  <a
                    className="group block overflow-hidden cursor-pointer relative"
                    style={{
                      background: "oklch(0.18 0.04 68)",
                      border: "1px solid oklch(0.75 0.18 70 / 0.15)",
                      borderRadius: 4,
                      transition: "border-color 0.3s, box-shadow 0.3s",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "oklch(0.75 0.18 70 / 0.45)";
                      el.style.boxShadow = "0 24px 60px -12px oklch(0 0 0 / 0.55)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "oklch(0.75 0.18 70 / 0.15)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    {/* 頂部金線 */}
                    <div style={{
                      height: 1,
                      background: "linear-gradient(90deg, transparent 0%, oklch(0.75 0.18 70 / 0.6) 50%, transparent 100%)",
                    }} />

                    <div className="p-8 md:p-10">
                      <img
                        src="/logos/brand-logo-yellow.png"
                        alt="來點什麼"
                        className="h-14 w-auto mb-8"
                      />

                      <h2 style={{
                        fontSize: "clamp(1.7rem, 3vw, 2.6rem)",
                        fontWeight: 900,
                        letterSpacing: "-0.04em",
                        lineHeight: 1.05,
                        color: "oklch(0.97 0.02 85)",
                        fontFamily: "var(--font-brand)",
                        marginBottom: "0.65rem",
                      }}>
                        來點什麼
                      </h2>

                      <p style={{
                        fontSize: "0.875rem",
                        lineHeight: 1.9,
                        color: "oklch(0.75 0.02 85 / 0.45)",
                        marginBottom: "2.5rem",
                        fontFamily: "var(--font-corporate)",
                      }}>
                        ORDER SOME — 台韓風味早午餐品牌<br />
                        用心製作每一份餐點，為您帶來美好的一天開始
                      </p>

                      <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        fontSize: "0.85rem", fontWeight: 700,
                        color: "oklch(0.75 0.18 70)",
                        fontFamily: "var(--font-corporate)",
                        letterSpacing: "0.05em",
                      }}>
                        探索品牌
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </div>
                    </div>
                  </a>
                </Link>
              </motion.div>

              {/* 卡片 B：宇聯國際 */}
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.26 }}
              >
                <Link href="/corporate">
                  <a
                    className="group block h-full overflow-hidden cursor-pointer"
                    style={{
                      background: "oklch(0.14 0.01 250)",
                      border: "1px solid oklch(0.65 0.06 70 / 0.12)",
                      borderRadius: 4,
                      transition: "border-color 0.3s, box-shadow 0.3s",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "oklch(0.65 0.06 70 / 0.35)";
                      el.style.boxShadow = "0 24px 60px -12px oklch(0 0 0 / 0.5)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "oklch(0.65 0.06 70 / 0.12)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    {/* 頂部金線 */}
                    <div style={{
                      height: 1,
                      background: "linear-gradient(90deg, transparent 0%, oklch(0.65 0.06 70 / 0.4) 50%, transparent 100%)",
                    }} />

                    <div className="flex h-full flex-col p-8 md:p-10">
                      <img
                        src="/logos/corporate-logo.png"
                        alt="宇聯國際"
                        className="h-10 w-auto mb-8 opacity-80"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />

                      <h2 style={{
                        fontSize: "clamp(1.7rem, 3vw, 2.6rem)",
                        fontWeight: 900,
                        letterSpacing: "-0.04em",
                        lineHeight: 1.05,
                        color: "oklch(0.80 0.06 70)",
                        fontFamily: "var(--font-corporate)",
                        marginBottom: "0.65rem",
                      }}>
                        宇聯國際
                      </h2>

                      <p style={{
                        fontSize: "0.875rem",
                        lineHeight: 1.9,
                        color: "oklch(0.75 0.02 85 / 0.38)",
                        marginBottom: "2.5rem",
                        flex: 1,
                        fontFamily: "var(--font-corporate)",
                      }}>
                        宇聯國際文化餐飲有限公司<br />
                        集團總部 · 企業資訊 · 線上商城 · 加盟主專區
                      </p>

                      <div style={{
                        height: 1,
                        background: "oklch(0.65 0.06 70 / 0.08)",
                        marginBottom: "1.5rem",
                      }} />

                      <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        fontSize: "0.85rem", fontWeight: 700,
                        color: "oklch(0.65 0.06 70 / 0.7)",
                        fontFamily: "var(--font-corporate)",
                        letterSpacing: "0.05em",
                      }}>
                        進入官網
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </div>
                    </div>
                  </a>
                </Link>
              </motion.div>
            </div>

            {/* 快速前往 */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.34 }}
              className="text-center"
            >
              <p style={{
                fontSize: "0.7rem",
                color: "oklch(0.75 0.02 85 / 0.22)",
                marginBottom: "0.8rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontFamily: "var(--font-corporate)",
              }}>
                快速前往
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { href: "/shop", label: "線上商城" },
                  { href: "/brand/franchise", label: "加盟諮詢" },
                  { href: "/brand/stores", label: "門市據點" },
                ].map(item => (
                  <Link key={item.href} href={item.href}>
                    <a style={{
                      display: "inline-block",
                      padding: "0.45rem 1.1rem",
                      background: "oklch(0.75 0.02 85 / 0.05)",
                      border: "1px solid oklch(0.75 0.02 85 / 0.10)",
                      borderRadius: 2,
                      color: "oklch(0.75 0.02 85 / 0.45)",
                      fontSize: "0.78rem",
                      fontFamily: "var(--font-corporate)",
                      letterSpacing: "0.04em",
                      transition: "background 0.2s, color 0.2s",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "oklch(0.75 0.02 85 / 0.1)";
                      el.style.color = "oklch(0.75 0.02 85 / 0.7)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "oklch(0.75 0.02 85 / 0.05)";
                      el.style.color = "oklch(0.75 0.02 85 / 0.45)";
                    }}
                    >
                      {item.label}
                    </a>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Stats ── */}
          <div style={{
            borderTop: "1px solid oklch(0.75 0.02 85 / 0.06)",
            background: "oklch(0.75 0.02 85 / 0.02)",
          }}
            className="py-20"
          >
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease: EASE }}
                className="mb-14 text-center"
              >
                <h2 style={{
                  fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "oklch(0.97 0.02 85)",
                  fontFamily: "var(--font-brand)",
                  marginBottom: "0.5rem",
                }}>
                  用數字說話
                </h2>
                <p style={{
                  color: "oklch(0.75 0.02 85 / 0.35)",
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-corporate)",
                }}>
                  宇聯國際的成長軌跡
                </p>
              </motion.div>

              <div className="grid grid-cols-1 gap-10 md:grid-cols-3 max-w-3xl mx-auto">
                {[
                  { end: 12, suffix: "+", label: "門市據點" },
                  { end: 5, suffix: "+", label: "服務年數" },
                  { end: 1200000, suffix: "+", label: "服務顧客" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: EASE, delay: i * 0.08 }}
                    className="text-center"
                  >
                    <p style={{
                      fontSize: "clamp(2.6rem, 5vw, 3.8rem)",
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      color: "oklch(0.75 0.18 70)",
                      fontFamily: "var(--font-brand)",
                      lineHeight: 1,
                      marginBottom: "0.5rem",
                    }}>
                      <CountUp end={item.end} suffix={item.suffix} />
                    </p>
                    <p style={{
                      fontSize: "0.85rem",
                      color: "oklch(0.75 0.02 85 / 0.4)",
                      fontFamily: "var(--font-corporate)",
                      letterSpacing: "0.1em",
                    }}>
                      {item.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <footer style={{
            borderTop: "1px solid oklch(0.75 0.02 85 / 0.06)",
            padding: "2rem 0",
            textAlign: "center",
          }}>
            <p style={{
              color: "oklch(0.75 0.02 85 / 0.18)",
              fontSize: "0.75rem",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-corporate)",
            }}>
              © {new Date().getFullYear()} 宇聯國際文化餐飲有限公司. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
