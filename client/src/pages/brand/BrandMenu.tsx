import { Card, CardContent } from "@/components/ui/card";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { injectSchema } from "@/hooks/schemaUtils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

export default function BrandMenu() {
  const { data: menuItems, isLoading } = trpc.menu.list.useQuery();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    document.title = "來點什麼 完整菜單｜必吃韓式飯捲、台式蛋餅與特色鐵板麵";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "查看來點什麼最新菜單！獨家韓式飯捲、酥脆台式蛋餅、經典鐵板麵，滿足您對台韓式早午餐的所有渴望。"
    );
    document.querySelector('meta[name="keywords"]')?.setAttribute(
      "content",
      "來點什麼菜單, 台中早餐菜單, 韓式飯捲, 台式蛋餅, 鐵板麵"
    );

    // Menu Schema
    const schema = {
      "@context": "https://schema.org",
      "@type": "Menu",
      "name": "來點什麼完整菜單",
      "description": "台韓式早午餐菜單",
      "url": "https://ordersome.com.tw/brand/menu",
      "hasMenuSection": [
        {
          "@type": "MenuSection",
          "name": "韓式飯捲",
          "description": "獨家韓式飯捲系列"
        },
        {
          "@type": "MenuSection",
          "name": "台式蛋餅",
          "description": "酥脆台式蛋餅系列"
        },
        {
          "@type": "MenuSection",
          "name": "鐵板麵",
          "description": "經典鐵板麵系列"
        }
      ]
    };
    const cleanup = injectSchema("menu", schema);
    return cleanup;
  }, []);


  // Group menu items by category
  const groupedItems = menuItems?.reduce((acc, item) => {
    if (!acc[item.categoryName]) {
      acc[item.categoryName] = [];
    }
    acc[item.categoryName].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <BrandLayout>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-amber-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              菜單介紹
            </h1>
            <p className="text-lg text-gray-600">
              精心製作的美味餐點，滿足您的每一個味蕾
            </p>
          </div>
        </div>
      </section>

      {/* Menu Images */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            完整菜單
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div 
              className="cursor-pointer hover:shadow-xl transition-shadow rounded-xl overflow-hidden"
              onClick={() => setSelectedImage("/menu/menu-1.jpg")}
            >
              <img
                src="/menu/menu-1.jpg"
                alt="來點什麼菜單 - 韓式飯捲、韓式特色餐點"
                className="w-full h-auto"
              />
            </div>
            <div 
              className="cursor-pointer hover:shadow-xl transition-shadow rounded-xl overflow-hidden"
              onClick={() => setSelectedImage("/menu/menu-2.jpg")}
            >
              <img
                src="/menu/menu-2.jpg"
                alt="來點什麼菜單 - 來點什麼、厚醬厚片、滿福堡"
                className="w-full h-auto"
              />
            </div>
          </div>
          <p className="text-center text-gray-500 mt-6 text-sm">
            點擊圖片可放大查看
          </p>
        </div>
      </section>

      {/* Menu Content - No prices */}
      <section className="py-12">
        <div className="container">
          {isLoading && (
            <div className="text-center py-12 text-gray-500">
              載入中...
            </div>
          )}

          {groupedItems && Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-primary">
                {category}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items?.map((item) => (
                  <Card key={item.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <img
                            src="/logos/brand-icon.png"
                            alt="來點什麼"
                            className="w-20 h-20 opacity-20"
                          />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                      )}
                      {/* Price is intentionally not displayed on brand website */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {(!menuItems || menuItems.length === 0) && !isLoading && (
            <div className="text-center py-20">
              <img
                src="/logos/brand-icon.png"
                alt="來點什麼"
                className="w-24 h-24 mx-auto mb-6 opacity-30"
              />
              <p className="text-gray-500 text-lg">更多餐點資訊請參考上方完整菜單</p>
              <p className="text-gray-400 mt-2">歡迎蒞臨門市享用美食</p>
            </div>
          )}
        </div>
      </section>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-0">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="菜單"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </BrandLayout>
  );
}
