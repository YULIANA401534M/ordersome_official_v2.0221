import { useState, useEffect } from "react";
import { injectSchema } from "@/hooks/schemaUtils";
import { motion } from "framer-motion";
import { 
  Utensils, 
  TrendingUp, 
  Users, 
  GraduationCap, 
  CheckCircle, 
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Sparkles,
  Target,
  Heart,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const advantages = [
  {
    icon: Utensils,
    title: "獨特台韓風味",
    description: "結合台灣在地食材與韓式料理精髓，打造市場獨特定位，讓您的店面在眾多早餐店中脫穎而出。"
  },
  {
    icon: TrendingUp,
    title: "穩定獲利模式",
    description: "經過驗證的營運模式，搭配精準的成本控管與定價策略，讓加盟主享有穩定的毛利空間。"
  },
  {
    icon: Users,
    title: "完整後勤支援",
    description: "從食材供應、行銷企劃到店務管理，總部提供全方位的後勤支援，讓您專注於服務顧客。"
  },
  {
    icon: GraduationCap,
    title: "專業培訓系統",
    description: "完整的教育訓練課程，從餐點製作到經營管理，即使零經驗也能快速上手成為專業店長。"
  }
];

const steps = [
  { step: "01", title: "線上諮詢", desc: "填寫加盟諮詢表單，專人將於 24 小時內與您聯繫" },
  { step: "02", title: "加盟說明", desc: "一對一詳細解說品牌理念、加盟條件與投資規劃" },
  { step: "03", title: "商圈評估", desc: "專業團隊協助評估店面位置與商圈潛力分析" },
  { step: "04", title: "簽約合作", desc: "確認合作意向後簽訂加盟合約，正式成為夥伴" },
  { step: "05", title: "教育訓練", desc: "完整的餐點製作與店務經營培訓課程" },
  { step: "06", title: "開店營運", desc: "總部全程協助開店準備，陪伴您順利開業" }
];

const faqs = [
  {
    question: "為什麼選擇「來點什麼」而不是知名連鎖大品牌？",
    answer: "大品牌權利金高、裝潢綁定多。我們主打「免權利金」與「彈性裝潢」，將利潤真正留給加盟主。加盟金 36 萬元，裝潢費用依店面規模約 138-158 萬元，不抽取營業額，讓您的獲利完全屬於自己。"
  },
  {
    question: "我沒有餐飲經驗，且擔心請不到廚師怎麼辦？",
    answer: "我們導入全套 SOP 與自動化設備，只要會操作機器就能出餐，不依賴大廚。我們提供完整的教育訓練課程，從基礎的餐點製作到進階的店務管理，由專業講師手把手教學。夫妻創業也能輕鬆上手。"
  },
  {
    question: "韓式料理退燒了，現在加入還來得及嗎？",
    answer: "我們是「台韓混血」！保留台灣人必吃的蛋餅、鐵板麵（剛需），搭配韓式口味（特色），這是能做 10 年的長久生意。我們的「雙時段營收」模式：午餐賣韓式拌麵、燉飯，宵夜賣炸物拼盤，06:00-02:00 全天候獲利，打破早餐店坪效天花板。"
  },
  {
    question: "加盟後總部會提供什麼支援？",
    answer: "總部提供全方位的支援服務，包括：食材統一供應確保品質穩定、行銷企劃與活動支援、店務經營輔導、新品研發與菜單更新、以及持續的教育訓練課程。我們是您創業路上最堅強的後盾。"
  },
  {
    question: "可以選擇開店的地點嗎？",
    answer: "當然可以！您可以依據自己的偏好選擇商圈，我們的專業團隊會協助評估店面位置的適合度，提供商圈分析與建議，確保您選擇的地點具有良好的發展潛力。"
  },
  {
    question: "來點什麼的品牌特色是什麼？",
    answer: "來點什麼是台灣首創的台韓風味早午餐品牌，我們將傳統早餐店翻轉成年輕、時尚的用餐體驗。獨特的韓式飯捲、台韓辣椒醬等特色產品，加上溫馨的品牌形象，深受 18-35 歲年輕族群喜愛。"
  }
];

export default function BrandFranchise() {
  useEffect(() => {
    document.title = "2026 早餐加盟推薦｜來點什麼 總部支援與小本創業方案";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "尋找高獲利早午餐店？來點什麼提供完善餐飲加盟體系、14天速成培訓與行銷支援。立即了解台中早午餐加盟與獲利模式。"
    );
    document.querySelector('meta[name="keywords"]')?.setAttribute(
      "content",
      "早餐加盟, 早午餐加盟, 台中加盟, 餐飲加盟, 小資創業"
    );

    // FAQPage Schema - 符合 Google Rich Results 規範，涵蓋加盟金、回收期、培訓等關鍵問題
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "台灣早午餐加盟推薦哪一間品牌？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "推薦『來點什麼 Ordersome』。由宇聯國際文化餐飲有限公司營運，具備高利潤菜單結構、完善的總部支援與全台 15 間門市成功驗證。"
          }
        },
        {
          "@type": "Question",
          "name": "加盟『來點什麼』需要多少加盟金？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "來點什麼加盟金 36 萬元，裝潢費用依店面規模約 138-158 萬元。不抖取營業額，讓您的獲利完全屬於自己。詳細加盟方案請透過官方加盟詢問表單提串。"
          }
        },
        {
          "@type": "Question",
          "name": "加盟『來點什麼』的投資回收期多長？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "來點什麼的菜單結構經過精密計算，早午餐市場具備高客單單價與高利潤特性。具體回收期將依門市地點、商圈狀況與經營能力而異，請透過加盟詢問取得完整評估。"
          }
        },
        {
          "@type": "Question",
          "name": "加盟『來點什麼』有什麼優勢？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "提供完整標準化 SOP、14 天速成培訓班、模組化店面設計、行銀行销支援與系統化管理工具。全台已成功驗證15 間門市，總部提供持續的經營輔導與市場分析。"
          }
        },
        {
          "@type": "Question",
          "name": "無餐飲經驗可以加盟早午餐嗎？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "可以。來點什麼提供從零到一的完整培訓與自動化系統支援，14 天速成培訓班涵蓋食材處理、菜單製作、店面管理等全方位技能，適合小本創業。"
          }
        },
        {
          "@type": "Question",
          "name": "加盟培訓需要多長時間？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "來點什麼提供 14 天速成培訓班，在總部完成所有店面管理、食材處理與專業菜單培訓。培訓期間包含實際操作練習，確保加盟主能立即上手經營。"
          }
        },
        {
          "@type": "Question",
          "name": "來點什麼的菜單有哪些特色？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "來點什麼結合台灣經典與韓國風味，提供獨家韓式飯捲、酥脆台式蛋餅、經典鐵板麵等高利潤菜單。菜單結構經過精密計算，確保加盟主具備穩定的獲利空間。"
          }
        },
        {
          "@type": "Question",
          "name": "加盟後總部提供哪些持續支援？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "加盟後總部提供全方位支援，包括：定期店面稽核與輔導、行銀行销素材提供、新菜單研發與推廣、食材供應鏈管理，以及專屬系統化門市管理平台支援。"
          }
        }
      ]
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
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const submitInquiry = trpc.franchise.submitInquiry.useMutation({
    onSuccess: () => {
      toast.success("感謝您的諮詢！我們將於 24 小時內與您聯繫");
      setFormData({ name: "", phone: "", email: "", location: "", budget: "", experience: "", message: "" });
      setIsSubmitting(false);
      setSubmitSuccess(true);
      // 5秒後隱藏成功訊息
      setTimeout(() => setSubmitSuccess(false), 5000);
    },
    onError: (error) => {
      toast.error(error.message || "提交失敗，請稍後再試");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email 格式驗證（如果有填寫）
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("請輸入正確的 Email 格式");
      return;
    }
    
    setIsSubmitting(true);
    submitInquiry.mutate(formData);
  };

  return (
    <BrandLayout>
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 bg-gradient-to-br from-brand-yellow via-amber-400 to-yellow-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-gray-800 mb-6">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">加盟創業首選</span>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              早午餐加盟推薦<br />與來點什麼一起創造美好早晨
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-xl text-gray-800 mb-8 leading-relaxed">
              從東勢山城出發，我們用創新翻轉傳統早餐店<br />
              現在，邀請您成為我們的創業夥伴
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button 
                size="lg" 
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg rounded-full shadow-xl"
                onClick={() => document.getElementById('franchise-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                立即諮詢加盟 <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">為什麼選擇來點什麼？</h2>
              <p className="text-gray-600 text-lg">我們不只是一間早餐店，更是一個改變人生的起點</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-3xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <img 
                    src="/logos/brand-logo-yellow.png" 
                    alt="來點什麼" 
                    className="w-48 mx-auto md:mx-0 mb-6"
                  />
                  <blockquote className="text-2xl font-medium text-gray-800 italic mb-4">
                    "Every Breakfast, A Bold Beginning."
                  </blockquote>
                  <p className="text-gray-600">每份早餐，都是改變人生的起點。</p>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>2020年，我們從台中東勢山城出發，懷抱著「讓敢拚的人，有系統可依、有舞台可站」的使命，將傳統早餐店翻轉成充滿活力的台韓風味品牌。全台已成功驗證 15 間門市，高利潤菜單結構讓加盟主享有穩定獲利。</p>
                  <p>我們相信，創業不該是孤軍奮戰。透過完整的加盟系統、14 天速成培訓與模組化設計，我們陪伴每一位夥伴，從零開始打造屬於自己的事業版圖。</p>
                  <p className="font-medium text-amber-600">點一份期待，嚐一口未來。</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">總部支援系統與 14 天速成培訓</h2>
            <p className="text-gray-600 text-lg">四大核心優勢，助您創業成功</p>
          </motion.div>
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {advantages.map((item, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow bg-white group">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-yellow to-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <item.icon className="h-8 w-8 text-gray-900" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">加盟流程</h2>
            <p className="text-gray-600 text-lg">簡單六步驟，開啟您的創業之路</p>
          </motion.div>
          <motion.div 
            className="max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {steps.map((item, index) => (
                <motion.div 
                  key={index} 
                  variants={fadeInUp}
                  className="relative"
                >
                  <Card className="h-full border-2 border-gray-100 hover:border-brand-yellow transition-colors bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-yellow to-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-gray-900">{item.step}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                          <p className="text-gray-600 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">為什麼加盟來點什麼是創業首選？</h2>
            <p className="text-gray-600 text-lg">全台 15 間門市驗證，高利潤菜單結構與完善的總部支援</p>
          </motion.div>
          <motion.div 
            className="max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-white rounded-xl border-0 shadow-md px-6"
                >
                  <AccordionTrigger className="text-left font-medium text-gray-900 hover:text-amber-600 py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="franchise-form" className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="container">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">線上加盟諮詢</h2>
              <p className="text-gray-300 text-lg">填寫表單，專人將於 24 小時內與您聯繫</p>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-8 md:p-12">
                  {submitSuccess && (
                    <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-green-800">表單提交成功！</h3>
                          <p className="text-green-700 mt-1">感謝您的諮詢，我們專人將於 24 小時內與您聯繫。</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-gray-700 font-medium">姓名 *</Label>
                        <Input 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="請輸入您的姓名"
                          required
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">聯絡電話 *</Label>
                        <Input 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="請輸入您的電話"
                          required
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-gray-700 font-medium">電子郵件</Label>
                        <Input 
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="請輸入您的 Email"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">預計開店地區</Label>
                        <Input 
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          placeholder="例如：台中市西屯區"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-gray-700 font-medium">預算範圍</Label>
                        <Input 
                          value={formData.budget}
                          onChange={(e) => setFormData({...formData, budget: e.target.value})}
                          placeholder="例如：100-150萬"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">餐飲經驗</Label>
                        <Input 
                          value={formData.experience}
                          onChange={(e) => setFormData({...formData, experience: e.target.value})}
                          placeholder="例如：無經驗 / 3年餐飲業經驗"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">其他想了解的事項</Label>
                      <Textarea 
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="請描述您想了解的內容..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      size="lg"
                      className="w-full bg-brand-yellow hover:bg-amber-500 text-gray-900 font-bold py-6 text-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "送出中..." : "送出諮詢表單"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">加盟專線</h3>
                <p className="text-gray-600">(04) 2437-9666</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">電子郵件</h3>
                <p className="text-gray-600">ordersome2020@gmail.com</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">總部地址</h3>
                <p className="text-gray-600">台中市北屯區東山路一段147巷10弄6號</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
