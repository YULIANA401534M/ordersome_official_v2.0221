import { useState, useEffect, useRef } from "react";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { motion, useInView } from "framer-motion";
import { useRestaurantSchema } from "@/hooks/useRestaurantSchema";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const MARKER_COLOR = "#D97706";

export default function BrandStores() {
  const { data: stores, isLoading } = trpc.store.list.useQuery();
  useRestaurantSchema(stores);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const storeCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: "-60px" });

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
          fillColor: MARKER_COLOR,
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
    // scroll map into view on mobile
    if (window.innerWidth < 1024) {
      document.getElementById("store-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "oklch(0.97 0.02 85)",
          paddingTop: "clamp(80px, 12vw, 140px)",
          paddingBottom: "clamp(48px, 8vw, 96px)",
        }}
      >
        {/* 背景大字 */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none whitespace-nowrap"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(80px, 20vw, 280px)",
              color: "oklch(0.92 0.06 85)",
              letterSpacing: "-0.04em",
            }}
          >
            STORES
          </span>
        </div>

        <div className="relative z-10 px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{ background: "oklch(0.75 0.18 70)", color: "oklch(0.98 0.01 85)" }}
            >
              <MapPin className="w-3 h-3" />
              全台門市據點
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.15 }}
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(40px, 7vw, 88px)",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              color: "oklch(0.18 0.02 60)",
            }}
          >
            找到最近的
            <br />
            <span style={{ color: "oklch(0.75 0.18 70)" }}>來點什麼</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.35 }}
            className="mt-5 text-base leading-relaxed"
            style={{ color: "oklch(0.42 0.03 60)", maxWidth: 400 }}
          >
            全台 {stores?.length || 12} 間門市，台中、南投全面覆蓋，
            隨時享用台韓混血美味早午餐。
          </motion.p>
        </div>
      </section>

      {/* ── 地圖（全寬，高度收斂） ──────────────────────────────── */}
      <section
        id="store-map"
        style={{ background: "oklch(0.97 0.02 85)" }}
        className="px-6 md:px-12 lg:px-20 pb-6"
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            height: "clamp(280px, 40vw, 420px)",
            boxShadow: "0 8px 40px oklch(0.18 0.02 60 / 0.10)",
            border: "1px solid oklch(0.88 0.04 85)",
          }}
        >
          <MapView onMapReady={handleMapReady} />
        </div>
        <p
          className="text-center text-sm mt-2.5"
          style={{ color: "oklch(0.62 0.04 70)" }}
        >
          點擊地圖標記或下方門市卡片可互動定位
        </p>
      </section>

      {/* ── 門市格子（全部一眼看完） ────────────────────────────── */}
      <section
        className="py-12 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        {/* 標頭列 */}
        <div className="flex items-center justify-between mb-6">
          <p
            className="font-bold text-sm"
            style={{ color: "oklch(0.35 0.03 60)" }}
          >
            共 {stores?.length || 0} 間門市
          </p>
          {selectedStoreId && (
            <button
              onClick={() => {
                setSelectedStoreId(null);
                mapRef.current?.setCenter(TAICHUNG_CENTER);
                mapRef.current?.setZoom(12);
              }}
              className="text-sm font-bold transition-opacity hover:opacity-70"
              style={{ color: "oklch(0.75 0.18 70)" }}
            >
              清除選取
            </button>
          )}
        </div>

        {/* 載入骨架 */}
        {isLoading && (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl animate-pulse"
                style={{ height: 148, background: "oklch(0.92 0.04 85)" }}
              />
            ))}
          </div>
        )}

        {/* 門市格子 */}
        {!isLoading && (
          <motion.div
            ref={gridRef}
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
            initial="hidden"
            animate={gridInView ? "show" : "hidden"}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          >
            {stores?.map((store) => {
              const isSelected = selectedStoreId === store.id;
              return (
                <motion.div
                  key={store.id}
                  ref={(el) => { if (el) storeCardRefs.current.set(store.id, el); }}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT_EXPO } },
                  }}
                  onClick={() => handleStoreClick(store)}
                  className="rounded-2xl p-5 cursor-pointer transition-all duration-250"
                  style={{
                    background: isSelected ? "oklch(0.93 0.06 85)" : "oklch(0.99 0.01 85)",
                    border: `2px solid ${isSelected ? "oklch(0.75 0.18 70)" : "oklch(0.90 0.03 85)"}`,
                    boxShadow: isSelected
                      ? "0 4px 20px oklch(0.75 0.18 70 / 0.20)"
                      : "0 2px 8px oklch(0.18 0.02 60 / 0.05)",
                    transform: isSelected ? "translateY(-2px)" : "",
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.80 0.12 75)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px oklch(0.18 0.02 60 / 0.10)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.90 0.03 85)";
                      (e.currentTarget as HTMLElement).style.transform = "";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px oklch(0.18 0.02 60 / 0.05)";
                    }
                  }}
                >
                  {/* 門市名稱 + 選中標籤 */}
                  <div className="flex items-start justify-between mb-3">
                    <h3
                      className="text-sm font-bold leading-tight"
                      style={{ color: "oklch(0.18 0.02 60)" }}
                    >
                      {store.name}
                    </h3>
                    {isSelected && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ml-2"
                        style={{ background: "oklch(0.75 0.18 70)", color: "oklch(0.98 0.01 85)" }}
                      >
                        已選中
                      </span>
                    )}
                  </div>

                  {/* 資訊列 */}
                  <div className="space-y-1.5 mb-4 text-xs" style={{ color: "oklch(0.45 0.03 60)" }}>
                    {store.address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.75 0.18 70)" }} />
                        <span className="leading-snug">{store.address}</span>
                      </div>
                    )}
                    {store.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.75 0.18 70)" }} />
                        <a
                          href={`tel:${store.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="transition-opacity hover:opacity-70"
                        >
                          {store.phone}
                        </a>
                      </div>
                    )}
                    {store.openingHours && (
                      <div className="flex items-start gap-1.5">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.75 0.18 70)" }} />
                        <span className="leading-snug">{store.openingHours}</span>
                      </div>
                    )}
                  </div>

                  {/* 導航按鈕 */}
                  <button
                    onClick={(e) => openNavigation(e, store)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95"
                    style={{
                      background: "oklch(0.75 0.18 70)",
                      color: "oklch(0.98 0.01 85)",
                      boxShadow: "0 3px 12px oklch(0.75 0.18 70 / 0.28)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 5px 20px oklch(0.75 0.18 70 / 0.42)";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 3px 12px oklch(0.75 0.18 70 / 0.28)";
                      (e.currentTarget as HTMLButtonElement).style.transform = "";
                    }}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    開始導航
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </BrandLayout>
  );
}
