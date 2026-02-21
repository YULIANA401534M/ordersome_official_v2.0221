import { Building2, Target, Heart, Users, Award, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CorporateLayout from "@/components/layout/CorporateLayout";

export default function CorporateAbout() {
  return (
    <CorporateLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">關於宇聯國際</h1>
            <p className="text-xl text-gray-300">
              以創新思維與專業服務，打造優質餐飲品牌
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">企業故事</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  宇聯國際文化餐飲有限公司成立於 2020 年，由一群充滿熱情的年輕創業家所創立。
                  我們從台中東勢山城出發，秉持著「推廣自己愛吃的東西」的初心，
                  將長輩經營二十一年的傳統早餐店，翻轉成全新的街頭台韓品牌。
                </p>
                <p>
                  疫情間開展品牌並沒有澆熄這份熱血，反而讓我們更確定早餐不只是果腹，
                  而是一種讓人重新出發的力量。我們拆掉老舊裝潢、重新設計動線，
                  引進中央廚房與數位點餐系統；但是我們沒有拆掉的是「誠信、熱忱、創新」這三顆螺絲。
                </p>
                <p>
                  短短數年間，我們從 1 家偏遠山區的門市成長至 10 多家直營門市與加盟門市，
                  靠的不是行銷話術，而是一份份真材實料的早餐，
                  和一句句「早安，今天來點什麼？」的親切問候。
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <img
                  src="/images/corporate-logo.png"
                  alt="宇聯國際 YULIAN"
                  className="w-64 h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-2 bg-amber-500" />
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">企業願景</h3>
                </div>
                <p className="text-lg font-medium text-amber-600 mb-4">
                  「Every Breakfast, A Bold Beginning.」
                </p>
                <p className="text-gray-600 leading-relaxed">
                  每份早餐，都是改變人生的起點。我們的願景，是在 2030 年前，
                  成為中部地區最具影響力的連鎖早午餐品牌。我們要打造的不只是「好吃」的店，
                  而是讓人從小吃到大、從學生吃到上班、出社會後還會想回來回味的品牌。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-2 bg-gray-800" />
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-gray-800" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">企業使命</h3>
                </div>
                <p className="text-lg font-medium text-gray-800 mb-4">
                  「Made for Makers. 讓敢拚的人，有系統可依、有舞台可站。」
                </p>
                <p className="text-gray-600 leading-relaxed">
                  打造一個來自街頭、長在地方、做得起來、也帶得出去的連鎖早餐品牌。
                  在一個連鎖都靠資本、開店都看背景的時代，我們選擇走不一樣的路：
                  用制度，而不是靠運氣；靠執行，而不是靠血統。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">核心價值觀</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              我們的共同承諾：攜手成長，共創卓越
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                title: "手心向下",
                desc: "主動付出，樂於助人，因為我們知道幫助別人成功，就是成就自己。",
                icon: Heart,
              },
              {
                title: "誠信為先",
                desc: "說到做到，對食材、對顧客、對夥伴都不欺不瞞。",
                icon: Award,
              },
              {
                title: "態度制勝",
                desc: "學歷、經歷都不設限，關鍵在於學習的姿態與執行的速度。",
                icon: TrendingUp,
              },
              {
                title: "制度即保護",
                desc: "標準化流程不是束縛，而是讓每個人都能站在同一起跑線。",
                icon: Building2,
              },
              {
                title: "共好共榮",
                desc: "我們的成功建立在彼此的成就，凝聚成一個向上的生態系。",
                icon: Users,
              },
            ].map((value, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-7 w-7 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">經營團隊</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              專業的經營團隊，帶領宇聯國際持續成長
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Leo", title: "董事長 / 創辦人" },
              { name: "Dennis", title: "董事 / 法律顧問" },
              { name: "Peggy", title: "共同創辦人 / 營運長" },
              { name: "Joseph", title: "來點什麼 / 品牌總監" },
            ].map((person, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-bold text-gray-900">{person.name}</h3>
                  <p className="text-sm text-gray-600">{person.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Slogan */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-center">
        <div className="container">
          <p className="text-2xl md:text-3xl font-bold mb-4">
            做出好早餐，扶起好老闆，點燃好社區。
          </p>
          <p className="text-gray-400">
            一間店，就是一個人的未來。一份餐，就是一次改變的起點。
          </p>
        </div>
      </section>
    </CorporateLayout>
  );
}
