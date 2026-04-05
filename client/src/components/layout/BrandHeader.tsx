import { useLocation } from "wouter";
export default function BrandHeader() {
  const [, navigate] = useLocation();
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => navigate("/brand")} className="text-xl font-bold text-gray-900">
          來點什麼
        </button>
        <nav className="hidden md:flex gap-6 text-sm text-gray-600">
          <button onClick={() => navigate("/brand/menu")}>菜單</button>
          <button onClick={() => navigate("/brand/stores")}>門市</button>
          <button onClick={() => navigate("/brand/news")}>最新消息</button>
          <button onClick={() => navigate("/brand/franchise")}>加盟</button>
          <button onClick={() => navigate("/brand/contact")}>聯絡我們</button>
        </nav>
      </div>
    </header>
  );
}
