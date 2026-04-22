import fs from "fs";
import path from "path";

const CWD = process.cwd();
const inputPathArg = process.argv[2];
const outputPathArg = process.argv[3] || "docs/SEO_GSC週報.md";

if (!inputPathArg) {
  console.error("Usage: node scripts/seo-keyword-iteration.mjs <gsc_csv_path> [output_md_path]");
  process.exit(1);
}

const inputPath = path.isAbsolute(inputPathArg)
  ? inputPathArg
  : path.join(CWD, inputPathArg);
const outputPath = path.isAbsolute(outputPathArg)
  ? outputPathArg
  : path.join(CWD, outputPathArg);

if (!fs.existsSync(inputPath)) {
  console.error(`CSV not found: ${inputPath}`);
  process.exit(1);
}

const csv = fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");
const lines = csv.split(/\r?\n/).filter(Boolean);

if (lines.length < 2) {
  console.error("CSV has no data rows.");
  process.exit(1);
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const header = parseCsvLine(lines[0]).map((h) =>
  h.toLowerCase().replace(/\s+/g, "").replace(/[()（）%]/g, "")
);

const idx = {
  query: header.findIndex((h) => h.includes("query") || h.includes("查詢")),
  clicks: header.findIndex((h) => h.includes("click") || h.includes("點擊")),
  impressions: header.findIndex((h) => h.includes("impression") || h.includes("曝光")),
  ctr: header.findIndex((h) => h.includes("ctr")),
  position: header.findIndex((h) => h.includes("position") || h.includes("排名")),
};

if (idx.query < 0 || idx.clicks < 0 || idx.impressions < 0) {
  console.error("CSV header not recognized. Need columns for query/clicks/impressions.");
  process.exit(1);
}

const toNum = (v) => {
  if (!v) return 0;
  const normalized = String(v).replace(/[%,$\s]/g, "").replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

const rows = lines
  .slice(1)
  .map(parseCsvLine)
  .map((cols) => {
    const query = (cols[idx.query] || "").trim();
    const clicks = toNum(cols[idx.clicks]);
    const impressions = toNum(cols[idx.impressions]);
    const ctr =
      idx.ctr >= 0 ? toNum(cols[idx.ctr]) / (String(cols[idx.ctr] || "").includes("%") ? 100 : 1) : 0;
    const position = idx.position >= 0 ? toNum(cols[idx.position]) : 0;
    return { query, clicks, impressions, ctr, position };
  })
  .filter((r) => r.query && r.impressions > 0);

const keywordMap = [
  {
    match: /(台中加盟|台中早餐加盟|早餐加盟|早餐加盟推薦|早午餐加盟|優秀加盟商|加盟創業)/,
    landing: "/brand/franchise-taichung",
    intent: "加盟創業",
  },
  {
    match: /(辣椒醬|辣椒醬推薦|好吃辣椒醬|早餐店辣椒醬|辣椒醬線上購買)/,
    landing: "/shop/chili-sauce-guide",
    intent: "電商購買",
  },
];

function inferLanding(query) {
  const found = keywordMap.find((m) => m.match.test(query));
  if (found) {
    return { landing: found.landing, intent: found.intent };
  }
  return { landing: "/news", intent: "內容探索" };
}

const opportunities = rows
  .filter((r) => r.impressions >= 80)
  .map((r) => {
    const ctr = r.ctr || (r.clicks > 0 ? r.clicks / r.impressions : 0);
    const ctrLevel =
      ctr < 0.01 ? "very_low" : ctr < 0.03 ? "low" : ctr < 0.06 ? "medium" : "good";
    const posLevel =
      r.position === 0 ? "unknown" : r.position <= 3 ? "top" : r.position <= 10 ? "first_page" : "needs_push";
    const { landing, intent } = inferLanding(r.query);

    let action = "維持內容更新與內鏈";
    if (ctrLevel === "very_low" || ctrLevel === "low") {
      action = "改寫標題與描述，增加精準關鍵詞";
    }
    if (posLevel === "needs_push") {
      action = "新增對應段落並增加內部連結權重";
    }

    return {
      ...r,
      ctr,
      ctrLevel,
      posLevel,
      landing,
      intent,
      action,
    };
  })
  .sort((a, b) => b.impressions - a.impressions);

const top20 = opportunities.slice(0, 20);
const today = new Date().toISOString().slice(0, 10);

const linesOut = [];
linesOut.push(`# SEO / GSC 週報 (${today})`);
linesOut.push("");
linesOut.push(`資料來源：\`${path.basename(inputPath)}\``);
linesOut.push(`總關鍵字筆數：${rows.length}`);
linesOut.push(`建議優先處理：${top20.length}`);
linesOut.push("");
linesOut.push("## 優先優化清單");
linesOut.push("");
linesOut.push("| 查詢字詞 | 點擊 | 曝光 | CTR | 平均排名 | 意圖 | 建議 Landing | 行動 |");
linesOut.push("|---|---:|---:|---:|---:|---|---|---|");

for (const r of top20) {
  linesOut.push(
    `| ${r.query} | ${r.clicks} | ${r.impressions} | ${(r.ctr * 100).toFixed(2)}% | ${
      r.position ? r.position.toFixed(2) : "-"
    } | ${r.intent} | ${r.landing} | ${r.action} |`
  );
}

linesOut.push("");
linesOut.push("## 本週落地頁任務");
linesOut.push("");
linesOut.push("1. 更新 `/brand/franchise-taichung`：把本週加盟高曝光低 CTR 的詞加入 H2 與首段。");
linesOut.push("2. 更新 `/shop/chili-sauce-guide`：把本週辣椒醬高曝光詞補進 FAQ 與比較段。");
linesOut.push("3. 從每日文章加入內部連結，優先導向上述兩個 landing page。");

fs.writeFileSync(outputPath, `${linesOut.join("\n")}\n`, "utf8");
console.log(`SEO report generated: ${outputPath}`);
