import { useState, useEffect, useRef } from "react";
import { injectSchema } from "@/hooks/schemaUtils";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Phone, Mail, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

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

const pillars = [
  {
    num: "01",
    title: "台韓混血，長青菜單",
    body: "保留台灣人必吃的蛋餅、鐵板麵（剛需），搭配韓式口味（特色），是能做 10 年的長久生意，不跟著流行起伏。",
  },
  {
    num: "02",
    title: "免抽營業額，獲利留給你",
    body: "加盟金 36 萬元，裝潢費用依規模約 138-158 萬元，不抽取任何營業額。你賺多少，全進你口袋。",
  },
  {
    num: "03",
    title: "14 天速成，零經驗可上手",
    body: "全套 SOP 與自動化設備，不依賴大廚。14 天培訓班涵蓋出餐、備料、店務，夫妻二人即可獨立運作。",
  },
  {
    num: "04",
    title: "全天候雙時段獲利",
    body: "06:00 到 02:00 全日供應，午餐賣韓式拌麵、宵夜賣炸物拼盤，打破早餐店坪效天花板。",
  },
];

const steps = [
  { num: "01", title: "線上諮詢", desc: "填寫加盟諮詢表單，專人 24 小時內聯繫" },
  { num: "02", title: "加盟說明", desc: "一對一解說品牌理念、加盟條件與投資規劃" },
  { num: "03", title: "商圈評估", desc: "專業團隊協助評估店面位置與商圈潛力" },
  { num: "04", title: "簽約合作", desc: "確認合作意向後簽訂合約，正式成為夥伴" },
  { num: "05", title: "教育訓練", desc: "完整的餐點製作與店務經營培訓課程" },
  { num: "06", title: "開店營運", desc: "總部全程協助開店準備，陪你順利開業" },
];

const faqs = [
  {
    q: "為什麼選擇「來點什麼」而不是知名連鎖大品牌？",
    a: "大品牌權利金高、裝潢綁定多。我們主打「免權利金」與「彈性裝潢」，將利潤真正留給加盟主。加盟金 36 萬元，裝潢費用依店面規模約 138-158 萬元，不抽取營業額，讓你的獲利完全屬於自己。",
  },
  {
    q: "我沒有餐飲經驗，且擔心請不到廚師怎麼辦？",
    a: "我們導入全套 SOP 與自動化設備，只要會操作機器就能出餐，不依賴大廚。14 天培訓課程由專業講師手把手教學，夫妻創業也能輕鬆上手。",
  },
  {
    q: "韓式料理退燒了，現在加入還來得及嗎？",
    a: "我們是「台韓混血」，不是純韓食。保留台灣人必吃的蛋餅、鐵板麵（剛需），搭配韓式口味（特色），這是能做 10 年的長久生意。雙時段獲利模式從早到深夜全覆蓋。",
  },
  {
    q: "加盟後總部會提供什麼支援？",
    a: "食材統一供應、行銷企劃活動、店務經營輔導、新品研發菜單更新，以及持續的教育訓練課程。我們是你創業路上最堅強的後盾。",
  },
  {
    q: "可以自己選擇開店地點嗎？",
    a: "可以。你依偏好選擇商圈，我們的專業團隊協助評估店面適合度、提供商圈分析與建議，確保選擇的地點具有良好發展潛力。",
  },
  {
    q: "來點什麼的品牌特色是什麼？",
    a: "台灣首創台韓風味早午餐品牌，將傳統早餐店翻轉成年輕、時尚的用餐體驗。獨特的韓式飯捲、台韓辣醬等特色產品，深受 18-35 歲年輕族群喜愛。",
  },
];

