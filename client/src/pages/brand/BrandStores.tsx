import { useEffect, useRef, useState } from "react";
import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { motion } from "framer-motion";
import { useRestaurantSchema } from "@/hooks/useRestaurantSchema";

export default function BrandStores() {
  const { data: stores, isLoading } = trpc.store.list.useQuery();
  useRestaurantSchema(stores);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const storeCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    document.title = "來點什麼門市 | 台韓兩味，混搭就對";
  }, []);

  const TAICHUNG_CENTER = { lat: 24.147, lng: 120.674 };

  const addMarkersToMap = (googleMap: google.maps.Map, storeList: typeof stores) => {
    if (!storeList || storeList.length === 0) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    const newMarkers = storeList
      .map((store) => {
        if (!store.latitude || !store.longitude) return null;
        const lat = parseFloat(String(store.latitude));
        const lng = parseFloat(String(store.longitude));
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: googleMap,
          title: store.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#f4b400",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
        marker.addListener("click", () => {
          setSelectedStoreId(store.id);
          googleMap.setCenter({ lat, lng });
          googleMap.setZoom(16);
          const cardEl = storeCardRefs.current.get(store.id);
          if (cardEl) cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        return marker;
      })
      .filter(Boolean) as google.maps.Marker[];
    markersRef.current = newMarkers;
  };

  const handleMapReady = (googleMap: google.maps.Map) => {
    mapRef.current = googleMap;
    googleMap.setCenter(TAICHUNG_CENTER);
    googleMap.setZoom(12);
    if (stores && stores.length > 0) addMarkersToMap(googleMap, stores);
  };

  useEffect(() => {
    if (mapRef.current && stores && stores.length > 0 && markersRef.current.length === 0) {
      addMarkersToMap(mapRef.current, stores);
    }
  }, [stores]);

  const handleStoreClick = (store: NonNullable<typeof stores>[0]) => {
    setSelectedStoreId(store.id);
    if (mapRef.current && store.latitude && store.longitude) {
      const lat = parseFloat(String(store.latitude));
      const lng = parseFloat(String(store.longitude));
      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(16);
    }
  };

  const openNavigation = (e: React.MouseEvent, store: NonNullable<typeof stores>[0]) => {
    e.stopPropagation();
    if (!store.latitude || !store.longitude) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`, "_blank");
  };

  return (
    <BrandLayout>
      <section className="px-6 pb-10 pt-6 md:pb-12 md:pt-10">
        <div className="container">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-[#fff1bf] px-4 py-2 text-xs font-semibold tracking-[0.2em] text-[#9d7400]">
              STORES
            </p>
            <h1 className="mt-5 text-[clamp(2.7rem,6vw,5rem)] font-black tracking-[-0.06em] text-[#181512]">
              想吃的時候，
              <span className="block">先找離你最近的那間</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#675e50] md:text-lg">
              門市先清楚就好，不用講太多。點卡片會同步定位到地圖。
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-24">
        <div className="container">
          {isLoading ? (
            <div className="py-16 text-center text-[#8b826f]">門市整理中...</div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)]">
              <div className="lg:sticky lg:top-28">
                <div className="overflow-hidden rounded-[32px] border border-[#ece1c7] bg-white shadow-[0_20px_60px_-44px_rgba(91,66,18,0.28)]">
                  <div className="h-[560px]">
                    <MapView onMapReady={handleMapReady} />
                  </div>
                </div>
                <p className="mt-4 text-sm text-[#8b826f]">點右邊門市卡片，地圖會一起跳過去。</p>
              </div>

              <div className="grid gap-4">
                {stores?.map((store, index) => (
                  <motion.div
                    key={store.id}
                    ref={(el) => {
                      if (el) storeCardRefs.current.set(store.id, el);
                    }}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    onClick={() => handleStoreClick(store)}
                    className={`cursor-pointer rounded-[28px] border bg-white p-6 shadow-[0_18px_50px_-44px_rgba(91,66,18,0.25)] transition-transform hover:-translate-y-1 ${
                      selectedStoreId === store.id ? "border-[#d7b54b]" : "border-[#ece1c7]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-black tracking-[-0.04em] text-[#181512]">{store.name}</h2>
                        <div className="mt-4 space-y-2 text-sm leading-7 text-[#675e50]">
                          <div className="flex items-start gap-3">
                            <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-[#b68b05]" />
                            <span>{store.address}</span>
                          </div>
                          {store.phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="h-4 w-4 flex-shrink-0 text-[#b68b05]" />
                              <a href={`tel:${store.phone}`} onClick={(e) => e.stopPropagation()} className="hover:text-[#181512]">
                                {store.phone}
                              </a>
                            </div>
                          )}
                          {store.openingHours && (
                            <div className="flex items-start gap-3">
                              <Clock className="mt-1 h-4 w-4 flex-shrink-0 text-[#b68b05]" />
                              <span>{store.openingHours}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedStoreId === store.id && (
                        <span className="rounded-full bg-[#fff1bf] px-3 py-1 text-xs font-semibold text-[#8c6a00]">
                          目前查看
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => openNavigation(e, store)}
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#181512] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2a241d]"
                    >
                      <Navigation className="h-4 w-4" />
                      導航過去
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </BrandLayout>
  );
}
