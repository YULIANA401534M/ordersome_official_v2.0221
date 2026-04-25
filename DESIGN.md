# Design

## Visual Theme

**名稱：** Warm Paper（暖紙）

管理者坐在辦公桌前，窗外是台中的午後陽光。後台像一本整理得很好的帳冊：米白的底、清晰的欄位、amber 色的重點標記。不刺眼，不冷峻，讀數字就像翻閱一本你信任的工具書。

色彩策略：**Restrained**（克制），以暖調中性色為底，amber 作為唯一強調色，佔比不超過 10%。

---

## Color Palette

所有色彩用 OKLCH，hue 統一偏暖（60–90）。

### 背景與表面

```
--os-bg:          oklch(0.97 0.008 80)   /* 米白底：整頁背景 */
--os-surface:     oklch(1.00 0.004 80)   /* 純暖白：卡片、面板 */
--os-surface-2:   oklch(0.95 0.010 78)   /* 次級表面：zebra 行、hover 狀態 */
--os-border:      oklch(0.90 0.008 75)   /* 邊框、分隔線 */
--os-border-2:    oklch(0.93 0.006 78)   /* 輕邊框：表格內分隔 */
```

### 側邊欄（改為暖色淺色系）

```
--os-sidebar-bg:      oklch(0.94 0.014 78)   /* 側邊欄底：比頁面底稍深的米色 */
--os-sidebar-hover:   oklch(0.90 0.018 76)   /* hover 項目 */
--os-sidebar-active:  oklch(0.87 0.022 74)   /* 當前頁 active */
--os-sidebar-text:    oklch(0.35 0.012 65)   /* 主文字 */
--os-sidebar-muted:   oklch(0.60 0.010 68)   /* 次要文字、群組標籤 */
--os-sidebar-border:  oklch(0.88 0.012 76)   /* 側邊欄分隔線 */
```

### 文字

```
--os-text-1:   oklch(0.18 0.010 60)   /* 主要：標題、重要數字 */
--os-text-2:   oklch(0.40 0.010 65)   /* 次要：描述、輔助說明 */
--os-text-3:   oklch(0.62 0.008 68)   /* 靜音：佔位符、disabled */
```

### Amber 強調色（唯一強調色）

```
--os-amber:        oklch(0.65 0.16 72)   /* 主強調：CTA 按鈕、active badge */
--os-amber-hover:  oklch(0.60 0.17 70)   /* 按鈕 hover */
--os-amber-soft:   oklch(0.93 0.06 80)   /* 柔和底色：badge 背景、highlight 行 */
--os-amber-text:   oklch(0.52 0.14 68)   /* amber 色文字（放在白底上） */
```

### 語意色

```
--os-success:     oklch(0.50 0.14 145)   /* 綠：已完成、庫存正常 */
--os-success-bg:  oklch(0.96 0.04 145)
--os-warning:     oklch(0.62 0.14 72)    /* 黃：警告、待處理 */
--os-warning-bg:  oklch(0.96 0.05 80)
--os-danger:      oklch(0.52 0.18 25)    /* 紅：逾期、異常、需注意 */
--os-danger-bg:   oklch(0.97 0.03 25)
--os-info:        oklch(0.50 0.12 250)   /* 藍：資訊 */
--os-info-bg:     oklch(0.96 0.03 250)
```

---

## Typography

```
--os-font-ui:    'Plus Jakarta Sans', 'PingFang TC', 'Noto Sans TC', system-ui, sans-serif
--os-font-mono:  'JetBrains Mono', 'Fira Code', monospace
```

- 大標（頁面 H1）：18–20px, weight 600, color --os-text-1
- 子標（區塊標題）：14–15px, weight 600, color --os-text-1
- 群組標籤（sidebar section）：11px, weight 700, uppercase, letter-spacing 0.08em, color --os-sidebar-muted
- 內文 / 表格：14px, weight 400, color --os-text-2
- 小標籤 / badge：11–12px, weight 500
- 數字強調：18–24px, weight 700, --os-text-1（配合 tabular-nums）

行高：body 1.5，表格行 1.4，標題 1.2。

---

## Spacing & Layout

**基準：4px 格點**

- 頁面 padding：desktop 32px, tablet 24px, mobile 16px
- 卡片 padding：20–24px
- 表格行高：44px（可點選的行），36px（只讀的行）
- 側邊欄寬：256px（固定），可收合成 icon 模式（未來）
- 內容區最大寬：1280px（置中），全寬表格不限

留白原則：群組間距 24px，群組內元素間距 12px，行內元素 8px。

---

## Component Patterns

### 按鈕

- Primary（CTA）：`bg-[--os-amber]` + 白字，hover 暗一階，radius 8px，height 36px
- Secondary：`border border-[--os-border]` + `bg-[--os-surface]`，hover `bg-[--os-surface-2]`
- Ghost：無邊框，hover `bg-[--os-surface-2]`
- Danger：`bg-[--os-danger]` + 白字（只在確認刪除時用）
- 禁用：opacity 0.45，cursor-not-allowed

### 輸入框

- border `--os-border`，focus ring `--os-amber`（2px solid），radius 8px
- Label 在上方，12–13px，weight 500，color --os-text-2
- Error state：border `--os-danger`，錯誤文字 12px

### 表格

- header row：`bg-[--os-surface-2]`，11–12px uppercase，weight 600，--os-text-3
- 資料行：hover `bg-[--os-amber-soft]`，border-bottom `--os-border-2`
- 無 zebra striping（hover 代替）
- 數字欄：右對齊，tabular-nums

### 卡片

- `bg-[--os-surface]`，`border border-[--os-border]`，radius 12px
- padding 20–24px
- 無陰影（用邊框取代），除非是浮動 dialog / dropdown
- 卡片內不再嵌卡片

### Badge / 標籤

- 正常狀態：`bg-[--os-surface-2]` + `text-[--os-text-2]`
- 成功：`bg-[--os-success-bg]` + `text-[--os-success]`
- 警告：`bg-[--os-warning-bg]` + `text-[--os-amber-text]`
- 危險：`bg-[--os-danger-bg]` + `text-[--os-danger]`

### 側邊欄

- 背景：`--os-sidebar-bg`（暖米色）
- Logo 區塊：amber 色方形 icon，品牌字型標題
- 群組標籤：uppercase 小字，--os-sidebar-muted
- 項目：icon + label，active 時 `bg-[--os-sidebar-active]`，文字 --os-sidebar-text
- 數字徽章（未讀 / 待處理）：amber 或 red，圓形，最小寬 20px

---

## Motion

後台不做頁面進場動畫（Framer Motion 太重）。

允許的 transition：
- sidebar item hover：`transition-colors duration-150`
- button hover：`transition-colors duration-150`
- dialog open：shadcn 預設 fade（已內建）
- accordion / collapse：`transition-all duration-200 ease-out`

禁止：bounce、elastic、spring、任何超過 300ms 的動畫。

---

## Elevation

```
Level 0: 頁面底層（--os-bg）
Level 1: 卡片、面板（--os-surface，border）
Level 2: dropdown、tooltip（border + shadow-sm）
Level 3: dialog、modal（border + shadow-md + backdrop）
```

後台不用大陰影做視覺層次，靠邊框和背景色差分層。

---

## Icons

使用 lucide-react，size 16px（inline）或 20px（獨立按鈕）。
顏色跟隨父層文字色（currentColor）。
不做圓角底色 icon 放標題上方（禁止）。