export default function BrandFranchise() {
  useEffect(() => {
    document.title = "2026 早餐加盟推薦｜來點什麼 總部支援與小本創業方案";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "尋找高獲利早午餐店？來點什麼提供完善餐飲加盟體系、14天速成培訓與行銷支援。立即了解台中早午餐加盟與獲利模式。"
      );

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "台灣早午餐加盟推薦哪一間品牌？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "推薦『來點什麼 Ordersome』。由宇聯國際文化餐飲有限公司營運，具備高利潤菜單結構、完善的總部支援與全台 12 間門市成功驗證。",
          },
        },
        {
          "@type": "Question",
          name: "加盟『來點什麼』需要多少加盟金？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "來點什麼加盟金 36 萬元，裝潢費用依店面規模約 138-158 萬元。不抽取營業額，讓您的獲利完全屬於自己。",
          },
        },
        {
          "@type": "Question",
          name: "無餐飲經驗可以加盟早午餐嗎？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "可以。來點什麼提供 14 天速成培訓班，全套 SOP 與自動化設備，不依賴大廚，夫妻二人即可獨立運作。",
          },
        },
      ],
    };
    const cleanup = injectSchema("faq", faqSchema as Record<string, unknown>);
    return cleanup;
  }, []);

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
      setFormData({
        name: "",
        phone: "",
        email: "",
        location: "",
        budget: "",
        experience: "",
        message: "",
      });
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    },
    onError: (error) => {
      toast.error(error.message || "提交失敗，請稍後再試");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      toast.error("請輸入正確的 Email 格式");
      return;
    }
    setIsSubmitting(true);
    submitInquiry.mutate(formData);
  };

  return (
    <BrandLayout>
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[90vh] overflow-hidden flex items-end"
        style={{ background: "oklch(0.18 0.02 60)" }}
      >
        {/* 背景大字 */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none whitespace-nowrap"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(100px, 22vw, 360px)",
              color: "oklch(0.22 0.02 60)",
              letterSpacing: "-0.04em",
            }}
          >
            JOIN US
          </span>
        </div>

        {/* 右側食物圖 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, x: 60 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: 0.2 }}
          className="absolute top-16 right-0 w-[42vw] max-w-[520px] aspect-[3/4] overflow-hidden"
          style={{ borderRadius: "0 0 0 36% 0" }}
        >
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/VjlyUhcBYLeXUEcB.jpg"
            alt="來點什麼招牌菜，加盟創業首選"
            className="w-full h-full object-cover"
            style={{ filter: "saturate(1.05) brightness(0.9)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom left, transparent 55%, oklch(0.18 0.02 60) 100%)",
            }}
          />
        </motion.div>

        {/* 主文字 */}
        <div className="relative z-10 w-full pb-20 px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-5"
          >
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full"
              style={{
                background: "oklch(0.75 0.18 70)",
                color: "oklch(0.98 0.01 85)",
              }}
            >
              加盟創業
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, ease: EASE_OUT_EXPO, delay: 0.18 }}
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(52px, 9.5vw, 124px)",
              lineHeight: 0.88,
              letterSpacing: "-0.03em",
              color: "oklch(0.97 0.02 85)",
            }}
          >
            把早餐店
            <br />
            做成
            <span style={{ color: "oklch(0.75 0.18 70)" }}>事業</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.38 }}
            className="mt-8 max-w-md text-base md:text-lg leading-relaxed"
            style={{ color: "oklch(0.65 0.03 70)" }}
          >
            免抽營業額，14 天速成培訓，零餐飲經驗也能上手。
            加盟金 36 萬，全天候台韓風味雙時段獲利。
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
                background: "oklch(0.75 0.18 70)",
                color: "oklch(0.18 0.02 60)",
                boxShadow: "0 8px 32px oklch(0.75 0.18 70 / 0.35)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 12px 40px oklch(0.75 0.18 70 / 0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 8px 32px oklch(0.75 0.18 70 / 0.35)";
              }}
              onClick={() =>
                document
                  .getElementById("franchise-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              立即諮詢加盟
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>

          {/* 數字條 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-14 flex items-center gap-8 flex-wrap"
          >
            {[
              { val: "36萬", label: "加盟金" },
              { val: "14天", label: "速成培訓" },
              { val: "06–02", label: "全天候供應" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-8">
                {i > 0 && (
                  <div
                    className="w-px h-10"
                    style={{ background: "oklch(0.30 0.02 60)" }}
                  />
                )}
                <div>
                  <p
                    className="text-3xl font-black leading-none"
                    style={{
                      fontFamily: "var(--font-brand)",
                      color: "oklch(0.75 0.18 70)",
                    }}
                  >
                    {item.val}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "oklch(0.50 0.03 70)" }}
                  >
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 四大優勢 ──────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        <Reveal className="mb-16">
          <h2
            className="font-black"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(34px, 5vw, 68px)",
              color: "oklch(0.18 0.02 60)",
              letterSpacing: "-0.02em",
            }}
          >
            為什麼是
            <span style={{ color: "oklch(0.75 0.18 70)" }}>來點什麼</span>
          </h2>
          <p
            className="mt-3 text-base"
            style={{ color: "oklch(0.50 0.03 60)" }}
          >
            四個理由，讓你的創業少走彎路
          </p>
        </Reveal>

        <div
          className="space-y-0 divide-y max-w-4xl"
          style={{ borderColor: "oklch(0.88 0.03 85)" }}
        >
          {pillars.map((p, i) => (
            <Reveal key={p.num} delay={i * 0.08}>
              <div className="py-10 grid md:grid-cols-[100px_1fr] gap-6 items-start">
                <span
                  className="font-black leading-none"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(40px, 6vw, 72px)",
                    color: "oklch(0.88 0.08 75)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {p.num}
                </span>
                <div>
                  <h3
                    className="font-black mb-3"
                    style={{
                      fontSize: "clamp(18px, 2.2vw, 26px)",
                      color: "oklch(0.18 0.02 60)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="leading-relaxed text-base max-w-2xl"
                    style={{ color: "oklch(0.46 0.03 60)" }}
                  >
                    {p.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 視覺分隔：圖片 + 引言 ────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "oklch(0.75 0.18 70)" }}
      >
        <div className="grid md:grid-cols-2 min-h-[420px]">
          <div className="overflow-hidden">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/cAkpoRocvsmsyigJ.png"
              alt="韓式飯捲、台式蛋餅，來點什麼台韓混血"
              className="w-full h-full object-cover"
              style={{ filter: "saturate(1.1)" }}
            />
          </div>
          <RevealLeft className="flex flex-col justify-center px-10 md:px-16 py-16">
            <p
              className="font-black leading-tight mb-6"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(24px, 3.5vw, 46px)",
                color: "oklch(0.18 0.02 60)",
                letterSpacing: "-0.02em",
              }}
            >
              「讓敢拚的人，
              <br />
              有系統可依，
              <br />
              有舞台可站。」
            </p>
            <p
              className="text-sm tracking-widest uppercase font-bold"
              style={{ color: "oklch(0.42 0.10 65)" }}
            >
              品牌使命
            </p>
          </RevealLeft>
        </div>
      </section>

      {/* ── 加盟流程 ──────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.13 0.015 60)" }}
      >
        <Reveal className="mb-16">
          <h2
            className="font-black"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(34px, 5vw, 68px)",
              color: "oklch(0.97 0.02 85)",
              letterSpacing: "-0.02em",
            }}
          >
            六步驟
            <span style={{ color: "oklch(0.75 0.18 70)" }}>開啟事業</span>
          </h2>
        </Reveal>

        <div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-px max-w-5xl"
          style={{ background: "oklch(0.22 0.02 60)" }}
        >
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.06}>
              <div
                className="p-8"
                style={{ background: "oklch(0.16 0.015 60)" }}
              >
                <span
                  className="block font-black leading-none mb-4"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(44px, 6vw, 72px)",
                    color: "oklch(0.28 0.04 70)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {s.num}
                </span>
                <h3
                  className="font-bold mb-2"
                  style={{
                    fontSize: "clamp(16px, 1.8vw, 20px)",
                    color: "oklch(0.97 0.02 85)",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "oklch(0.55 0.03 70)" }}
                >
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        <Reveal className="mb-14">
          <h2
            className="font-black"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(34px, 5vw, 68px)",
              color: "oklch(0.18 0.02 60)",
              letterSpacing: "-0.02em",
            }}
          >
            常見問題
          </h2>
          <p
            className="mt-3 text-base"
            style={{ color: "oklch(0.50 0.03 60)" }}
          >
            全台 12 間門市驗證，高利潤菜單結構與完善的總部支援
          </p>
        </Reveal>

        <div className="max-w-3xl">
          <Accordion type="single" collapsible className="space-y-0">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b"
                style={{ borderColor: "oklch(0.88 0.03 85)" }}
              >
                <AccordionTrigger
                  className="text-left font-bold py-6 hover:no-underline"
                  style={{
                    fontSize: "clamp(15px, 1.6vw, 18px)",
                    color: "oklch(0.18 0.02 60)",
                  }}
                >
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent
                  className="pb-6 leading-relaxed"
                  style={{ color: "oklch(0.46 0.03 60)" }}
                >
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── 諮詢表單 ──────────────────────────────────────────── */}
      <section
        id="franchise-form"
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.18 0.02 60)" }}
      >
        <div className="max-w-4xl">
          <Reveal className="mb-14">
            <h2
              className="font-black"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(34px, 5vw, 68px)",
                color: "oklch(0.97 0.02 85)",
                letterSpacing: "-0.02em",
              }}
            >
              加盟諮詢
            </h2>
            <p
              className="mt-3 text-base"
              style={{ color: "oklch(0.55 0.03 70)" }}
            >
              填寫表單，專人將於 24 小時內與您聯繫
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
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="white"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p
                    className="font-bold"
                    style={{ color: "oklch(0.75 0.14 150)" }}
                  >
                    表單提交成功
                  </p>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: "oklch(0.60 0.10 150)" }}
                  >
                    感謝您的諮詢，我們專人將於 24 小時內與您聯繫。
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: "oklch(0.75 0.03 70)" }}
                  >
                    姓名 *
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="請輸入您的姓名"
                    required
                    className="border-0 rounded-lg"
                    style={{
                      background: "oklch(0.24 0.02 60)",
                      color: "oklch(0.92 0.01 85)",
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: "oklch(0.75 0.03 70)" }}
                  >
                    聯絡電話 *
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="請輸入您的電話"
                    required
                    className="border-0 rounded-lg"
                    style={{
                      background: "oklch(0.24 0.02 60)",
                      color: "oklch(0.92 0.01 85)",
                    }}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: "oklch(0.75 0.03 70)" }}
                  >
                    電子郵件
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="請輸入您的 Email"
                    className="border-0 rounded-lg"
                    style={{
                      background: "oklch(0.24 0.02 60)",
                      color: "oklch(0.92 0.01 85)",
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: "oklch(0.75 0.03 70)" }}
                  >
                    預計開店地區
                  </Label>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="例如：台中市西屯區"
                    className="border-0 rounded-lg"
                    style={{
                      background: "oklch(0.24 0.02 60)",
                      color: "oklch(0.92 0.01 85)",
                    }}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: "oklch(0.75 0.03 70)" }}
                  >
                    預算範圍
                  </Label>
                  <Input
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    placeholder="例如：100-150 萬"
                    className="border-0 rounded-lg"
                    style={{
                      background: "oklch(0.24 0.02 60)",
                      color: "oklch(0.92 0.01 85)",
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: "oklch(0.75 0.03 70)" }}
                  >
                    餐飲經驗
                  </Label>
                  <Input
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                    placeholder="例如：無經驗 / 3 年餐飲業"
                    className="border-0 rounded-lg"
                    style={{
                      background: "oklch(0.24 0.02 60)",
                      color: "oklch(0.92 0.01 85)",
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.75 0.03 70)" }}
                >
                  其他想了解的事項
                </Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="請描述您想了解的內容..."
                  rows={4}
                  className="border-0 rounded-lg resize-none"
                  style={{
                    background: "oklch(0.24 0.02 60)",
                    color: "oklch(0.92 0.01 85)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-full font-bold text-base transition-all duration-200 disabled:opacity-60"
                style={{
                  background: "oklch(0.75 0.18 70)",
                  color: "oklch(0.18 0.02 60)",
                  boxShadow: "0 8px 32px oklch(0.75 0.18 70 / 0.35)",
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting)
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 12px 40px oklch(0.75 0.18 70 / 0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 8px 32px oklch(0.75 0.18 70 / 0.35)";
                }}
              >
                {isSubmitting ? "送出中..." : "送出諮詢表單"}
              </button>
            </form>
          </Reveal>
        </div>
      </section>

      {/* ── 聯絡資訊 ──────────────────────────────────────────── */}
      <section
        className="py-20 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        <div className="max-w-3xl">
          <Reveal className="mb-10">
            <h3
              className="font-black"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(22px, 3vw, 36px)",
                color: "oklch(0.18 0.02 60)",
                letterSpacing: "-0.01em",
              }}
            >
              直接聯絡我們
            </h3>
          </Reveal>

          <div
            className="divide-y"
            style={{ borderColor: "oklch(0.88 0.03 85)" }}
          >
            {[
              { Icon: Phone, label: "加盟專線", value: "(04) 2437-9666" },
              { Icon: Mail, label: "電子郵件", value: "ordersome2020@gmail.com" },
              {
                Icon: MapPin,
                label: "總部地址",
                value: "台中市北屯區東山路一段 147 巷 10 弄 6 號",
              },
            ].map(({ Icon, label, value }, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div className="py-6 flex items-center gap-5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.90 0.06 80)" }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: "oklch(0.50 0.12 70)" }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-xs mb-0.5"
                      style={{ color: "oklch(0.60 0.03 70)" }}
                    >
                      {label}
                    </p>
                    <p
                      className="font-medium"
                      style={{ color: "oklch(0.18 0.02 60)" }}
                    >
                      {value}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
