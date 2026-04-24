import { Link } from "wouter";
import { ExternalLink, Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";

export default function BrandFooter() {
  return (
    <footer className="border-t border-[#ece1c7] bg-[#fffaf0]">
      <div className="container px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.9fr_0.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src="/logos/brand-logo-yellow.png" alt="來點什麼" className="h-12 w-auto" />
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#a17800]">ORDER SOME</p>
                <p className="text-sm text-[#675e50]">台韓兩味，混搭就對</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#675e50]">
              這裡先保留乾淨一點。等你把餐點、門市、人物素材補進來，我再幫你把首頁和 footer 一起做得更好玩。
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-[0.18em] text-[#181512]">逛一圈</h4>
            <div className="mt-4 grid gap-3 text-sm text-[#675e50]">
              <Link href="/brand/story" className="hover:text-[#181512]">品牌故事</Link>
              <Link href="/brand/menu" className="hover:text-[#181512]">菜單</Link>
              <Link href="/brand/stores" className="hover:text-[#181512]">門市</Link>
              <Link href="/brand/franchise" className="hover:text-[#181512]">加盟</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-[0.18em] text-[#181512]">聯絡資訊</h4>
            <div className="mt-4 space-y-3 text-sm text-[#675e50]">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b68b05]" />
                <span>台中市北屯區軍福十九路 47 號 10 樓之 3</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 flex-shrink-0 text-[#b68b05]" />
                <span>(04) 2437-9666</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 flex-shrink-0 text-[#b68b05]" />
                <span>ordersome2020@gmail.com</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-[0.18em] text-[#181512]">外部連結</h4>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="https://www.facebook.com/ordersometw" target="_blank" rel="noopener noreferrer" className="rounded-full bg-white p-3 text-[#181512] shadow-sm transition-transform hover:-translate-y-0.5">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/ordersome_official/" target="_blank" rel="noopener noreferrer" className="rounded-full bg-white p-3 text-[#181512] shadow-sm transition-transform hover:-translate-y-0.5">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://www.youtube.com/@ordersome" target="_blank" rel="noopener noreferrer" className="rounded-full bg-white p-3 text-[#181512] shadow-sm transition-transform hover:-translate-y-0.5">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="https://lnk.bio/ELwe" target="_blank" rel="noopener noreferrer" className="rounded-full bg-white p-3 text-[#181512] shadow-sm transition-transform hover:-translate-y-0.5">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <Link href="/corporate" className="mt-5 inline-flex items-center gap-2 text-sm text-[#675e50] hover:text-[#181512]">
              宇聯企業官網
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-[#ece1c7] pt-5 text-sm text-[#8b826f]">
          {new Date().getFullYear()} 來點什麼 ORDER SOME. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
