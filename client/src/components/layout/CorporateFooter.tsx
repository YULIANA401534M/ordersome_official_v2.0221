import { Link } from "wouter";

export default function CorporateFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="/logos/yulian-logo-horizontal.png"
                alt="宇聯國際"
                className="h-12 w-auto"
              />
              <div>
                <p className="font-bold">宇聯國際文化餐饮有限公司</p>
                <p className="text-sm text-gray-400">YULIAN</p>
                <p className="text-sm text-gray-400">YULIAN International Cultural Catering Co., Ltd.</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              宇聯國際致力於打造優質餐飲品牌，以創新思維與專業服務，
              為消費者帶來美好的餐飲體驗。我們秉持著對品質的堅持，
              持續拓展多元化的餐飲版圖。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-6">快速連結</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/corporate/about" className="text-gray-400 hover:text-white transition-colors">
                  企業介紹
                </Link>
              </li>
              <li>
                <Link href="/corporate/brands" className="text-gray-400 hover:text-white transition-colors">
                  旗下品牌
                </Link>
              </li>
              <li>
                <Link href="/corporate/news" className="text-gray-400 hover:text-white transition-colors">
                  新聞中心
                </Link>
              </li>
              <li>
                <Link href="/corporate/franchise" className="text-gray-400 hover:text-white transition-colors">
                  加盟資訊
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-gray-400 hover:text-white transition-colors">
                  線上商城
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-6">聯絡資訊</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <span className="block text-white font-medium">地址</span>
                台中市北屯區東山路一段147巷10弄6號
              </li>
              <li>
                <span className="block text-white font-medium">電話</span>
                04-2437-9666
              </li>
              <li>
                <span className="block text-white font-medium">電子郵件</span>
                ordersome2020@gmail.com
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container py-6">
          <div className="flex justify-center items-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} 宇聯國際文化餐飲有限公司 版權所有</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
