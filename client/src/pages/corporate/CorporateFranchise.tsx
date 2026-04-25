import { useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Phone, Mail, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const C = {
  bg: "oklch(0.12 0.01 60)",
  bgAlt: "oklch(0.97 0.02 85)",
  bgMid: "oklch(0.17 0.015 65)",
  text: "oklch(0.95 0.01 80)",
  textMuted: "oklch(0.60 0.025 75)",
  accent: "oklch(0.72 0.14 78)",
  accentDim: "oklch(0.26 0.06 78)",
  divide: "oklch(0.22 0.02 70)",
  divideLight: "oklch(0.88 0.015 85)",
  textOnAlt: "oklch(0.16 0.02 60)",
  textMutedOnAlt: "oklch(0.40 0.02 65)",
  inputBg: "oklch(0.20 0.015 65)",
};

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

function RevealLeft({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: -48 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.85, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

function RevealRight({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: 48 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.85, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────────
const advantages = [
  {
    num: "01",
    title: "總部直接供鏈，成本透明可控",
    body: "中央廚房統一採購與配送，消除個別門市的供應商談判成本。所有食材規格、單位成本、配送頻率皆有書面 SLA，適合多店同步展開的企業加盟主。",
  },
  {
    num: "02",
    title: "SOP 標準化，不依賴人才市場",
    body: "全套自動化設備搭配 14 天標準培訓，門市操作不需資深廚師。企業展店時，人員招募與訓練週期短、複製門檻低，適合快速多店佈局。",
  },
  {
    num: "03",
    title: "數位系統整合，營運數據即時可視",
    body: "自主研發的 ERP 系統涵蓋點餐、庫存、採購到損益報表，企業加盟主可跨店即時追蹤各門市數據，不需仰賴現場回報。",
  },
  {
    num: "04",
    title: "免抽營業額，收益歸屬清晰",
    body: "加盟模式不抽取任何營業額，僅收固定加盟金與耗材進貨差，讓企業合作夥伴的財務預測清晰可信，適合需要向股東或銀行說明的展店計畫。",
  },
];

const steps = [
  { num: "01", title: "初步洽詢", desc: "填寫企業加盟諮詢表單，加盟專員安排一對一說明" },
  { num: "02", title: "企業審核", desc: "評估企業背景、展店規劃與財務可行性" },
  { num: "03", title: "商圈評估", desc: "專業團隊協助多點選址，分析商圈潛力與競合關係" },
  { num: "04", title: "簽訂合約", desc: "確認合作框架後簽訂加盟合約，明訂雙方權利義務" },
  { num: "05", title: "教育訓練", desc: "總部完整培訓課程，含餐點製作、SOP 與店務管理" },
  { num: "06", title: "開幕輔導", desc: "總部派員駐點，確保首家門市順利達標後再複製展店" },
];

const costItems = [
  { label: "加盟金", value: "36 萬元", note: "一次性，不抽營業額" },
  { label: "裝潢費", value: "138–158 萬元", note: "依店面坪數與位置浮動" },
  { label: "設備採購", value: "總部統一規格", note: "含自動化備餐設備" },
  { label: "培訓費用", value: "含於加盟金", note: "14 天速成班，可帶 2 名學員" },
  { label: "權利金", value: "0", note: "不抽營業額，不收月費" },
];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function CorporateFranchise() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    budget: "",
    experience: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const submitInquiry = trpc.franchise.submitInquiry.useMutation({
    onSuccess: () => {
      toast.success("感謝您的諮詢！我們將於 24 小時內與您聯繫");
      setFormData({ name: "", phone: "", email: "", location: "", budget: "", experience: "", message: "" });
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    },
    onError: (error) => {
      toast.error(error.message || "提交失敗，請稍後再試");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("請輸入正確的 Email 格式");
      return;
    }
    setIsSubmitting(true);
    submitInquiry.mutate(formData);
  };

  return (
    <CorporateLayout>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] overflow-hidden flex items-end"
        style={{ background: C.bg }}
      >
        <motion.div
          style={{ y: bgY }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.1 }}
          className="absolute inset-y-0 right-0 w-[58vw] pointer-events-none select-none"
          aria-hidden="true"
        >
          <img
            src="/images/logo-intro-dark.png"
            alt=""
            className="w-full h-full object-cover object-left"
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to right, ${C.bg} 0%, transparent 40%)` }}
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to top, ${C.bg} 0%, transparent 35%)` }}
          />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 w-full pb-20 px-6 md:px-12 lg:px-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mb-5"
          >
            <span
              className="text-xs font-bold tracking-[0.22em] uppercase px-3 py-1.5 rounded-full"
              style={{ background: C.accentDim, color: C.accent }}
            >
              企業加盟合作
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 52 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, ease: EASE_OUT_EXPO, delay: 0.18 }}
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(52px, 9.5vw, 128px)",
              lineHeight: 0.88,
              letterSpacing: "-0.03em",
              color: C.text,
            }}
          >
            讓制度
            <br />
            幫你
            <br />
            <span style={{ color: C.accent }}>複製成功</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay: 0.38 }}
            className="mt-8 max-w-md text-base md:text-lg leading-relaxed"
            style={{ color: C.textMuted }}
          >
            宇聯國際提供完整的企業加盟體系，
            從供應鏈到數位管理，讓多店展開有系統、有依據、有數字可循。
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.52 }}
            className="mt-10"
          >
            <button
              className="group flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all duration-200"
              style={{
                background: C.accent,
                color: "oklch(0.12 0.01 60)",
                boxShadow: `0 8px 32px oklch(0.72 0.14 78 / 0.35)`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 40px oklch(0.72 0.14 78 / 0.55)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 32px oklch(0.72 0.14 78 / 0.35)`;
              }}
              onClick={() => document.getElementById("franchise-form")?.scrollIntoView({ behavior: "smooth" })}
            >
              立即洽詢加盟合作
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.72 }}
            className="mt-14 flex items-center gap-8 flex-wrap"
          >
            {[
              { val: "12", label: "直營暨加盟門市" },
              { val: "36萬", label: "加盟金" },
              { val: "0%", label: "營業額抽成" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-8">
                {i > 0 && <div className="w-px h-10" style={{ background: C.divide }} />}
                <div>
                  <p
                    className="text-4xl font-black leading-none"
                    style={{ fontFamily: "var(--font-brand)", color: C.accent }}
                  >
                    {item.val}
                  </p>
                  <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5"
            style={{ borderColor: C.divide }}
          >
            <div className="w-1 h-1.5 rounded-full" style={{ background: C.textMuted }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── 四大企業合作優勢 ────────────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: C.bg }}
      >
        <Reveal className="mb-16">
          <h2
            className="font-black"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(32px, 4.5vw, 58px)",
              color: C.text,
              letterSpacing: "-0.02em",
            }}
          >
            為什麼是宇聯國際
          </h2>
          <p className="mt-3 text-base max-w-xl" style={{ color: C.textMuted }}>
            從供應鏈設計到數位系統，我們為企業合作夥伴提供的不是品牌授權，而是一套可複製的餐飲展店模型。
          </p>
        </Reveal>

        <div className="divide-y" style={{ borderColor: C.divide }}>
          {advantages.map((a, i) => (
            <Reveal key={a.num} delay={i * 0.07}>
              <motion.div
                className="py-10 grid md:grid-cols-[100px_240px_1fr] gap-6 items-start group cursor-default"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <span
                  className="font-black leading-none"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(32px, 4vw, 52px)",
                    color: C.accentDim,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {a.num}
                </span>
                <h3
                  className="font-black self-center"
                  style={{
                    fontSize: "clamp(15px, 1.6vw, 20px)",
                    color: C.text,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                  }}
                >
                  {a.title}
                </h3>
                <p
                  className="text-base leading-relaxed self-center"
                  style={{ color: C.textMuted }}
                >
                  {a.body}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 費用結構 ────────────────────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: C.bgAlt }}
      >
        <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl">
          <RevealLeft delay={0.05}>
            <p
              className="text-xs font-bold tracking-[0.22em] uppercase mb-6"
              style={{ color: C.accent }}
            >
              費用結構
            </p>
            <h2
              className="font-black mb-8"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(32px, 4.5vw, 58px)",
                color: C.textOnAlt,
                letterSpacing: "-0.02em",
              }}
            >
              數字清楚，
              <br />
              展店才有
              <br />
              說服力
            </h2>
            <p
              className="text-base leading-relaxed max-w-sm"
              style={{ color: C.textMutedOnAlt }}
            >
              我們不藏費用結構。加盟金、裝潢成本、設備規格與持續費用，
              在洽談階段即全部攤開，讓您的財務計畫與股東說明都有憑有據。
            </p>
            <div className="mt-10 h-0.5 w-16" style={{ background: C.accent }} />
          </RevealLeft>

          <div className="divide-y" style={{ borderColor: C.divideLight }}>
            {costItems.map((item, i) => (
              <RevealRight key={i} delay={i * 0.08}>
                <div className="py-7 flex items-start justify-between gap-6">
                  <div>
                    <p
                      className="font-bold mb-1"
                      style={{ fontSize: "clamp(15px, 1.5vw, 18px)", color: C.textOnAlt }}
                    >
                      {item.label}
                    </p>
                    <p className="text-sm" style={{ color: C.textMutedOnAlt }}>
                      {item.note}
                    </p>
                  </div>
                  <p
                    className="font-black shrink-0"
                    style={{
                      fontFamily: "var(--font-brand)",
                      fontSize: "clamp(18px, 2vw, 26px)",
                      color: item.value === "0" ? C.accent : C.textOnAlt,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              </RevealRight>
            ))}
          </div>
        </div>
      </section>

      {/* ── 合作流程 ────────────────────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: C.bgMid }}
      >
        <Reveal className="mb-16">
          <h2
            className="font-black"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(32px, 4.5vw, 58px)",
              color: C.text,
              letterSpacing: "-0.02em",
            }}
          >
            六步驟
            <span style={{ color: C.accent }}>正式合作</span>
          </h2>
        </Reveal>

        <div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-px max-w-5xl"
          style={{ background: C.divide }}
        >
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.06}>
              <div className="p-8" style={{ background: C.bgMid }}>
                <span
                  className="block font-black leading-none mb-4"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(44px, 6vw, 72px)",
                    color: C.accentDim,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {s.num}
                </span>
                <h3
                  className="font-bold mb-2"
                  style={{
                    fontSize: "clamp(16px, 1.8vw, 20px)",
                    color: C.text,
                  }}
                >
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 引言帶 FRANCHISE ────────────────────────────────────────────────── */}
      <section
        className="relative py-36 px-6 overflow-hidden"
        style={{ background: C.accent }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none whitespace-nowrap"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(80px, 18vw, 280px)",
              color: "oklch(0.62 0.18 78)",
              letterSpacing: "-0.04em",
              opacity: 0.28,
            }}
          >
            FRANCHISE
          </span>
        </div>

        <Reveal className="relative z-10 max-w-3xl mx-auto text-center">
          <p
            className="text-xs font-bold tracking-[0.28em] uppercase mb-8"
            style={{ color: "oklch(0.30 0.08 75)" }}
          >
            企業加盟合作
          </p>
          <h2
            className="font-black leading-tight mb-8"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(28px, 4.5vw, 58px)",
              color: "oklch(0.12 0.01 60)",
              letterSpacing: "-0.02em",
            }}
          >
            讓敢拚的人，
            <br />
            有系統可依，
            <br />
            有舞台可站。
          </h2>
          <p
            className="text-base md:text-lg leading-relaxed max-w-xl mx-auto"
            style={{ color: "oklch(0.30 0.06 70)" }}
          >
            這不只是一份加盟合約，而是一個可以長期信任的事業夥伴關係。
          </p>
        </Reveal>
      </section>

      {/* ── 企業諮詢表單 ────────────────────────────────────────────────────── */}
      <section
        id="franchise-form"
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: C.bg }}
      >
        <div className="max-w-4xl">
          <Reveal className="mb-14">
            <h2
              className="font-black"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(32px, 4.5vw, 58px)",
                color: C.text,
                letterSpacing: "-0.02em",
              }}
            >
              企業加盟諮詢
            </h2>
            <p className="mt-3 text-base" style={{ color: C.textMuted }}>
              填寫表單，加盟專員將於 24 小時內與您聯繫，安排一對一說明。
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            {submitSuccess && (
              <div
                className="mb-8 p-5 rounded-xl flex items-center gap-4"
                style={{
                  background: "oklch(0.25 0.06 150 / 0.3)",
                  border: "1px solid oklch(0.55 0.14 150)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.55 0.14 150)" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold" style={{ color: "oklch(0.75 0.14 150)" }}>
                    表單提交成功
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "oklch(0.60 0.10 150)" }}>
                    感謝您的諮詢，我們專人將於 24 小時內與您聯繫。
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium" style={{ color: C.textMuted }}>
                    姓名 *
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="請輸入您的姓名"
                    required
                    className="border-0 rounded-lg"
                    style={{ background: C.inputBg, color: C.text }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium" style={{ color: C.textMuted }}>
                    聯絡電話 *
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="請輸入您的電話"
                    required
                    className="border-0 rounded-lg"
                    style={{ background: C.inputBg, color: C.text }}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium" style={{ color: C.textMuted }}>
                    電子郵件
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="請輸入您的 Email"
                    className="border-0 rounded-lg"
                    style={{ background: C.inputBg, color: C.text }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium" style={{ color: C.textMuted }}>
                    預計展店地區
                  </Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="例如：台中市、台北市"
                    className="border-0 rounded-lg"
                    style={{ background: C.inputBg, color: C.text }}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium" style={{ color: C.textMuted }}>
                    預算規模
                  </Label>
                  <Input
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="例如：200-300 萬 / 多店規劃"
                    className="border-0 rounded-lg"
                    style={{ background: C.inputBg, color: C.text }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium" style={{ color: C.textMuted }}>
                    餐飲或創業背景
                  </Label>
                  <Input
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="例如：無經驗 / 現有餐飲事業"
                    className="border-0 rounded-lg"
                    style={{ background: C.inputBg, color: C.text }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: C.textMuted }}>
                  合作構想或想了解的事項
                </Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="例如：計劃展店數量、時程、特殊需求等..."
                  rows={4}
                  className="border-0 rounded-lg resize-none"
                  style={{ background: C.inputBg, color: C.text }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-full font-bold text-base transition-all duration-200 disabled:opacity-60"
                style={{
                  background: C.accent,
                  color: "oklch(0.12 0.01 60)",
                  boxShadow: `0 8px 32px oklch(0.72 0.14 78 / 0.35)`,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting)
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 40px oklch(0.72 0.14 78 / 0.55)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 32px oklch(0.72 0.14 78 / 0.35)`;
                }}
              >
                {isSubmitting ? "送出中..." : "送出企業諮詢表單"}
              </button>
            </form>
          </Reveal>
        </div>
      </section>

      {/* ── 聯絡資訊橫線 ────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-6 md:px-12 lg:px-20"
        style={{ background: C.bgAlt }}
      >
        <div className="max-w-3xl">
          <Reveal className="mb-10">
            <h3
              className="font-black"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(22px, 3vw, 36px)",
                color: C.textOnAlt,
                letterSpacing: "-0.01em",
              }}
            >
              直接聯絡加盟專線
            </h3>
          </Reveal>

          <div className="divide-y" style={{ borderColor: C.divideLight }}>
            {[
              { Icon: Phone, label: "加盟專線", value: "(04) 2437-9666" },
              { Icon: Mail, label: "電子郵件", value: "ordersome2020@gmail.com" },
              { Icon: MapPin, label: "總部地址", value: "台中市北屯區東山路一段 147 巷 10 弄 6 號" },
            ].map(({ Icon, label, value }, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div className="py-6 flex items-center gap-6">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.90 0.06 80)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "oklch(0.50 0.12 70)" }} />
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: C.textMutedOnAlt }}>
                      {label}
                    </p>
                    <p className="font-medium" style={{ color: C.textOnAlt }}>
                      {value}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA 底帶 ────────────────────────────────────────────────────────── */}
      <section
        className="py-24 px-6 md:px-12 lg:px-20"
        style={{ background: C.bg }}
      >
        <Reveal className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 max-w-5xl">
          <div>
            <h3
              className="font-black mb-2"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(26px, 4vw, 52px)",
                color: C.text,
                letterSpacing: "-0.02em",
              }}
            >
              進一步了解宇聯
            </h3>
            <p style={{ color: C.textMuted }}>
              深入了解企業文化，或直接聯絡我們的企業合作窗口。
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link href="/corporate/culture">
              <button
                className="px-8 py-4 rounded-full font-bold text-base transition-all duration-200"
                style={{
                  background: C.accent,
                  color: "oklch(0.12 0.01 60)",
                  boxShadow: `0 8px 32px oklch(0.72 0.14 78 / 0.35)`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 40px oklch(0.72 0.14 78 / 0.55)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 32px oklch(0.72 0.14 78 / 0.35)`;
                }}
              >
                了解企業文化
              </button>
            </Link>
            <Link href="/corporate/contact">
              <button
                className="px-8 py-4 rounded-full font-bold text-base border-2 transition-all duration-200"
                style={{ borderColor: C.divide, color: C.text, background: "transparent" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent;
                  (e.currentTarget as HTMLButtonElement).style.color = C.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = C.divide;
                  (e.currentTarget as HTMLButtonElement).style.color = C.text;
                }}
              >
                企業聯絡窗口
              </button>
            </Link>
          </div>
        </Reveal>
      </section>
    </CorporateLayout>
  );
}
