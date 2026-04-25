import { useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import CorporateLayout from "@/components/layout/CorporateLayout";

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
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

const contactInfo = [
  {
    icon: MapPin,
    label: "公司地址",
    value: "台中市北屯區東山路一段147巷10弄6號",
    sub: "總部暨中央廚房所在地",
  },
  {
    icon: Phone,
    label: "聯絡電話",
    value: "(04) 2437-9666",
    sub: "週一至週五，09:00 – 18:00",
  },
  {
    icon: Mail,
    label: "電子郵件",
    value: "ordersome2020@gmail.com",
    sub: "一般業務洽詢，24 小時內回覆",
  },
  {
    icon: Clock,
    label: "服務時間",
    value: "週一至週五 09:00 – 18:00",
    sub: "例假日及國定假日暫停服務",
  },
];

const inquiryTypes = [
  "B2B 企業採購",
  "異業聯盟合作",
  "媒體採訪邀約",
  "其他洽詢",
];

export default function CorporateContact() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("請輸入正確的 Email 格式");
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    toast.success("感謝您的來信，我們將於 24 小時內與您聯繫！");
    setFormData({ name: "", company: "", phone: "", email: "", message: "" });
    setSelectedType("");
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 5000);
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
              企業合作洽詢
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 52 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, ease: EASE_OUT_EXPO, delay: 0.18 }}
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(48px, 8.5vw, 118px)",
              lineHeight: 0.88,
              letterSpacing: "-0.03em",
              color: C.text,
            }}
          >
            讓合作
            <br />
            從這裡
            <br />
            <span style={{ color: C.accent }}>開始</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay: 0.38 }}
            className="mt-8 max-w-md text-base md:text-lg leading-relaxed"
            style={{ color: C.textMuted }}
          >
            無論是 B2B 企業採購、異業聯盟，或媒體合作洽詢，
            歡迎直接透過以下方式與我們聯繫。
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
              onClick={() =>
                document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              填寫詢問表單
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
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

      {/* ── CONTACT INFO ROWS (淺色) ──────────────────────────────────────── */}
      <section style={{ background: C.bgAlt }}>
        {contactInfo.map((item, i) => {
          const Icon = item.icon;
          return (
            <Reveal key={i} delay={i * 0.06}>
              <div
                className="flex items-start gap-6 px-6 md:px-12 lg:px-20 py-9"
                style={{ borderBottom: i < contactInfo.length - 1 ? `1px solid ${C.divideLight}` : "none" }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
                  style={{ background: C.accentDim }}
                >
                  <Icon className="h-4.5 w-4.5" style={{ color: C.accent }} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-bold tracking-[0.18em] uppercase mb-1"
                    style={{ color: C.textMutedOnAlt }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-lg md:text-xl font-semibold"
                    style={{ color: C.textOnAlt }}
                  >
                    {item.value}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: C.textMutedOnAlt }}>
                    {item.sub}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </section>

      {/* ── QUOTE BAND ────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24 flex items-center justify-center"
        style={{ background: C.bgMid }}
        aria-hidden="false"
      >
        <span
          className="absolute select-none pointer-events-none font-black leading-none"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(80px, 18vw, 220px)",
            color: "oklch(0.22 0.02 70 / 0.5)",
            letterSpacing: "-0.04em",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            whiteSpace: "nowrap",
          }}
          aria-hidden="true"
        >
          CONTACT
        </span>
        <Reveal className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <p
            className="text-xl md:text-2xl lg:text-3xl leading-snug font-medium"
            style={{ color: C.text, letterSpacing: "-0.01em" }}
          >
            每一個好的合作，
            <br />
            都從一封誠意十足的訊息開始。
          </p>
          <p className="mt-4 text-sm md:text-base" style={{ color: C.textMuted }}>
            無論您的需求規模大小，我們都認真對待。
          </p>
        </Reveal>
      </section>

      {/* ── FORM (深色) ───────────────────────────────────────────────────── */}
      <section
        id="contact-form"
        className="py-24 px-6 md:px-12 lg:px-20"
        style={{ background: C.bg }}
      >
        <Reveal className="max-w-2xl mx-auto">
          <p
            className="text-xs font-bold tracking-[0.22em] uppercase mb-4"
            style={{ color: C.accent }}
          >
            B2B 合作詢問
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: C.text, fontFamily: "var(--font-brand)", letterSpacing: "-0.02em" }}
          >
            告訴我們您的需求
          </h2>
          <p className="mb-10 text-base" style={{ color: C.textMuted }}>
            我們將於 24 小時內回覆，急件請直接來電。
          </p>

          {/* 詢問類型 pills */}
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-3" style={{ color: C.textMuted }}>
              詢問類型
            </p>
            <div className="flex flex-wrap gap-2">
              {inquiryTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(selectedType === type ? "" : type)}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200"
                  style={
                    selectedType === type
                      ? {
                          background: C.accent,
                          color: "oklch(0.12 0.01 60)",
                          borderColor: C.accent,
                        }
                      : {
                          background: "transparent",
                          color: C.textMuted,
                          borderColor: C.divide,
                        }
                  }
                  onMouseEnter={(e) => {
                    if (selectedType !== type) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent;
                      (e.currentTarget as HTMLButtonElement).style.color = C.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedType !== type) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.divide;
                      (e.currentTarget as HTMLButtonElement).style.color = C.textMuted;
                    }
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label
                  className="block text-xs font-semibold tracking-[0.12em] uppercase mb-2"
                  style={{ color: C.textMuted }}
                >
                  姓名 <span style={{ color: C.accent }}>*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="王大明"
                  className="border-0 focus-visible:ring-1 text-sm h-11"
                  style={{
                    background: C.inputBg,
                    color: C.text,
                    outlineColor: C.accent,
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold tracking-[0.12em] uppercase mb-2"
                  style={{ color: C.textMuted }}
                >
                  公司 / 單位
                </label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="宇聯股份有限公司"
                  className="border-0 focus-visible:ring-1 text-sm h-11"
                  style={{
                    background: C.inputBg,
                    color: C.text,
                    outlineColor: C.accent,
                  }}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label
                  className="block text-xs font-semibold tracking-[0.12em] uppercase mb-2"
                  style={{ color: C.textMuted }}
                >
                  電子郵件 <span style={{ color: C.accent }}>*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="you@company.com"
                  className="border-0 focus-visible:ring-1 text-sm h-11"
                  style={{
                    background: C.inputBg,
                    color: C.text,
                    outlineColor: C.accent,
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold tracking-[0.12em] uppercase mb-2"
                  style={{ color: C.textMuted }}
                >
                  聯絡電話
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0912-345-678"
                  className="border-0 focus-visible:ring-1 text-sm h-11"
                  style={{
                    background: C.inputBg,
                    color: C.text,
                    outlineColor: C.accent,
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-semibold tracking-[0.12em] uppercase mb-2"
                style={{ color: C.textMuted }}
              >
                訊息內容 <span style={{ color: C.accent }}>*</span>
              </label>
              <Textarea
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                placeholder="請簡述您的合作需求或詢問事項..."
                className="border-0 focus-visible:ring-1 text-sm resize-none"
                style={{
                  background: C.inputBg,
                  color: C.text,
                  outlineColor: C.accent,
                }}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: submitSuccess ? "oklch(0.55 0.14 145)" : C.accent,
                  color: "oklch(0.12 0.01 60)",
                  boxShadow: submitSuccess
                    ? "none"
                    : `0 8px 32px oklch(0.72 0.14 78 / 0.3)`,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting && !submitSuccess) {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 40px oklch(0.72 0.14 78 / 0.5)`;
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = submitSuccess
                    ? "none"
                    : `0 8px 32px oklch(0.72 0.14 78 / 0.3)`;
                }}
              >
                {isSubmitting
                  ? "傳送中..."
                  : submitSuccess
                  ? "訊息已送出，感謝您的聯繫"
                  : "送出詢問訊息"}
                {!isSubmitting && !submitSuccess && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                )}
              </button>
            </div>
          </form>
        </Reveal>
      </section>

      {/* ── CTA 底帶 ──────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-6 md:px-12 lg:px-20"
        style={{ background: C.bgAlt, borderTop: `1px solid ${C.divideLight}` }}
      >
        <Reveal className="max-w-3xl">
          <p
            className="text-xs font-bold tracking-[0.22em] uppercase mb-4"
            style={{ color: C.textMutedOnAlt }}
          >
            進一步了解宇聯
          </p>
          <h2
            className="text-2xl md:text-3xl font-bold mb-8"
            style={{
              color: C.textOnAlt,
              fontFamily: "var(--font-brand)",
              letterSpacing: "-0.02em",
            }}
          >
            想先了解我們是誰？
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/corporate/about">
              <button
                className="group flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm transition-all duration-200"
                style={{
                  background: C.textOnAlt,
                  color: C.bgAlt,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "";
                }}
              >
                關於宇聯
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link href="/corporate/franchise">
              <button
                className="group flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm border transition-all duration-200"
                style={{
                  background: "transparent",
                  color: C.textOnAlt,
                  borderColor: C.divideLight,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = C.textOnAlt;
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = C.divideLight;
                  (e.currentTarget as HTMLButtonElement).style.transform = "";
                }}
              >
                企業加盟合作
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </Reveal>
      </section>
    </CorporateLayout>
  );
}
