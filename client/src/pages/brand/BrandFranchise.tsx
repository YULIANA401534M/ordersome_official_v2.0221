import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, MapPin, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { injectSchema } from "@/hooks/schemaUtils";
import { toast } from "sonner";

const reasons = [
  "台式早餐底子穩，韓味做出差異",
  "品牌語氣年輕，容易被記住",
  "早餐、早午餐、輕晚餐都能接",
  "店型和內容還有往上整理空間",
];

export default function BrandFranchise() {
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

  useEffect(() => {
    document.title = "來點什麼加盟 | 台韓兩味，混搭就對";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "來點什麼加盟頁，先理解品牌方向，再決定是不是適合一起做。",
    );

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [],
    };
    const cleanup = injectSchema("faq", faqSchema as Record<string, unknown>);
    return cleanup;
  }, []);

  const submitInquiry = trpc.franchise.submitInquiry.useMutation({
    onSuccess: () => {
      toast.success("收到你的加盟詢問，我們會盡快聯絡你。");
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
    },
    onError: (error) => {
      toast.error(error.message || "送出失敗，請稍後再試。");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    submitInquiry.mutate(formData);
  };

  return (
    <BrandLayout>
      <section className="px-6 pb-10 pt-6 md:pb-12 md:pt-10">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-center">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#fff1bf] px-4 py-2 text-xs font-semibold tracking-[0.2em] text-[#9d7400]">
                <Sparkles className="h-3.5 w-3.5" />
                FRANCHISE
              </p>
              <h1 className="mt-5 text-[clamp(2.7rem,6vw,5rem)] font-black tracking-[-0.06em] text-[#181512]">
                如果要加盟，
                <span className="block">先看這個品牌值不值得做</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[#675e50] md:text-lg">
                我先不講太滿，只把你真正會在意的事說清楚。品牌現在有記憶點，也還有繼續整理的空間。
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {reasons.map((item) => (
                  <div key={item} className="rounded-[24px] border border-[#ece1c7] bg-white px-5 py-4 text-sm text-[#5f5748] shadow-[0_18px_50px_-44px_rgba(91,66,18,0.25)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[34px] bg-[linear-gradient(140deg,#251f19_0%,#5d472e_38%,#f0c845_100%)] p-7 text-white shadow-[0_30px_80px_-40px_rgba(91,66,18,0.5)]">
              <p className="text-xs tracking-[0.18em] text-[#fff2bf]">快速感受</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">
                不是只賣早餐，
                <span className="block">而是賣一種會被記住的店</span>
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#fff6da]">
                你如果也想做一個看起來有年輕感、內容又不會太空的品牌，這一個方向是成立的。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-24">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
            <div className="space-y-5">
              <Card className="rounded-[30px] border border-[#ece1c7] bg-white shadow-[0_18px_50px_-44px_rgba(91,66,18,0.25)]">
                <CardContent className="p-7">
                  <h3 className="text-2xl font-black tracking-[-0.04em] text-[#181512]">適合誰</h3>
                  <div className="mt-5 space-y-3 text-sm leading-7 text-[#675e50]">
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-[#b68b05]" />
                      <span>想做早餐、早午餐，但不想看起來太傳統的人。</span>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-[#b68b05]" />
                      <span>希望品牌有記憶點，不只是把店開起來的人。</span>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-[#b68b05]" />
                      <span>願意一起把店面、菜單、社群和品牌感做得更完整的人。</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[30px] border border-[#ece1c7] bg-white shadow-[0_18px_50px_-44px_rgba(91,66,18,0.25)]">
                <CardContent className="p-7">
                  <h3 className="text-2xl font-black tracking-[-0.04em] text-[#181512]">聯絡方式</h3>
                  <div className="mt-5 space-y-3 text-sm leading-7 text-[#675e50]">
                    <div className="flex items-start gap-3">
                      <Phone className="mt-1 h-4 w-4 flex-shrink-0 text-[#b68b05]" />
                      <span>(04) 2437-9666</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-[#b68b05]" />
                      <span>台中市北屯區軍福十九路 47 號 10 樓之 3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card id="franchise-form" className="rounded-[34px] border border-[#ece1c7] bg-white shadow-[0_22px_60px_-44px_rgba(91,66,18,0.28)]">
              <CardContent className="p-7 md:p-8">
                <h2 className="text-3xl font-black tracking-[-0.05em] text-[#181512]">留下資料，我們聊聊看</h2>
                <p className="mt-3 text-sm leading-7 text-[#675e50]">
                  不用一次講得很完整，先讓我們知道你是誰、想開在哪裡，大概就夠了。
                </p>

                <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">姓名</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">電話</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">預計區域</Label>
                    <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">預算</Label>
                    <Input id="budget" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">經驗</Label>
                    <Input id="experience" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="message">想說的話</Label>
                    <Textarea id="message" rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" size="lg" className="rounded-full bg-[#181512] px-8 text-white hover:bg-[#2a241d]" disabled={isSubmitting}>
                      {isSubmitting ? "送出中..." : "送出加盟詢問"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
