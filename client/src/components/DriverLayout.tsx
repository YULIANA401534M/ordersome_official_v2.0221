import { useLocation } from "wouter";

interface DriverLayoutProps {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
}

export default function DriverLayout({ title, children, showBack = true }: DriverLayoutProps) {
  const [location, navigate] = useLocation();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ height: 56, background: "#16a34a", color: "#fff", display: "flex", alignItems: "center", padding: "0 16px", position: "sticky", top: 0, zIndex: 100 }}>
        {showBack && (
          <button onClick={() => window.history.back()} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", marginRight: 12, padding: 0 }}>
            ←
          </button>
        )}
        <span style={{ fontSize: 18, fontWeight: 600 }}>{title}</span>
      </div>
      <div style={{ flex: 1, padding: 16, paddingBottom: 80 }}>
        {children}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 60, background: "#fff", borderTop: "1px solid #e5e7eb", display: "flex", zIndex: 100 }}>
        <button onClick={() => navigate("/driver")} style={{ flex: 1, border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: location === "/driver" ? "#16a34a" : "#9ca3af", fontSize: 10 }}>
          <span style={{ fontSize: 22 }}>🚛</span>
          今日路線
        </button>
        <button onClick={() => navigate("/driver/worklog")} style={{ flex: 1, border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: location === "/driver/worklog" ? "#16a34a" : "#9ca3af", fontSize: 10 }}>
          <span style={{ fontSize: 22 }}>📋</span>
          工作日誌
        </button>
      </div>
    </div>
  );
}
