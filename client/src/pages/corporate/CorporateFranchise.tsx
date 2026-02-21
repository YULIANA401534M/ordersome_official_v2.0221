import { Link } from "wouter";
import { CheckCircle, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CorporateLayout from "@/components/layout/CorporateLayout";

export default function CorporateFranchise() {
  const benefits = [
    "完整的品牌形象與行銷支援",
    "中央廚房供應標準化食材",
    "專業的開店輔導與培訓",
    "數位點餐系統與營運管理工具",
    "持續的產品研發與創新",
    "區域督導定期訪店輔導",
  ];

  const steps = [
    { step: "01", title: "諮詢了解", desc: "填寫加盟諮詢表單，我們將安排專人與您聯繫" },
    { step: "02", title: "資格審核", desc: "評估您的條件與開店地點，確認合作可能性" },
    { step: "03", title: "簽約培訓", desc: "簽訂加盟合約，參加總部完整培訓課程" },
    { step: "04", title: "開店籌備", desc: "協助選址、裝潢、設備採購與人員招募" },
    { step: "05", title: "正式開幕", desc: "總部派員駐店輔導，確保順利開幕營運" },
  ];

  return (
    <CorporateLayout>
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">加盟資訊</h1>
          <p className="text-xl text-gray-300">與宇聯國際攜手，共創餐飲事業</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">為什麼選擇來點什麼？</h2>
              <p className="text-gray-600 mb-8">我們提供完善的加盟體系，讓您的創業之路更加順利。從選址、裝潢、培訓到開幕，全程專業團隊陪伴支持。</p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-brand rounded-2xl p-8 flex items-center justify-center">
              <img src="/images/brand-logo-yellow.png" alt="來點什麼" className="h-32 w-auto" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">加盟流程</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((item, index) => (
              <Card key={index} className="border-0 shadow-md text-center">
                <CardContent className="p-6">
                  <div className="text-4xl font-black text-amber-600 mb-4">{item.step}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">立即諮詢</h2>
            <p className="text-gray-600 mb-8">有興趣加盟來點什麼？歡迎與我們聯繫，了解更多加盟細節。</p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center gap-3">
                <Phone className="h-5 w-5 text-amber-600" />
                <span>(04) 2437-9666</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Mail className="h-5 w-5 text-amber-600" />
                <span>ordersome2020@gmail.com</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <MapPin className="h-5 w-5 text-amber-600" />
                <span>台中市北屯區東山路一段147巷10弄6號</span>
              </div>
            </div>
            <Link href="/corporate/contact">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700">填寫諮詢表單</Button>
            </Link>
          </div>
        </div>
      </section>
    </CorporateLayout>
  );
}
