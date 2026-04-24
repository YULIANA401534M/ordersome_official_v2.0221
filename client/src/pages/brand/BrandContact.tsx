import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function BrandContact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success("訊息已送出，我們會盡快與您聯繫！");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    },
    onError: () => {
      toast.error("送出失敗，請稍後再試");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("請填寫必填欄位");
      return;
    }
    submitMutation.mutate({ source: "brand", ...formData });
  };

  return (
    <BrandLayout>
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-20 px-6 md:px-12 lg:px-20 overflow-hidden"
        style={{ background: "oklch(0.18 0.02 60)" }}
      >
        {/* 背景大字 */}
        <div
          className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(100px, 20vw, 320px)",
              color: "oklch(0.22 0.02 60)",
              letterSpacing: "-0.04em",
            }}
          >
            HELLO
          </span>
        </div>

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5"
          >
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full"
              style={{
                background: "oklch(0.75 0.18 70)",
                color: "oklch(0.98 0.01 85)",
              }}
            >
              聯絡我們
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 44 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.12 }}
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(52px, 9vw, 110px)",
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              color: "oklch(0.97 0.02 85)",
            }}
          >
            說說你的
            <br />
            <span style={{ color: "oklch(0.75 0.18 70)" }}>想法</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.3 }}
            className="mt-6 text-base md:text-lg leading-relaxed max-w-sm"
            style={{ color: "oklch(0.62 0.03 70)" }}
          >
            有任何問題、建議，或只是想打個招呼，都歡迎聯繫我們。
          </motion.p>
        </div>
      </section>

      {/* ── 聯絡資訊 + 表單 ──────────────────────────────────── */}
      <section
        className="py-24 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 max-w-5xl">
          {/* 聯絡資訊欄 */}
          <div>
            <Reveal className="mb-10">
              <h2
                className="font-black"
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: "clamp(24px, 3vw, 38px)",
                  color: "oklch(0.18 0.02 60)",
                  letterSpacing: "-0.01em",
                }}
              >
                直接聯絡
              </h2>
            </Reveal>

            <div
              className="divide-y"
              style={{ borderColor: "oklch(0.88 0.03 85)" }}
            >
              {[
                {
                  Icon: MapPin,
                  label: "地址",
                  value: "台中市北屯區東山路一段 147 巷 10 弄 6 號",
                },
                { Icon: Phone, label: "電話", value: "(04) 2437-9666" },
                {
                  Icon: Mail,
                  label: "電子郵件",
                  value: "ordersome2020@gmail.com",
                },
              ].map(({ Icon, label, value }, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div className="py-6 flex items-start gap-5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "oklch(0.90 0.06 80)" }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: "oklch(0.50 0.12 70)" }}
                      />
                    </div>
                    <div>
                      <p
                        className="text-xs mb-1"
                        style={{ color: "oklch(0.60 0.03 70)" }}
                      >
                        {label}
                      </p>
                      <p
                        className="font-medium text-sm leading-relaxed"
                        style={{ color: "oklch(0.22 0.02 60)" }}
                      >
                        {value}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.3} className="mt-12">
              <img
                src="/images/brand-logo-yellow.png"
                alt="來點什麼"
                className="w-36 opacity-40"
              />
            </Reveal>
          </div>

          {/* 表單欄 */}
          <Reveal delay={0.1}>
            <h2
              className="font-black mb-8"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(24px, 3vw, 38px)",
                color: "oklch(0.18 0.02 60)",
                letterSpacing: "-0.01em",
              }}
            >
              留言給我們
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: "oklch(0.36 0.02 60)" }}
                  >
                    姓名 *
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="請輸入姓名"
                    required
                    className="rounded-lg"
                    style={{
                      border: "1.5px solid oklch(0.85 0.03 80)",
                      background: "oklch(0.99 0.01 85)",
                      color: "oklch(0.18 0.02 60)",
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: "oklch(0.36 0.02 60)" }}
                  >
                    電話
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="請輸入電話"
                    className="rounded-lg"
                    style={{
                      border: "1.5px solid oklch(0.85 0.03 80)",
                      background: "oklch(0.99 0.01 85)",
                      color: "oklch(0.18 0.02 60)",
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.36 0.02 60)" }}
                >
                  電子郵件 *
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="請輸入電子郵件"
                  required
                  className="rounded-lg"
                  style={{
                    border: "1.5px solid oklch(0.85 0.03 80)",
                    background: "oklch(0.99 0.01 85)",
                    color: "oklch(0.18 0.02 60)",
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.36 0.02 60)" }}
                >
                  主旨
                </Label>
                <Input
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="請輸入主旨"
                  className="rounded-lg"
                  style={{
                    border: "1.5px solid oklch(0.85 0.03 80)",
                    background: "oklch(0.99 0.01 85)",
                    color: "oklch(0.18 0.02 60)",
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.36 0.02 60)" }}
                >
                  訊息內容 *
                </Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="請輸入您的訊息"
                  rows={5}
                  required
                  className="rounded-lg resize-none"
                  style={{
                    border: "1.5px solid oklch(0.85 0.03 80)",
                    background: "oklch(0.99 0.01 85)",
                    color: "oklch(0.18 0.02 60)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full py-4 rounded-full font-bold text-base transition-all duration-200 disabled:opacity-60"
                style={{
                  background: "oklch(0.18 0.02 60)",
                  color: "oklch(0.97 0.02 85)",
                }}
                onMouseEnter={(e) => {
                  if (!submitMutation.isPending) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "oklch(0.75 0.18 70)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "oklch(0.18 0.02 60)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "oklch(0.18 0.02 60)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(0.97 0.02 85)";
                }}
              >
                {submitMutation.isPending ? "送出中..." : "送出訊息"}
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
