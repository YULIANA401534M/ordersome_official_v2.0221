import { Link } from "wouter";
import { ArrowRight, MapPin, Clock, Star, Sparkles, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";

// 餐點照片數據
const foodImages = [
  { src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/VjlyUhcBYLeXUEcB.jpg", name: "慶尚道辣炒豬", description: "韓式風味，香辣過爆" },
  { src: "/images/food/tuna-onigiri.jpg", name: "手作鮪魚三角飯糰", description: "新鮮手作，滿滿鮪魚" },
  { src: "/images/food/korean-tuna-bento.jpg", name: "韓式鮪魚搖搖便當", description: "搖一搖，美味更均勻" },
  { src: "/images/food/seaweed-roll.jpg", name: "海苔肉鬆飯捲", description: "經典台式風味" },
  { src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/CApeTRjJBNflTLdV.jpg", name: "混醬厚片", description: "厚實口感，雙重享受" },
  { src: "/images/food/peanut-bacon-toast.jpg", name: "溶岩花生培根吐司", description: "香濃花生醬配脆培根" },
];

export default function BrandHome() {
  const { data: stores } = trpc.store.list.useQuery();
  const { data: newsItems } = trpc.news.list.useQuery({ category: "brand" });

  return (
    <BrandLayout>
      {/* Hero Section - 大面積色塊設計 */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-gray-900 via-gray-800 to-amber-900 overflow-hidden">
        {/* 背景裝飾 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-3xl" />
        </div>

        {/* 大字背景 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden">
          <div className="text-[20rem] font-black text-white whitespace-nowrap" aria-hidden="true">
            ORDER
          </div>
        </div>
        
        <div className="container relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* 左側文字區 - 使用 JF Kamabit 大字 */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm text-amber-300 px-6 py-3 rounded-full text-sm font-medium border border-amber-500/30">
                <Star className="h-4 w-4" />
                台灣優質連鎖餐飲品牌
              </div>
              
              {/* 超大標題 - JF Kamabit 字體 */}
              <div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight text-white mb-4">
                  來點什麼 (Ordersome) - 
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 mt-2" style={{fontSize: '64px'}}>
                    台中早午餐加盟首選
                  </span>
                </h1>
                <p className="text-2xl md:text-3xl font-bold text-amber-300 tracking-wide">
                  台韓混血．雙時段營收．深夜食堂
                </p>
              </div>
              
              <p className="text-xl text-gray-300 max-w-lg leading-relaxed" style={{fontSize: '18px'}}>
                不僅是早餐店，更是您的全時段獲利夥伴。
                <br />
                從韓式吐司到鐵板麵，06:00 - 02:00 全天候滿足台灣人的胃。
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/brand/franchise">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold text-lg px-8 py-6 rounded-full gap-2 shadow-2xl shadow-amber-500/50">
                    查看加盟方案 (免權利金) <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/brand/stores">
                  <Button size="lg" className="bg-white/15 border border-white/40 text-white hover:bg-white hover:text-gray-900 font-bold text-lg px-8 py-6 rounded-full gap-2 backdrop-blur-sm">
                    <MapPin className="h-5 w-5" /> 門市據點
                  </Button>
                </Link>
              </div>
            </motion.div>
            
            {/* 右側圖片區 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <img
                  src="/logos/brand-logo-yellow.png"
                  alt="來點什麼"
                  className="w-full max-w-lg mx-auto drop-shadow-2xl animate-float"
                />
              </div>
              {/* 光暈效果 */}
              <div className="absolute inset-0 bg-amber-500/30 blur-3xl rounded-full scale-75" />
            </motion.div>
          </div>
        </div>

        {/* 底部波浪分隔 */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* 特色區塊 - 大色塊設計 */}
      <section className="py-24 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              加盟優勢
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-400">
                三大核心競爭力
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              打造全時段獲利模式，讓您的投資回報最大化
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* 特色卡片 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 overflow-hidden group">
                <div className="h-2 bg-gradient-to-r from-amber-400 to-yellow-500" />
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    台韓混血 (Fusion Flavor)
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    獨家結合韓式辣醬與台式蛋餅，打造 Isaac 與傳統早餐店之外的第三選擇。
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* 特色卡片 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 overflow-hidden group">
                <div className="h-2 bg-gradient-to-r from-amber-400 to-yellow-500" />
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    雙時段獲利 (Dual Revenue)
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    午餐賣韓式飯捲、搖搖便當，宵夜賣粉漿蛋餅、台式炸物。打破早餐店坪效天花板。
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* 特色卡片 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 overflow-hidden group">
                <div className="h-2 bg-gradient-to-r from-amber-400 to-yellow-500" />
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    智能 SOP (Smart Operations)
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    免大廚、免經驗。標準化出餐流程，夫妻創業也能輕鬆上手。
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 菜單預覽區 - 深色大色塊 + 真實餐點照片 */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        {/* 背景裝飾 */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              精選
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                美味
              </span>
              菜單
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              台韓風味完美融合，每一口都是驚喜
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {foodImages.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="border-0 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden group">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={item.src}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {item.name}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link href="/brand/menu">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold text-lg px-10 py-6 rounded-full gap-2 shadow-2xl shadow-amber-500/50">
                查看完整菜單 <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 門市環境展示區 - 新增區塊 */}
      <section className="py-24 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              舒適
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-400">
                用餐
              </span>
              環境
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              溫馨明亮的空間，讓您享受美好的用餐時光
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3, 4, 5, 6].map((num, index) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative overflow-hidden rounded-3xl shadow-2xl group cursor-pointer"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={`/images/stores/store-${num}.jpg`}
                    alt={`門市環境 ${num}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 門市據點區 */}
      <section className="py-24 bg-amber-50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              全台
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-400">
                門市
              </span>
              據點
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {stores?.length || 0} 間門市為您服務
            </p>
          </motion.div>

          {stores && stores.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {stores.slice(0, 6).map((store, index) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {store.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {store.address}
                          </p>
                          {store.phone && (
                            <p className="text-sm text-gray-500">
                              {store.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">門市資訊即將更新</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link href="/brand/stores">
              <Button size="lg" variant="outline" className="border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white font-bold text-lg px-10 py-6 rounded-full gap-2">
                查看所有門市 <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA 區塊 - 大色塊 */}
      <section className="py-32 bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 relative overflow-hidden">
        {/* 背景圖案 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-6xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
              準備好
              <span className="block">開始您的美食之旅了嗎？</span>
            </h2>
            <p className="text-2xl text-gray-800 mb-12 font-medium">
              立即前往最近的門市，體驗來點什麼的美味
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/brand/stores">
                <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xl px-12 py-8 rounded-full gap-3 shadow-2xl">
                  <MapPin className="h-6 w-6" />
                  尋找門市
                </Button>
              </Link>
              <Link href="/brand/franchise">
                <Button size="lg" variant="outline" className="border-4 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-bold text-xl px-12 py-8 rounded-full gap-3">
                  加盟諮詢 <ArrowRight className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 最新消息區 */}
      {newsItems && newsItems.length > 0 && (
        <section className="py-24 bg-white">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                最新
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-400">
                  消息
                </span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newsItems.slice(0, 3).map((news, index) => (
                <motion.div
                  key={news.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                    {news.imageUrl && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={news.imageUrl}
                          alt={news.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="text-sm text-amber-600 font-medium mb-2">
                        {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString('zh-TW') : ''}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {news.title}
                      </h3>
                      <p className="text-gray-600 line-clamp-3">
                        {news.content}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mt-12"
            >
              <Link href="/brand/news">
                <Button size="lg" variant="outline" className="border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white font-bold text-lg px-10 py-6 rounded-full gap-2">
                  查看更多消息 <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </BrandLayout>
  );
}
