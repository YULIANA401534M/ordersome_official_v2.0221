import { MapPin, Phone, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";

export default function BrandStores() {
  const { data: stores, isLoading } = trpc.store.list.useQuery();

  return (
    <BrandLayout>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-amber-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              門市據點
            </h1>
            <p className="text-lg text-gray-600">
              找到離您最近的來點什麼，隨時享用美味餐點
            </p>
          </div>
        </div>
      </section>

      {/* Map & Stores */}
      <section className="py-12">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Map */}
            <div className="h-[400px] lg:h-[600px] rounded-2xl overflow-hidden shadow-lg">
              <MapView
                onMapReady={(map: google.maps.Map) => {
                  map.setCenter({ lat: 25.033, lng: 121.5654 });
                  map.setZoom(12);
                  
                  if (stores) {
                    stores.forEach((store) => {
                      if (store.latitude && store.longitude) {
                        const marker = new google.maps.Marker({
                          position: {
                            lat: parseFloat(store.latitude),
                            lng: parseFloat(store.longitude),
                          },
                          map,
                          title: store.name,
                        });

                        const infoWindow = new google.maps.InfoWindow({
                          content: `
                            <div style="padding: 8px;">
                              <h3 style="font-weight: bold; margin-bottom: 4px;">${store.name}</h3>
                              <p style="font-size: 12px; color: #666;">${store.address}</p>
                              ${store.phone ? `<p style="font-size: 12px; color: #666;">${store.phone}</p>` : ''}
                            </div>
                          `,
                        });

                        marker.addListener("click", () => {
                          infoWindow.open(map, marker);
                        });
                      }
                    });
                  }
                }}
              />
            </div>

            {/* Store List */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 sticky top-0 bg-white py-2">
                全部門市 ({stores?.length || 0})
              </h2>
              
              {isLoading && (
                <div className="text-center py-12 text-gray-500">
                  載入中...
                </div>
              )}
              
              {stores?.map((store) => (
                <Card key={store.id} className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-3">{store.name}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                        {store.address}
                      </p>
                      {store.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                          {store.phone}
                        </p>
                      )}
                      {store.openingHours && (
                        <p className="flex items-start gap-2">
                          <Clock className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                          <span className="whitespace-pre-line">{store.openingHours}</span>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!stores || stores.length === 0) && !isLoading && (
                <div className="text-center py-12 text-gray-500">
                  門市資訊即將更新
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
