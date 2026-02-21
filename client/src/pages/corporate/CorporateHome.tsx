import { Link, useLocation } from "wouter";
import { ArrowRight, Building2, Users, TrendingUp, Award, MapPin, Handshake, Newspaper, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";

export default function CorporateHome() {
  const [, setLocation] = useLocation();
  const { data: newsItems } = trpc.content.getPublishedPosts.useQuery({ publishTarget: "corporate" });
  const { data: products } = trpc.product.list.useQuery();

  return (
    <CorporateLayout>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
                宇聯國際
                <span className="block text-amber-500">文化餐飲有限公司</span>
                <span className="block text-2xl md:text-3xl text-gray-400 mt-4 font-normal tracking-wide">YULIAN International Cultural Catering Co., Ltd.</span>
              </h1>
              
              <p className="text-lg text-gray-300 max-w-lg">
                以創新思維與專業服務，打造優質餐飲品牌。
                我們秉持著對品質的堅持，持續拓展多元化的餐飲版圖，
                為消費者帶來美好的餐飲體驗。
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/corporate/about">
                  <Button size="lg" className="bg-amber-600 hover:bg-amber-700 gap-2">
                    了解更多 <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    線上商城
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative w-[600px] h-[500px] flex items-center justify-center">
                {/* 白色背景光暈 - 加強對比度 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-gray-100/30 to-white/20 blur-3xl" />
                <div className="absolute inset-0 bg-gradient-to-tl from-white/30 via-gray-50/20 to-transparent blur-2xl" />
                <div className="absolute inset-0 bg-white/10 rounded-full blur-[100px]" />
                
                {/* 宇聯 LOGO 中英文完整版 */}
                <img
                  src="/images/corporate-logo-full.png"
                  alt="宇聯國際 YULIAN"
                  className="relative z-10 w-[550px] h-auto"
                  style={{ 
                    filter: 'drop-shadow(0 0 80px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.6)) drop-shadow(0 20px 60px rgba(0, 0, 0, 0.4)) brightness(1.15) contrast(1.2)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-12 bg-gray-50 border-b border-gray-200">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/corporate/brands">
              <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 border-0">
                <CardContent className="p-6 text-center">
                  <Building2 className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 text-sm">旗下品牌</h3>
                  <p className="text-xs text-gray-500 mt-1">品牌介紹</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/corporate/stores">
              <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 border-0">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 text-sm">門市據點</h3>
                  <p className="text-xs text-gray-500 mt-1">全台門市</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/corporate/franchise">
              <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 border-0">
                <CardContent className="p-6 text-center">
                  <Handshake className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 text-sm">加盟資訊</h3>
                  <p className="text-xs text-gray-500 mt-1">創業夥伴</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/corporate/news">
              <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 border-0">
                <CardContent className="p-6 text-center">
                  <Newspaper className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 text-sm">新聞中心</h3>
                  <p className="text-xs text-gray-500 mt-1">最新消息</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/shop">
              <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 border-0">
                <CardContent className="p-6 text-center">
                  <ShoppingBag className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 text-sm">線上商城</h3>
                  <p className="text-xs text-gray-500 mt-1">立即選購</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-black text-amber-600">5+</p>
              <p className="text-gray-600 mt-2">直營門市</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-black text-amber-600">10+</p>
              <p className="text-gray-600 mt-2">加盟門市</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-black text-amber-600">50+</p>
              <p className="text-gray-600 mt-2">專業團隊</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-black text-amber-600">2020</p>
              <p className="text-gray-600 mt-2">創立年份</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                關於宇聯國際
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                宇聯國際文化餐飲有限公司成立於 2020 年，由一群充滿熱情的年輕創業家所創立。
                我們從台中東勢山城出發，秉持著「推廣自己愛吃的東西」的初心，
                將傳統早餐店翻轉成全新的街頭台韓品牌。
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                我們相信，每一份餐點都是改變人生的起點。透過嚴格的品質控管、
                創新的產品研發，以及完善的加盟體系，我們致力於打造一個
                讓人從小吃到大、從學生吃到上班的品牌。
              </p>
              <Link href="/corporate/about">
                <Button variant="outline" className="gap-2">
                  了解更多 <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Building2 className="h-10 w-10 text-amber-600 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900">專業經營</h3>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Users className="h-10 w-10 text-amber-600 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900">團隊合作</h3>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-10 w-10 text-amber-600 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900">持續成長</h3>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Award className="h-10 w-10 text-amber-600 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900">品質保證</h3>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              旗下品牌
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              宇聯國際旗下擁有多個優質餐飲品牌，滿足不同消費者的需求
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/brand">
              <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                <div className="aspect-video bg-gradient-brand flex items-center justify-center">
                  <img
                    src="/images/brand-logo-yellow.png"
                    alt="來點什麼"
                    className="h-24 w-auto group-hover:scale-105 transition-transform"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">來點什麼 ORDER SOME</h3>
                  <p className="text-gray-600 text-sm">
                    社區型精緻平價早午餐品牌，主打台韓混搭風格，提供真材實料的美味餐點。
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Card className="overflow-hidden border-0 shadow-lg opacity-60">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400 text-lg">更多品牌即將推出</p>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-400 mb-2">敬請期待</h3>
                <p className="text-gray-400 text-sm">
                  我們正在籌備更多優質餐飲品牌，敬請期待。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Products Preview */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                線上商城
              </h2>
              <p className="text-gray-600">精選商品，品質保證</p>
            </div>
            <Link href="/shop">
              <Button className="bg-amber-600 hover:bg-amber-700 gap-2">
                前往商城 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products?.slice(0, 4).map((product) => (
              <Link key={product.id} href={`/shop/product/${product.id}`}>
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-square bg-gray-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src="/images/corporate-logo.png"
                          alt="宇聯國際"
                          className="w-20 h-20 opacity-20"
                        />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-amber-600 font-bold">NT$ {product.price}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            
            {(!products || products.length === 0) && (
              <>
                <Link href="/shop">
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-square bg-gray-100">
                      <img
                        src="/images/products/chili-sauce-1.jpg"
                        alt="台韓辣椒醬"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1">台韓辣椒醬（單瓶）</h3>
                      <p className="text-amber-600 font-bold">NT$ 239</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/shop">
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-square bg-gray-100">
                      <img
                        src="/images/products/chili-sauce-2.jpg"
                        alt="台韓辣椒醬兩入組"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1">台韓辣椒醬（兩入組）</h3>
                      <p className="text-amber-600 font-bold">NT$ 398</p>
                    </CardContent>
                  </Card>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* News Preview */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                新聞中心
              </h2>
              <p className="text-gray-600">掌握宇聯國際的最新動態</p>
            </div>
            <Link href="/corporate/news">
              <Button variant="outline" className="gap-2">
                查看所有新聞 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {newsItems?.slice(0, 3).map((news) => (
              <Card 
                key={news.id} 
                className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/corporate/news/${news.slug}`)}
              >
                <div className="aspect-video bg-gray-100">
                  {news.coverImage ? (
                    <img
                      src={news.coverImage}
                      alt={news.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src="/images/corporate-logo.png"
                        alt="宇聯國際"
                        className="w-16 h-16 opacity-20"
                      />
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <p className="text-xs text-gray-500 mb-2">
                    {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString('zh-TW') : ''}
                  </p>
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{news.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{news.excerpt}</p>
                </CardContent>
              </Card>
            ))}
            
            {(!newsItems || newsItems.length === 0) && (
              <div className="col-span-full text-center py-12 text-gray-500">
                新聞資訊即將發布
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Franchise CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            加入宇聯國際
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            我們提供完善的加盟體系與專業支援，讓您的創業之路更加順利。
            歡迎有志之士加入我們的大家庭。
          </p>
          <Link href="/corporate/franchise">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 gap-2">
              了解加盟資訊 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </CorporateLayout>
  );
}
