import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CorporateLayout from "@/components/layout/CorporateLayout";

export default function CorporateBrands() {
  return (
    <CorporateLayout>
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">旗下品牌</h1>
          <p className="text-xl text-gray-300">宇聯國際旗下優質餐飲品牌</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Link href="/brand">
              <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group mb-8">
                <div className="grid md:grid-cols-2">
                  <div className="aspect-square md:aspect-auto bg-gradient-brand flex items-center justify-center p-12">
                    <img src="/images/brand-logo-yellow.png" alt="來點什麼" className="h-32 w-auto group-hover:scale-105 transition-transform" />
                  </div>
                  <CardContent className="p-8 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">來點什麼 ORDER SOME</h2>
                    <p className="text-gray-600 mb-4">社區型精緻平價早午餐品牌，主打台韓混搭風格，提供真材實料的美味餐點。目標客群為 18-35 歲學生及都會上班族。</p>
                    <p className="text-sm text-gray-500 mb-4">口號：「點一份期待，嚐一口未來。」</p>
                    <Button className="w-fit gap-2">前往品牌官網 <ArrowRight className="h-4 w-4" /></Button>
                  </CardContent>
                </div>
              </Card>
            </Link>

            <Card className="overflow-hidden border-0 shadow-lg opacity-60">
              <CardContent className="p-12 text-center">
                <p className="text-gray-400 text-lg mb-2">更多品牌即將推出</p>
                <p className="text-gray-400 text-sm">敬請期待</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </CorporateLayout>
  );
}
