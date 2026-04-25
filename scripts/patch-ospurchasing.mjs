import fs from 'fs';

let src = fs.readFileSync('client/src/pages/dashboard/OSPurchasing.tsx', 'utf8');

// Main wrapper background
src = src.replace(
  'style={{ background: "#f7f6f3", minHeight: "100vh" }}',
  'style={{ background: "var(--os-bg)", minHeight: "100vh" }}'
);

// All #b45309 amber buttons -> --os-amber
src = src.replace(/style=\{\{ background: "#b45309" \}\}/g, 'style={{ background: "var(--os-amber)" }}');

// h1 class fix
src = src.replace(
  'className="text-2xl font-bold text-gray-800 mb-6"',
  'style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", marginBottom: 24 }}'
);

// Quick filter buttons
src = src.replace(
  /className="text-xs px-2 py-1 rounded border border-stone-300 hover:bg-stone-100 text-stone-600"/g,
  'style={{ fontSize: 12, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--os-border)", color: "var(--os-text-2)", background: "none", cursor: "pointer" }}'
);

// KPI cards
src = src.replace(
  '<div key={card.label} className="bg-white rounded-xl p-4 shadow-sm">',
  '<div key={card.label} style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, padding: 16 }}>'
);
src = src.replace(
  '<p className="text-xs text-gray-500 mb-1">{card.label}</p>',
  '<p style={{ fontSize: 12, color: "var(--os-text-3)", marginBottom: 4 }}>{card.label}</p>'
);
src = src.replace(
  '<p className="font-kamabit text-3xl font-bold" style={{ color: card.color }}>{card.value}</p>',
  '<p style={{ fontSize: 28, fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>'
);
src = src.replace('color: "#9ca3af"', 'color: "var(--os-text-3)"');
src = src.replace('color: "#0369a1"', 'color: "var(--os-info)"');
src = src.replace('color: "#15803d"', 'color: "var(--os-success)"');

// Select all row
src = src.replace(
  '"flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm"',
  '"flex items-center gap-3 px-4 py-2"'
);

// Order cards
src = src.replace(
  'className="bg-white rounded-xl shadow-sm overflow-hidden"',
  'style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, overflow: "hidden" }}'
);

// Order row hover
src = src.replace(
  'className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"',
  'className="flex items-center gap-3 p-4 cursor-pointer" onMouseEnter={e => (e.currentTarget.style.background = "var(--os-amber-soft)")} onMouseLeave={e => (e.currentTarget.style.background = "")}'
);

// Empty state
src = src.replace(
  'className="bg-white rounded-xl p-8 text-center text-gray-600"',
  'style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, padding: 32, textAlign: "center", color: "var(--os-text-2)" }}'
);

// Detail inner
src = src.replace(
  'className="border-t px-4 pb-4 pt-3 space-y-3"',
  'style={{ borderTop: "1px solid var(--os-border)", padding: "12px 16px 16px" }} className="space-y-3"'
);

// received status badge
src = src.replace(
  'style={{ color: "#166534", background: "#dcfce7", border: "none" }}',
  'style={{ color: "var(--os-success)", background: "var(--os-success-bg)", border: "none" }}'
);

// LINE sent push badge
src = src.replace(
  'style={{ color: "#15803d", background: "#f0fdf4", border: "none" }}',
  'style={{ color: "var(--os-success)", background: "var(--os-success-bg)", border: "none" }}'
);
src = src.replace(
  'style={{ color: "#dc2626", background: "#fef2f2", border: "none" }}',
  'style={{ color: "var(--os-danger)", background: "var(--os-danger-bg)", border: "none" }}'
);
// Active supplier lines badge
src = src.replace(
  'style={{ color: sl.isActive ? "#15803d" : "#9ca3af", background: sl.isActive ? "#f0fdf4" : "#f3f4f6", border: "none" }}',
  'style={{ color: sl.isActive ? "var(--os-success)" : "var(--os-text-3)", background: sl.isActive ? "var(--os-success-bg)" : "var(--os-surface-2)", border: "none" }}'
);

// Detail table header
src = src.replace(
  'className="text-gray-600 border-b"',
  'style={{ borderBottom: "1px solid var(--os-border)", color: "var(--os-text-3)" }}'
);

// Detail table rows hover
src = src.replace(
  'className="border-b last:border-0 hover:bg-gray-50"',
  'style={{ borderTop: "1px solid var(--os-border-2)" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--os-amber-soft)")} onMouseLeave={e => (e.currentTarget.style.background = "")}'
);

// bg-gray-50 form rows (create/import)
src = src.replace(
  /className="grid grid-cols-7 gap-1 items-end bg-gray-50 p-2 rounded-lg"/g,
  'style={{ background: "var(--os-surface-2)", borderRadius: 8, padding: 8 }} className="grid grid-cols-7 gap-1 items-end"'
);
src = src.replace(
  /className="grid grid-cols-8 gap-1 items-end bg-gray-50 p-2 rounded-lg"/g,
  'style={{ background: "var(--os-surface-2)", borderRadius: 8, padding: 8 }} className="grid grid-cols-8 gap-1 items-end"'
);

// Damai import result
src = src.replace(
  'className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-1"',
  'style={{ background: "var(--os-success-bg)", border: "1px solid var(--os-success)", borderRadius: 8, padding: 12, fontSize: 13 }} className="space-y-1"'
);
src = src.replace(
  'className="font-medium text-green-700"',
  'style={{ fontWeight: 600, color: "var(--os-success)" }}'
);

// pick/import preview bg-gray-50
src = src.replace(
  /className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"/g,
  'style={{ background: "var(--os-surface-2)", borderRadius: 8, padding: 12, fontSize: 13 }} className="space-y-1"'
);
src = src.replace(
  /className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 text-center"/g,
  'style={{ background: "var(--os-surface-2)", borderRadius: 8, padding: 12, fontSize: 13, color: "var(--os-text-2)", textAlign: "center" }}'
);

// LINE dialog supplier row
src = src.replace(
  'className="flex items-center justify-between bg-gray-50 rounded-lg p-3"',
  'style={{ background: "var(--os-surface-2)", borderRadius: 8, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}'
);
src = src.replace(
  'className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm"',
  'style={{ background: "var(--os-surface-2)", borderRadius: 8, padding: 12, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}'
);

fs.writeFileSync('client/src/pages/dashboard/OSPurchasing.tsx', src, 'utf8');
console.log('done');
