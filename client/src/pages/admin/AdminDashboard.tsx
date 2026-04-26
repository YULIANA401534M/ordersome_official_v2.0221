import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, ArrowRight, Settings, Layers, Clock, CreditCard, Truck } from "lucide-react";
import { useLocation } from "wouter";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { data: products } = trpc.product.listAll.useQuery();
  const { data: orders } = trpc.order.listAll.useQuery();
  const { data: categories } = trpc.category.listAll.useQuery();

  const stats = [
    { title: "商品數量",   value: products?.length ?? 0,                                                           icon: Package,    link: "/dashboard/admin/products" },
    { title: "總訂單數",   value: orders?.length ?? 0,                                                             icon: ShoppingCart,link: "/dashboard/admin/orders" },
    { title: "商品分類",   value: categories?.length ?? 0,                                                         icon: Layers,     link: "/dashboard/admin/categories" },
    { title: "待處理訂單", value: orders?.filter(o => o.status === "pending").length ?? 0,                         icon: Clock,      link: "/dashboard/admin/orders" },
    { title: "付款/處理中",value: orders?.filter(o => o.status === "paid" || o.status === "processing").length ?? 0, icon: CreditCard, link: "/dashboard/admin/orders" },
    { title: "已出貨/送達",value: orders?.filter(o => o.status === "shipped" || o.status === "delivered").length ?? 0, icon: Truck,   link: "/dashboard/admin/orders" },
  ];

  const quickLinks = [
    { title: "商品管理", desc: "新增、編輯、刪除商品", icon: Package,     link: "/dashboard/admin/products" },
    { title: "訂單管理", desc: "查看訂單、更新狀態",   icon: ShoppingCart, link: "/dashboard/admin/orders" },
    { title: "分類管理", desc: "管理商品分類",         icon: Layers,       link: "/dashboard/admin/categories" },
  ];

  const pendingCount = orders?.filter(o => o.status === "pending").length ?? 0;

  if (!isAuthenticated || (user?.role !== "super_admin" && user?.role !== "manager")) {
    return (
      <AdminDashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
          <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: "48px 40px", textAlign: "center", maxWidth: 400, width: "100%" }}>
            <Settings style={{ width: 48, height: 48, color: "var(--os-text-3)", margin: "0 auto 16px", opacity: 0.5 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", marginBottom: 8 }}>需要管理員權限</h2>
            <p style={{ fontSize: 13, color: "var(--os-text-3)", marginBottom: 20 }}>請使用管理員帳號登入</p>
            <Button variant="outline" onClick={() => setLocation("/")}>返回首頁</Button>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div style={{ background: "var(--os-bg)", minHeight: "100vh", padding: 20 }} className="space-y-5">

        {/* Header */}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>商城總覽</h1>
          <p style={{ fontSize: 13, color: "var(--os-text-3)", marginTop: 2 }}>管理商品、訂單與分類</p>
        </div>

        {/* Stats — flex summary strip */}
        <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }} className="md:grid-cols-6">
            {stats.map((stat, i) => (
              <div key={i}
                onClick={() => setLocation(stat.link)}
                style={{
                  padding: "18px 20px", cursor: "pointer", transition: "background 0.15s",
                  borderRight: i < stats.length - 1 ? "1px solid var(--os-border)" : "none",
                  borderBottom: i < 3 ? "1px solid var(--os-border)" : "none",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--os-amber-soft)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <stat.icon style={{ width: 14, height: 14, color: "var(--os-amber)" }} />
                  <span style={{ fontSize: 11, color: "var(--os-text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{stat.title}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--os-text-1)", fontVariantNumeric: "tabular-nums" }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--os-text-1)", marginBottom: 12 }}>快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((item, i) => (
              <div key={i}
                onClick={() => setLocation(item.link)}
                style={{
                  background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12,
                  padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--os-amber)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px oklch(0.75 0.18 70 / 0.1)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--os-border)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--os-amber-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.icon style={{ width: 22, height: 22, color: "var(--os-amber-text)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-1)" }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "var(--os-text-3)", marginTop: 2 }}>{item.desc}</div>
                </div>
                <ArrowRight style={{ width: 16, height: 16, color: "var(--os-text-3)", flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Pending Orders Alert */}
        {pendingCount > 0 && (
          <div style={{ background: "var(--os-warning-bg)", border: "1px solid var(--os-warning)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--os-text-1)", marginBottom: 4 }}>待處理訂單提醒</div>
              <p style={{ fontSize: 13, color: "var(--os-text-2)" }}>您有 {pendingCount} 筆待處理的訂單，請盡快處理。</p>
            </div>
            <Button onClick={() => setLocation("/dashboard/admin/orders")} className="text-white" style={{ background: "var(--os-amber)", flexShrink: 0 }}>
              前往處理
            </Button>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
