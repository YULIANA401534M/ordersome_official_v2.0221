import { useEffect, useState } from "react";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { injectSchema } from "@/hooks/schemaUtils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, X } from "lucide-react";
import { Link } from "wouter";

export default function BrandMenu() {
  const { data: menuItems, isLoading } = trpc.menu.list.useQuery();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    document.title = "來點什麼菜單 | 台韓兩味，混搭就對";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "來點什麼菜單頁，先看整體風格，再慢慢選你今天想吃哪一味。",
    );

    const schema = {
      "@context": "https://schema.org",
      "@type": "Menu",
      name: "來點什麼菜單",
      description: "台韓混搭早午餐菜單",
      url: "https://ordersome.com.tw/brand/menu",
    };
    const cleanup = injectSchema("menu", schema);
    return cleanup;
  }, []);

  const groupedItems = menuItems?.reduce((acc, item) => {
    if (!acc[item.categoryName]) acc[item.categoryName] = [];
    acc[item.categoryName].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <BrandLayout>
      <section className="px-6 pb-10 pt-6 md:pb-12 md:pt-10">
        <div className="container">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-[#fff1bf] px-4 py-2 text-xs font-semibold tracking-[0.2em] text-[#9d7400]">
              MENU
            </p>
            <h1 className="mt-5 text-[clamp(2.7rem,6vw,5rem)] font-black tracking-[-0.06em] text-[#181512]">
              先看菜單，
              <span className="block">再決定今天想混哪一味</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#675e50] md:text-lg">
              這頁先讓你抓到來點什麼的整體樣子。正式價格和下單邏輯還是以現場或商城為主。
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-2">
            {["/menu/2026菜單-01_0.jpg", "/menu/2026菜單-02_0.jpg"].map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setSelectedImage(src)}
                className="overflow-hidden rounded-[30px] border border-[#ece1c7] bg-white shadow-[0_20px_60px_-44px_rgba(91,66,18,0.28)] transition-transform hover:-translate-y-1"
              >
                <img
                  src={src}
                  alt={`來點什麼菜單圖 ${index + 1}`}
                  className="w-full h-auto"
                />
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-[#8b826f]">點圖片可以放大看。</p>
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-24">
        <div className="container">
          {isLoading && <div className="py-16 text-center text-[#8b826f]">菜單整理中...</div>}

          {groupedItems &&
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="mb-14">
                <div className="mb-6 flex items-end justify-between gap-4 border-b border-[#ece1c7] pb-4">
                  <h2 className="text-3xl font-black tracking-[-0.04em] text-[#181512]">{category}</h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {(items as any[])?.map((item: any) => (
                    <Card key={item.id} className="overflow-hidden rounded-[28px] border border-[#ece1c7] bg-white shadow-[0_18px_50px_-44px_rgba(91,66,18,0.25)]">
                      <div className="aspect-square bg-[#fff8e8]">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <img src="/logos/brand-logo-yellow.png" alt="來點什麼" className="h-16 w-auto opacity-30" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5">
                        <h3 className="text-lg font-bold text-[#181512]">{item.name}</h3>
                        {item.description && <p className="mt-2 text-sm leading-7 text-[#675e50]">{item.description}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

          {(!menuItems || menuItems.length === 0) && !isLoading && (
            <div className="rounded-[32px] border border-[#ece1c7] bg-white px-6 py-16 text-center shadow-[0_18px_50px_-44px_rgba(91,66,18,0.25)]">
              <img src="/logos/brand-logo-yellow.png" alt="來點什麼" className="mx-auto h-16 w-auto opacity-35" />
              <p className="mt-6 text-lg font-semibold text-[#181512]">菜單內容還在整理</p>
              <p className="mt-2 text-sm text-[#8b826f]">之後會補上更完整的品項與圖片。</p>
            </div>
          )}

          <div className="mt-12 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full bg-[#181512] px-8 text-white hover:bg-[#2a241d]">
              <Link href="/shop">
                直接逛商店
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/45 p-2 text-white"
          >
            <X className="h-5 w-5" />
          </button>
          {selectedImage && <img src={selectedImage} alt="菜單大圖" className="w-full rounded-[24px]" />}
        </DialogContent>
      </Dialog>
    </BrandLayout>
  );
}
