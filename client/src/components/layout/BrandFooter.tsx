import { Link } from "wouter";
import { Facebook, Instagram, MapPin, Phone, Mail, Youtube, ExternalLink } from "lucide-react";

export default function BrandFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div>
            <img
              src="/logos/brand-logo-yellow.png"
              alt="來點什麼"
              className="h-16 w-auto mb-4"
            />
            <p className="text-gray-400 text-sm leading-relaxed">
              來點什麼 ORDER SOME<br />
              用心製作每一份餐點，<br />
              為您帶來美好的用餐體驗。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">快速連結</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/brand/story" className="text-gray-400 hover:text-white transition-colors text-sm">
                  品牌故事
                </Link>
              </li>
              <li>
                <Link href="/brand/menu" className="text-gray-400 hover:text-white transition-colors text-sm">
                  菜單介紹
                </Link>
              </li>
              <li>
                <Link href="/brand/stores" className="text-gray-400 hover:text-white transition-colors text-sm">
                  門市據點
                </Link>
              </li>
              <li>
                <Link href="/brand/franchise" className="text-gray-400 hover:text-white transition-colors text-sm">
                  加盟諮詢
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-gray-400 hover:text-white transition-colors text-sm">
                  線上商城
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-lg mb-4">聯絡資訊</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>台中市北屯區東山路一段147巷10弄6號</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>(04) 2437-9666</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>ordersome2020@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Social & Corporate */}
          <div>
            <h4 className="font-bold text-lg mb-4">關注我們</h4>
            <div className="flex gap-3 mb-6">
              <a
                href="https://www.facebook.com/ordersometw"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                title="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/ordersome_official/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 transition-colors"
                title="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.youtube.com/@ordersome"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                title="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="https://lnk.bio/ELwe"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                title="Linktree"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
            <Link
              href="/corporate"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              宇聯國際文化餐飲有限公司 →
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} 宇聯國際文化餐飲有限公司. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
