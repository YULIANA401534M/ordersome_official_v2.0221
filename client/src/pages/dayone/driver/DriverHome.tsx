import DriverLayout from "./DriverLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { ClipboardList, Package, TrendingUp, CheckCircle } from "lucide-react";

const TENANT_ID = 2; // DaYong tenant

export default function DriverHome() {
  const { user } = useAuth();
  const todayDate = new Date().toISOString().slice(0, 10);
  const { data: myOrders } = trpc.dayone.drivers.myOrders.useQuery(
    { tenantId: TENANT_ID, deliveryDate: todayDate },
    { enabled: !!user?.id }
  );

  const pending = (myOrders as any[] ?? []).filter((o: any) => o.status === "pending").length;
  const delivering = (myOrders as any[] ?? []).filter((o: any) => o.status === "delivering").length;
  const done = (myOrders as any[] ?? []).filter((o: any) => o.status === "delivered").length;

  const today = new Date().toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "long" });

  return (
    <DriverLayout>
      <div className="p-4 space-y-4">
        {/* Greeting */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <p className="text-sm opacity-80">{today}</p>
          <h2 className="text-xl font-bold mt-1">早安，{user?.name ?? "司機"}！</h2>
          <p className="text-sm opacity-80 mt-1">今日配送任務</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "待配送", count: pending, color: "bg-blue-50 text-blue-700", icon: ClipboardList },
            { label: "配送中", count: delivering, color: "bg-orange-50 text-orange-700", icon: Package },
            { label: "已完成", count: done, color: "bg-green-50 text-green-700", icon: CheckCircle },
          ].map(({ label, count, color, icon: Icon }) => (
            <div key={label} className={`${color} rounded-xl p-3 text-center`}>
              <Icon className="w-5 h-5 mx-auto mb-1" />
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">快速操作</h3>
          <Link href="/driver/orders" className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">查看配送單</div>
              <div className="text-xs text-gray-500">今日 {pending + delivering} 筆待處理</div>
            </div>
            <span className="ml-auto text-gray-400">›</span>
          </Link>
          <Link href="/driver/pickup" className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">取貨確認</div>
              <div className="text-xs text-gray-500">掃描或確認取貨</div>
            </div>
            <span className="ml-auto text-gray-400">›</span>
          </Link>
          <Link href="/driver/done" className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">今日完成</div>
              <div className="text-xs text-gray-500">已完成 {done} 筆配送</div>
            </div>
            <span className="ml-auto text-gray-400">›</span>
          </Link>
        </div>
      </div>
    </DriverLayout>
  );
}
