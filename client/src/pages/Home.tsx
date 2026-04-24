import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Utensils, Store, Calendar, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { injectSchema } from "@/hooks/schemaUtils";
import LogoIntro from "@/components/LogoIntro";
import CountUpNumber from "@/components/CountUpNumber";

const easeOut = [0.22, 1, 0.36, 1];

export default function Home() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    document.title = "來點什麼 Ordersome｜台中早午餐加盟首選、高人氣台韓式早餐";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "來點什麼 (Ordersome) 結合台灣經典與韓國風味，提供高利潤人氣美食。全台 15 間門市，大台中早午餐加盟、小資餐飲創業最佳推薦品牌。"
    );
    document.querySelector('meta[name="keywords"]')?.setAttribute(
      "content",
      "台中早午餐加盟, 早餐加盟, 台中美食, 台中韓式早午餐, 來點什麼, Ordersome"
    );

    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "來點什麼 Ordersome",
      "alternateName": "Ordersome",
      "url": "https://ordersome.com.tw",
      "logo": "https://ordersome.com.tw/logo.png",
      "description": "台中台韓式早午餐品牌，提供韓式飯捲、台式蛋餅、鐵板麵等美味餐點",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "台中市",
        "addressRegion": "台中市",
        "addressCountry": "TW"
      },
      "sameAs": ["https://www.facebook.com/ordersome"]
    };
    const cleanup = injectSchema("organization", schema);
    return cleanup;
  }, []);

  return (
    <>
      <LogoIntro onComplete={() => setShowContent(true)} />

      <div
        className="relative min-h-screen overflow-hidden"
        style={{ background: "#0f0d0b" }}
      >
        {/* ── 背景光暈 ── */}
        <div className="pointer-events-none absolute inset-0 z-0">
          {/* 左上琥珀暈 */}
          <div style={{
            position: "absolute", top: -120, left: -80,
            width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,179,0,0.12) 0%, transparent 65%)",
          }} />
          {/* 右下暖暈 */}
          <div style={{
            position: "absolute", bottom: -80, right: -60,
            width: 480, height: 480, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(180,83,9,0.10) 0%, transparent 65%)",
          }} />
          {/* 噪點紋理 */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.028,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "160px",
          }} />
        </div>

        {/* ── 主內容 ── */}
        <div
          className="relative z-10 flex min-h-screen flex-col"
          style={{
            opacity: showContent ? 1 : 0,
            transition: "opacity 0.7s ease",
          }}
        >
          {/* Hero */}
          <div className="flex flex-1 flex-col items-center justify-center px-5 pb-12 pt-20">

            {/* 標題區 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: easeOut }}
              className="mb-12 text-center"
            >
              {/* 品牌 badge */}
              <span style={{
                display: "inline-block",
                marginBottom: "1.5rem",
                padding: "0.35rem 1.1rem",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#f5b300",
                background: "rgba(245,179,0,0.09)",
                border: "1px solid rgba(245,179,0,0.18)",
              }}>
                Ordersome · 宇聯國際
              </span>

              <h1
                style={{
                  fontSize: "clamp(3.2rem, 9vw, 7.5rem)",
                  fontWeight: 900,
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                  color: "#fff4ca",
                  textShadow: "0 0 120px rgba(245,179,0,0.15)",
                  fontFamily: "'Noto Serif TC', 'PingFang TC', 'Microsoft JhengHei', serif",
                }}
              >
                宇聯國際
              </h1>

              <p style={{
                marginTop: "1.25rem",
                fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)",
                color: "rgba(255,244,202,0.4)",
                lineHeight: 1.8,
              }}>
                宇聯國際文化餐飲有限公司，致力於打造優質餐飲品牌，<br className="hidden md:block" />
                為顧客帶來美好的用餐體驗
              </p>
            </motion.div>

            {/* ── 兩張卡片 ── */}
            <div className="grid w-full max-w-5xl gap-4 md:grid-cols-2">

              {/* 卡片 A：來點什麼 */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.12, ease: easeOut }}
              >
                <Link href="/brand">
                  <a
                    className="group block overflow-hidden cursor-pointer"
                    style={{
                      borderRadius: 28,
                      background: "linear-gradient(145deg, #1c1408 0%, #2a1c08 45%, #38250a 100%)",
                      border: "1px solid rgba(245,179,0,0.16)",
                      transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(-6px)";
                      el.style.boxShadow = "0 0 56px rgba(245,179,0,0.16), 0 28px 56px -16px rgba(0,0,0,0.55)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(0)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    {/* 頂部光線 */}
                    <div style={{
                      height: 1,
                      background: "linear-gradient(90deg, transparent 0%, rgba(245,179,0,0.55) 50%, transparent 100%)",
                    }} />

                    <div className="p-8 md:p-10">
                      {/* 頂部列：logo + icon */}
                      <div className="mb-7 flex items-center justify-between">
                        <img
                          src="/logos/brand-logo-yellow.png"
                          alt="來點什麼"
                          className="h-16 w-auto md:h-20"
                        />
                        <div style={{
                          width: 48, height: 48, borderRadius: 16,
                          background: "rgba(245,179,0,0.12)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: "1px solid rgba(245,179,0,0.18)",
                        }}>
                          <Utensils style={{ width: 22, height: 22, color: "#f5b300" }} />
                        </div>
                      </div>

                      <h2 style={{
                        fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                        fontWeight: 900,
                        letterSpacing: "-0.04em",
                        lineHeight: 1.1,
                        color: "#fff4ca",
                        fontFamily: "'Noto Serif TC', 'PingFang TC', serif",
                        marginBottom: "0.75rem",
                      }}>
                        來點什麼
                      </h2>

                      <p style={{
                        fontSize: "0.9rem",
                        lineHeight: 1.85,
                        color: "rgba(255,244,202,0.45)",
                        marginBottom: "2rem",
                      }}>
                        ORDER SOME — 台韓風味早午餐品牌<br />
                        用心製作每一份餐點，為您帶來美好的一天開始
                      </p>

                      <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        fontSize: "0.875rem", fontWeight: 700,
                        color: "#f5b300",
                      }}>
                        探索品牌
                        <ArrowRight
                          style={{ width: 16, height: 16, transition: "transform 0.3s ease" }}
                          className="group-hover:translate-x-1.5"
                        />
                      </div>
                    </div>
                  </a>
                </Link>
              </motion.div>

              {/* 卡片 B：宇聯國際 */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.22, ease: easeOut }}
              >
                <Link href="/corporate">
                  <a
                    className="group block h-full overflow-hidden cursor-pointer"
                    style={{
                      borderRadius: 28,
                      background: "linear-gradient(145deg, #161412 0%, #1d1a16 100%)",
                      border: "1px solid rgba(201,169,110,0.15)",
                      transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), border-color 0.35s ease, box-shadow 0.35s ease",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(-6px)";
                      el.style.borderColor = "rgba(201,169,110,0.4)";
                      el.style.boxShadow = "0 28px 56px -16px rgba(0,0,0,0.5)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(0)";
                      el.style.borderColor = "rgba(201,169,110,0.15)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    {/* 頂部光線 */}
                    <div style={{
                      height: 1,
                      background: "linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.45) 50%, transparent 100%)",
                    }} />

                    <div className="flex h-full flex-col p-8 md:p-10">
                      {/* 頂部列：logo + icon */}
                      <div className="mb-7 flex items-center justify-between">
                        <img
                          src="/logos/corporate-logo.png"
                          alt="宇聯國際"
                          className="h-12 w-auto opacity-85"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                        <div style={{
                          width: 48, height: 48, borderRadius: 16,
                          background: "rgba(201,169,110,0.08)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: "1px solid rgba(201,169,110,0.15)",
                        }}>
                          <Building2 style={{ width: 22, height: 22, color: "#c9a96e" }} />
                        </div>
                      </div>

                      <h2 style={{
                        fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                        fontWeight: 900,
                        letterSpacing: "-0.04em",
                        lineHeight: 1.1,
                        color: "#c9a96e",
                        fontFamily: "'Noto Serif TC', 'PingFang TC', serif",
                        marginBottom: "0.75rem",
                      }}>
                        宇聯國際
                      </h2>

                      <p style={{
                        fontSize: "0.9rem",
                        lineHeight: 1.85,
                        color: "rgba(255,244,202,0.35)",
                        marginBottom: "2rem",
                        flex: 1,
                      }}>
                        宇聯國際文化餐飲有限公司<br />
                        集團總部 · 企業資訊 · 線上商城、加盟主專區
                      </p>

                      <div style={{
                        height: 1,
                        background: "rgba(201,169,110,0.10)",
                        marginBottom: "1.5rem",
                      }} />

                      <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        fontSize: "0.875rem", fontWeight: 700,
                        color: "rgba(201,169,110,0.65)",
                      }}>
                        進入官網
                        <ArrowRight
                          style={{ width: 16, height: 16, transition: "transform 0.3s ease" }}
                          className="group-hover:translate-x-1.5"
                        />
                      </div>
                    </div>
                  </a>
                </Link>
              </motion.div>
            </div>

            {/* 快速前往 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.34, ease: easeOut }}
              className="mt-10 text-center"
            >
              <p style={{ fontSize: "0.75rem", color: "rgba(255,244,202,0.25)", marginBottom: "0.85rem", letterSpacing: "0.2em" }}>
                快速前往
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { href: "/shop", label: "線上商城" },
                  { href: "/brand/franchise", label: "加盟諮詢" },
                  { href: "/brand/stores", label: "門市據點" },
                ].map(item => (
                  <Button key={item.href} asChild variant="outline" className="rounded-full" style={{
                    background: "rgba(255,244,202,0.05)",
                    border: "1px solid rgba(255,244,202,0.12)",
                    color: "rgba(255,244,202,0.5)",
                    fontSize: "0.8rem",
                  }}>
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Stats Section ── */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,244,202,0.06)" }}
            className="py-20"
          >
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-14 text-center"
              >
                <h2 style={{
                  fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#fff4ca",
                  fontFamily: "'Noto Serif TC', 'PingFang TC', serif",
                  marginBottom: "0.5rem",
                }}>
                  用數字說話
                </h2>
                <p style={{ color: "rgba(255,244,202,0.35)", fontSize: "0.95rem" }}>
                  宇聯國際的成長軌跡
                </p>
              </motion.div>

              <div className="grid grid-cols-1 gap-12 md:grid-cols-3 max-w-4xl mx-auto">
                <CountUpNumber end={12} suffix="+" label="門市據點" icon={<Store className="h-8 w-8 text-white" />} />
                <CountUpNumber end={5} suffix="+" label="服務年數" icon={<Calendar className="h-8 w-8 text-white" />} />
                <CountUpNumber end={1200000} suffix="+" label="服務顧客" icon={<Users className="h-8 w-8 text-white" />} />
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <footer style={{
            borderTop: "1px solid rgba(255,244,202,0.06)",
            padding: "2rem 0",
            textAlign: "center",
          }}>
            <p style={{ color: "rgba(255,244,202,0.18)", fontSize: "0.78rem", letterSpacing: "0.06em" }}>
              © {new Date().getFullYear()} 宇聯國際文化餐飲有限公司. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
