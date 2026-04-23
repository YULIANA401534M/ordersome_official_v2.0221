import DriverLayout from "./DriverLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { ClipboardList, Package, TrendingUp, CheckCircle, Wallet, ArrowRight } from "lucide-react";

const TENANT_ID = 90004;

export default function DriverHome() {
  const { user } = useAuth();
  const todayDate = new Date().toISOString().slice(0, 10);

  const { data: orders = [] } = trpc.dayone.driver.getMyTodayOrders.useQuery(
    { tenantId: TENANT_ID, deliveryDate: todayDate },
    { enabled: !!user?.id }
  );

  const pending = orders.filter((o: any) => ["pending", "assigned"].includes(o.status)).length;
  const picked = orders.filter((o: any) => o.status === "picked").length;
  const delivering = orders.filter((o: any) => o.status === "delivering").length;
  const done = orders.filter((o: any) => o.status === "delivered").length;
  const collected = orders.reduce((sum: number, order: any) => sum + Number(order.cashCollected ?? 0), 0);

  const today = new Date().toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "long" });

  return (
    <DriverLayout title="配送主控台">
      <div className="space-y-4">
        <section className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(255,245,220,0.5),_transparent_34%),linear-gradient(135deg,#1f2937_0%,#374151_40%,#b45309_100%)] p-5 text-white shadow-[0_16px_40px_rgba(120,53,15,0.18)]">
          <p className="text-xs uppercase tracking-[0.24em] text-white/60">Dayone driver</p>
          <p className="mt-3 text-sm text-white/72">{today}</p>
          <h2 className="mt-1 font-brand text-[1.8rem] leading-none">{user?.name ?? "司機夥伴"}</h2>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/76">
            今天的配送、簽收與回庫，都在這裡一路完成。
          </p>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
            <div>
              <p className="text-xs text-white/60">現金回收</p>
              <p className="mt-1 text-2xl font-semibold">NT$ {collected.toLocaleString()}</p>
            </div>
            <Link href="/driver/worklog" className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-2 text-sm font-medium text-white">
              前往日結
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          {[
            { label: "待出車", value: pending, icon: ClipboardList, tone: "bg-white text-stone-900" },
            { label: "已撿貨", value: picked, icon: Package, tone: "bg-amber-50 text-amber-900" },
            { label: "配送中", value: delivering, icon: TrendingUp, tone: "bg-orange-50 text-orange-900" },
            { label: "已送達", value: done, icon: CheckCircle, tone: "bg-emerald-50 text-emerald-900" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className={`${tone} rounded-3xl border border-stone-200/70 p-4 shadow-[0_10px_24px_rgba(120,53,15,0.06)]`}>
              <Icon className="h-5 w-5 text-amber-600" />
              <p className="mt-6 text-3xl font-semibold">{value}</p>
              <p className="mt-1 text-sm text-stone-500">{label}</p>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <p className="px-1 text-sm font-semibold text-stone-700">今日流程</p>
          {[
            {
              href: "/driver/pickup",
              icon: Package,
              title: "撿貨出車",
              desc: `${pending} 筆待出車訂單，先確認上車再出發`,
            },
            {
              href: "/driver/orders",
              icon: ClipboardList,
              title: "配送訂單",
              desc: `${orders.length} 筆今日單，逐筆進入簽收與收款`,
            },
            {
              href: "/driver/today",
              icon: Wallet,
              title: "今日總覽",
              desc: "按狀態檢查待處理、配送中與已完成",
            },
            {
              href: "/driver/worklog",
              icon: CheckCircle,
              title: "剩貨回庫與日結",
              desc: "回報剩貨、確認現金差額、送出工作日誌",
            },
          ].map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-3xl border border-stone-200/70 bg-white px-4 py-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)] transition-transform active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-900">{title}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300" />
            </Link>
          ))}
        </section>
      </div>
    </DriverLayout>
  );
}
