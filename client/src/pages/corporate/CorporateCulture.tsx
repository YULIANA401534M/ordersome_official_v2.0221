import { Heart, Users, Award, TrendingUp, Shield, Zap, Star, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CorporateLayout from "@/components/layout/CorporateLayout";

export default function CorporateCulture() {
  const principles = [
    { title: "根基於誠信，成就參天事業", desc: "我們視「誠信」為最核心的價值與所有行為的基石。", icon: Award },
    { title: "珍視公司榮譽，恪盡職守", desc: "我們珍惜公司的名譽，絕不利用職務之便謀取私人利益。", icon: Shield },
    { title: "擁抱團隊合作，相互成就", desc: "我們尊重並服從團隊的指揮與分工，透過坦誠的溝通與協作達成目標。", icon: Users },
    { title: "專注本業，共創最大價值", desc: "我們全心投入於創造公司與個人的最大價值。", icon: TrendingUp },
    { title: "嚴守機密，保護共同資產", desc: "我們深知公司的業務機密與智慧財產是寶貴的共同資產。", icon: Shield },
    { title: "主動積極，擁抱挑戰", desc: "我們以正面態度迎接任務與挑戰，不畏艱難、不推諉拖延。", icon: Zap },
    { title: "展現專業，注重形象", desc: "我們理解專業的形象是贏得信任的第一步。", icon: Star },
    { title: "善始善終，負責到底", desc: "我們每日以負責的態度完成工作，確保任務告一段落。", icon: CheckCircle },
  ];

  return (
    <CorporateLayout>
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">企業文化</h1>
          <p className="text-xl text-gray-300">攜手成長，共創卓越</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">員工行動準則</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">為了實現我們共同的願景，並將公司打造成為每一位夥伴都能引以為傲、獲得成長的幸福企業</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {principles.map((item, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">我們的信念</h2>
          <div className="max-w-3xl mx-auto space-y-6 text-gray-600">
            <p className="text-lg">我們相信：不是每個人都有背景，但每個人都值得一次翻身的機會。</p>
            <p className="text-lg">而我們，就是要做那個讓努力有出口的品牌。</p>
            <p className="text-2xl font-bold text-gray-900 mt-8">做出好早餐，扶起好老闆，點燃好社區。</p>
          </div>
        </div>
      </section>
    </CorporateLayout>
  );
}
