/**
 * 匯出資料為 CSV 檔（含 BOM，支援 Excel 中文顯示）
 * @param data   資料陣列
 * @param filename  檔名（不含副檔名，日期會自動附加）
 * @param columns   欄位定義陣列，每項 { key: 資料欄位名, label: CSV 欄標題 }
 */
export function exportCSV(
  data: Record<string, any>[],
  filename: string,
  columns: { key: string; label: string }[]
) {
  const BOM = "\uFEFF";
  const header = columns.map(c => `"${c.label}"`).join(",");
  const rows = data.map(row =>
    columns.map(c => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csv = BOM + [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
