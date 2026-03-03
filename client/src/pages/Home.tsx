import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Utensils, Store, Calendar, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { injectSchema } from "@/hooks/schemaUtils";
import LogoIntro from "@/components/LogoIntro";
import CountUpNumber from "@/components/CountUpNumber";

export default function Home() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    document.title = "來點什麼 Ordersome｜台中早午餐加盟首選、高人氣台韓式早餐";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "來點什麼 (Ordersome) 結合台灣經典與韓國風味，提供高利潤人氣美食。全台 15 間門市，大台中早午餐加盟、小資餐飲創業最佳推薦品牌。"
    );
    document.querySelector('meta[name="keywords"]')?.setAttribute(
      "content",
      "台中早午餐加盟, 早餐加盟, 台中美食, 台中韓式早午餐, 來點什麼, Ordersome"
    );

    // Organization Schema
    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "來點什麼 Ordersome",
      "alternateName": "Ordersome",
      "url": "https://ordersome.com.tw",
      "logo": "https://ordersome.com.tw/logo.png",
      "description": "台中台韓式早午餐品牌，提供韓式飯捲、台式蛋餅、鐵板麵等美味餐點",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "台中市",
        "addressRegion": "台中市",
        "addressCountry": "TW"
      },
      "sameAs": [
        "https://www.facebook.com/ordersome"
      ]
    };
    const cleanup = injectSchema("organization", schema);
    return cleanup;
  }, []);


  return (
    <>
      <LogoIntro onComplete={() => setShowContent(true)} />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-yellow-200/30 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10 py-20">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 
              className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-6"
              style={{ fontFamily: "'JF-Kamabit', sans-serif", letterSpacing: "0.15em" }}
            >
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500">
                宇聯國際
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              宇聯國際文化餐飲有限公司，致力於打造優質餐飲品牌，
              <br className="hidden md:block" />
              為顧客帶來美好的用餐體驗
            </p>
          </motion.div>

          {/* Two Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Brand Card - 來點什麼 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/brand">
                <div className="group relative bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  {/* Yellow accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 to-amber-400" />
                  
                  <div className="p-8 md:p-10">
                    <div className="flex items-center justify-between mb-6">
                      <img
                        src="/logos/brand-logo-yellow.png"
                        alt="來點什麼"
                        className="h-20 w-auto"
                      />
                      <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                        <Utensils className="h-7 w-7 text-yellow-600" />
                      </div>
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                      來點什麼
                    </h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      ORDER SOME - 台韓風味早午餐品牌<br />
                      用心製作每一份餐點，為您帶來美好的一天開始
                    </p>
                    
                    <div className="flex items-center text-yellow-600 font-semibold group-hover:text-yellow-700">
                      <span>探索品牌</span>
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Corporate Card - 宇聯國際 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link href="/corporate">
                <div className="group relative bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  {/* Gold accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-gray-800 to-amber-600" />
                  
                  <div className="p-8 md:p-10">
                    <div className="flex items-center justify-between mb-6">
                      <img
                        src="/logos/corporate-logo.png"
                        alt="宇聯國際"
                        className="h-16 w-auto"
                      />
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <Building2 className="h-7 w-7 text-gray-700" />
                      </div>
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                      宇聯國際
                    </h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      宇聯國際文化餐飲有限公司<br />
                      集團總部 · 企業資訊 · 線上商城、加盟主專區
                    </p>
                    
                    <div className="flex items-center text-gray-700 font-semibold group-hover:text-gray-900">
                      <span>進入官網</span>
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <p className="text-gray-500 mb-4">快速前往</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/shop">線上商城</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/brand/franchise">加盟諮詢</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/brand/stores">門市據點</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              用數字說話
            </h2>
            <p className="text-gray-600 text-lg">
              宇聯國際的成長軌跡
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            <CountUpNumber
              end={12}
              suffix="+"
              label="門市據點"
              icon={<Store className="h-8 w-8 text-white" />}
            />
            <CountUpNumber
              end={5}
              suffix="+"
              label="服務年數"
              icon={<Calendar className="h-8 w-8 text-white" />}
            />
            <CountUpNumber
              end={1200000}
              suffix="+"
              label="服務顧客"
              icon={<Users className="h-8 w-8 text-white" />}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} 宇聯國際文化餐飲有限公司. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}
