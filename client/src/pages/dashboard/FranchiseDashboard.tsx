import { Link } from "wouter";
import FranchiseeDashboardLayout from "@/components/FranchiseeDashboardLayout";
import { Store, BarChart3, Package, BookOpen, Wrench, ClipboardList, FileText } from "lucide-react";

const cardSt: React.CSSProperties = { background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 24, display: "block", transition: "border-color 0.15s, box-shadow 0.15s" };

export default function FranchiseDashboard() {
  return (
    <FranchiseeDashboardLayout>
      <div style={{ padding: "28px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }} className="space-y-6">

          {/* Welcome */}
          <div style={{ background: "var(--os-amber)", borderRadius: 14, padding: "28px 32px", color: "#fff" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>歡迎回到門市夥伴專區</h1>
            <p style={{ fontSize: 14, opacity: 0.85 }}>管理您的門市、查看營運報表、下載 SOP 文件</p>
          </div>

          {/* Core Operations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { to: "/dashboard/sop",      icon: <BookOpen style={{ width: 22, height: 22, color: "var(--os-success)" }} />,      iconBg: "var(--os-success-bg)",  title: "SOP 知識庫",  desc: "查閱標準作業流程、訓練手冊與操作指引" },
              { to: "/dashboard/repairs",  icon: <Wrench   style={{ width: 22, height: 22, color: "var(--os-warning)" }} />,      iconBg: "var(--os-warning-bg)", title: "設備報修",   desc: "提交設備維修申請、查看維修進度" },
              { to: "/dashboard/checklist",icon: <ClipboardList style={{ width: 22, height: 22, color: "var(--os-info)" }} />,    iconBg: "var(--os-info-bg)",    title: "每日檢查表", desc: "填寫開店/閉店檢查表、查看歷史記錄" },
            ].map(c => (
              <Link key={c.to} to={c.to}>
                <div style={cardSt}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--os-amber)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px oklch(0.75 0.18 70 / 0.12)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--os-border)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {c.icon}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--os-text-1)" }}>{c.title}</h3>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--os-text-2)" }}>{c.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Secondary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link to="/dashboard/franchise/stores">
              <div style={cardSt}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--os-amber)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--os-border)"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--os-info-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Store style={{ width: 22, height: 22, color: "var(--os-info)" }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--os-text-1)" }}>門市管理</h3>
                </div>
                <p style={{ fontSize: 13, color: "var(--os-text-2)" }}>查看門市資訊、營業時間、聯絡方式</p>
              </div>
            </Link>
            {[
              { icon: <BarChart3 style={{ width: 22, height: 22, color: "var(--os-text-3)" }} />, title: "營運報表", desc: "查看營收、成本、利潤等營運數據" },
              { icon: <Package   style={{ width: 22, height: 22, color: "var(--os-text-3)" }} />, title: "庫存管理", desc: "查看庫存狀況、進貨記錄、盤點表單" },
            ].map(c => (
              <div key={c.title} style={{ ...cardSt, opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--os-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {c.icon}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--os-text-3)" }}>{c.title}</h3>
                </div>
                <p style={{ fontSize: 13, color: "var(--os-text-3)" }}>{c.desc}</p>
                <span style={{ fontSize: 11, color: "var(--os-text-3)", background: "var(--os-surface-2)", padding: "2px 8px", borderRadius: 10, marginTop: 8, display: "inline-block" }}>即將推出</span>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: "20px 24px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--os-text-1)", marginBottom: 16 }}>最新公告</h2>
            <div className="space-y-3">
              {[
                { icon: <FileText style={{ width: 18, height: 18, color: "var(--os-success)" }} />, iconBg: "var(--os-success-bg)", title: "新版 SOP 文件已上線", body: "請至 SOP 文件區下載最新版本的標準作業流程文件", date: "2026-01-15" },
                { icon: <BarChart3 style={{ width: 18, height: 18, color: "var(--os-info)" }} />,   iconBg: "var(--os-info-bg)",    title: "12 月營運報表已產生", body: "請至營運報表區查看上個月的營運數據分析",       date: "2026-01-01" },
              ].map(n => (
                <div key={n.title} className="flex items-start gap-3" style={{ background: "var(--os-surface-2)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: n.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {n.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-1)" }}>{n.title}</h3>
                    <p style={{ fontSize: 12, color: "var(--os-text-2)", marginTop: 2 }}>{n.body}</p>
                    <p style={{ fontSize: 11, color: "var(--os-text-3)", marginTop: 4 }}>{n.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FranchiseeDashboardLayout>
  );
}
