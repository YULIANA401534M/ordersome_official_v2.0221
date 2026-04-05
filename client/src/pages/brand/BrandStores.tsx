import { useState, useEffect, useRef } from "react";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";
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
    document.title = "來點什麼 門市據點｜全台 15 間分店為您服務";
  }, []);

  const TAICHUNG_CENTER = { lat: 24.147, lng: 120.674 };

  const addMarkersToMap = (googleMap: google.maps.Map, storeList: typeof stores) => {
    if (!storeList || storeList.length === 0) return;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    const newMarkers = storeList.map((store) => {
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
          fillColor: "#F59E0B",
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
    }).filter(Boolean) as google.maps.Marker[];
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
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
    window.open(url, "_blank");
  };

  return (
    <BrandLayout>
      <section className="relative py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-amber-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-5 py-2 rounded-full text-sm font-medium border border-amber-500/30 mb-6">
              <MapPin className="h-4 w-4" />
              全台門市據點
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              找到最近的
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300"> 來點什麼</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              全台 {stores?.length || 12} 間門市，台中、南投全面覆蓋，隨時享用美味餐點
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 0C1200 40 960 60 720 60C480 60 240 40 0 0L0 60Z" fill="white"/>
          </svg>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-gray-500 text-lg">載入門市資料中...</div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div className="lg:sticky lg:top-24">
                <div className="h-[600px] rounded-2xl overflow-hidden shadow-xl border border-gray-100">
                  <MapView onMapReady={handleMapReady} />
                </div>
                <p className="text-center text-sm text-gray-400 mt-3">點擊地圖標記或右側門市卡片可互動定位</p>
              </div>
              <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2">
                <div className="sticky top-0 bg-white py-2 z-10 border-b border-gray-100 mb-2">
                  <p className="text-sm font-medium text-gray-500">
                    共 {stores?.length || 0} 間門市
                    {selectedStoreId && (
                      <button
                        onClick={() => {
                          setSelectedStoreId(null);
                          mapRef.current?.setCenter(TAICHUNG_CENTER);
                          mapRef.current?.setZoom(12);
                        }}
                        className="ml-3 text-amber-600 hover:underline"
                      >
                        清除選取
                      </button>
                    )}
                  </p>
                </div>
                {stores?.map((store, index) => (
                  <motion.div
                    key={store.id}
                    ref={(el) => { if (el) storeCardRefs.current.set(store.id, el); }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.04 }}
                    onClick={() => handleStoreClick(store)}
                    className={`bg-white rounded-2xl p-5 shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 ${
                      selectedStoreId === store.id
                        ? "border-amber-500 shadow-amber-100 bg-amber-50/30"
                        : "border-transparent hover:border-amber-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-900">{store.name}</h3>
                      {selectedStoreId === store.id && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2">已選中</span>
                      )}
                    </div>
                    <div className="space-y-1.5 text-gray-600 text-sm mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{store.address}</span>
                      </div>
                      {store.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <a href={`tel:${store.phone}`} onClick={(e) => e.stopPropagation()} className="hover:text-amber-600 transition-colors">{store.phone}</a>
                        </div>
                      )}
                      {store.openingHours && (
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{store.openingHours}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => openNavigation(e, store)}
                      className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-amber-200 active:scale-95"
                    >
                      <Navigation className="w-4 h-4" />
                      開始導航
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
