import { Link } from "wouter";
import {
  ExternalLink,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";

const quickLinks = [
  { href: "/brand/story", label: "品牌故事" },
  { href: "/brand/menu", label: "餐點菜單" },
  { href: "/brand/stores", label: "門市據點" },
  { href: "/brand/franchise", label: "加盟合作" },
  { href: "/shop", label: "線上商城" },
];

export default function BrandFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[#efe5c7] bg-[#1f1a14] text-white">
      <div className="absolute left-[-8rem] top-[-6rem] h-56 w-56 rounded-full bg-[#f6c945]/16 blur-3xl" />
      <div className="absolute bottom-[-8rem] right-[-5rem] h-64 w-64 rounded-full bg-[#fff4c8]/8 blur-3xl" />

      <div className="container relative py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3">
              <img src="/logos/brand-logo-yellow.png" alt="來點什麼" className="h-12 w-auto" />
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-[#f7d768]">
                  Order Some
                </p>
                <p className="text-sm text-white/70">台韓混血的年輕早午餐品牌</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-7 text-white/70">
              以熟悉的台式早餐為底，加入更俐落的韓系節奏與年輕感，做出一間好拍、好吃、也更適合持續展店的品牌。
            </p>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d768]">
                Image Slot
              </p>
              <p className="mt-3 text-sm leading-7 text-white/70">
                品牌形象橫幅預留區
                <br />
                之後可放門店、餐點或人物照片，我再幫你補發光邊緣、漂浮貼紙或進場動畫。
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white">快速導覽</h4>
            <div className="mt-5 grid gap-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white">聯絡資訊</h4>
            <div className="mt-5 space-y-4 text-sm text-white/70">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#f7d768]" />
                <span>台中市北屯區軍福十九路 47 號 10 樓之 3</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 flex-shrink-0 text-[#f7d768]" />
                <span>(04) 2437-9666</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 flex-shrink-0 text-[#f7d768]" />
                <span>ordersome2020@gmail.com</span>
              </div>
              <Link href="/corporate" className="inline-flex items-center gap-2 text-white/80 transition-colors hover:text-[#f7d768]">
                宇聯企業官網
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white">社群入口</h4>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="https://www.facebook.com/ordersometw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-[#3b5998] hover:text-white"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/ordersome_official/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-[#d9487f] hover:text-white"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.youtube.com/@ordersome"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-[#d32222] hover:text-white"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="https://lnk.bio/ELwe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-[#2ca54c] hover:text-white"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-6 rounded-[1.75rem] border border-[#6b5a27] bg-[#2b241b] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d768]">
                Future Motion
              </p>
              <p className="mt-3 text-sm leading-7 text-white/70">
                這裡也保留給之後的短動畫模組，例如貼紙浮動、食物滑入、社群 CTA 呼吸光。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/45 md:flex-row md:items-center md:justify-between">
          <p>{new Date().getFullYear()} 來點什麼 ORDER SOME. All rights reserved.</p>
          <p>這一版先把視覺骨架整理好，圖片與動畫細節可在素材到位後再精修。</p>
        </div>
      </div>
    </footer>
  );
}
