# CLAUDE.md ??摰??擗ㄡ OrderSome ?銝餅?

璆剖??摩隢? BUSINESS.md嚗?銵???霈 CLAUDE_REFERENCE.md嚗風?脰???霈 DEVELOPMENT_LOG.md

> **?**嚗5.88??*?敺??*嚗?026-04-23??
> **蝯?Claude ?嗆?**嚗之?佗?Claude.ai嚗? ?嚗laude Code嚗?

---

## 蝚砌?隞嗡?

?踹?遢?辣???銵?
```bash
git status && git log --oneline -3
```
蝣箄? working tree clean????commit ?臭?憭拍?嚗???撌乩???

---

## ?? 摰摰?嚗?撠?甇ｇ?

- **蝯?銝隞交?撖Ⅳ?ATABASE_URL?PI Key 蝖砍神?其遙雿?.ts / .mjs / .bat / .js 瑼?鋆?*
- ???霅?敺 `.env`嚗璈???Railway Variables嚗roduction嚗?
- `.env` 撌脣 `.gitignore`嚗??◤ commit嚗? `.mjs` / `.bat` 銝靽風蝭?
- script 瑼?霈鞈?摨怨???`process.env.DATABASE_URL`
- 2026-04-24 ?潛???甈∪?蝣潭援瞍?隞塚?撖急香??migrate_temp.mjs / tidb-check-and-sync.mjs / start-dev.bat嚗?撌脤?閮剖?蝣潔蒂皜

---

## ?摰?嚗?甈⊥?撠店獢?霈嚗?

1. 瘥活 commit ??*敹??湔 CLAUDE.md**嚗??祈? +0.01
2. CLAUDE.md ?航楊撠店獢??臭?閮擃?銝?啁??潔?銝??Claude 憭望
3. ??撘?v5.XX
4. ??TS ?航炊??commit
5. 瘥活 commit ???炎??docs/ordersome_module_map_v1.html嚗閰脫活 commit 瘨?璅∠?????湛??摰?????潛??撱箇?嚗?敹??郊?湔撠??∠???status-pill class嚗?
   - done嚗?嚗? 摰?甇?虜??
   - partial嚗?嚗? ?典?摰???憿?
   - running嚗?嚗? ?鞈????
   - pending嚗嚗? 敺遣蝵?
   ???湔 footer ???祈?嚗1.0 ??v1.1嚗??交???
6. **?垢?閮剛?**嚗????I ?寧???????蝔???隞?HTML 敹?雿輻 web-design-engineer skill嚗???`C:\Users\barmy\OneDrive\獢\VS CODE撠?\_skill_install_tmp\web-design-skill-main\.claude\skills\web-design-engineer\SKILL.md`嚗?急撘??? Claude Code Skill tool嚗kill name = `web-design-engineer`???拍嚗?敺垢 API?LI 撌亙?閬死?瘙?鞈?????

---

## ???嚗偶銋???

1. **RWD ?芸?**嚗?璈?撟單/獢?嚗”?潭帖???
2. **璅∠?摰??*嚗?銵具憓耨?嫘底??歹?super_admin嚗?雿誥嚗anager嚗?
3. **鞈??**嚗楊璅∠?敹???DB 撅斤??嚗??賢??蝡舐???
4. **蝔賣餈質馱**嚗???文神 os_audit_logs嚗翰????嚗?摨怠??啣?撖?os_inventory_logs
5. **?脤?銴?*嚗???亙????臭??菟??嚗?亙?頛詨撽??勗?
6. **?賢?閬?**嚗??迤撘?蝔勗? os_products.name嚗??函頂蝯勗?蝔勗? aliases JSON ???
7. **?臭耨?寞?*嚗??平???? DB 銝神甇餌?撘Ⅳ
8. **銝?蝭?**嚗之瘞?ERP嚗?dayone嚗?+ server/_core/ 銝?

---

## ?嗅???????閰望?敹?嚗?

### ???Git ???2026-04-24 v5.94嚗?

?敺???commit嚗?
1. `(v5.94)` 最新 feat: v5.94 BrandFranchise 加盟頁改版 OKLCH暖黃深色系 + 視差Hero + 四大優勢橫線排列 + 六步驟格子 + FAQ + 深色表單
1. `(v5.93)` 最新 feat: v5.93 BrandStory 品牌故事頁改版 OKLCH暖黃色系 + 視差Hero + 時間軸故事 + 三大理念 + 願景暖黃浸染帶
1. `(v5.92)` ??fix: v5.92 ??撣單狡?芸????怨疏?崁eceived??psert os_payables + ?雿?頂蝯梁絞銝?寧accounting router
2. `(v5.92)` ??feat: v5.92 ???瑕鈭箸閮?剁??臬??祕閮+蝞∠??∪隤踵?宏???憿舐內?鈭箔?甈整?
2. `(v5.92)` ??fix: v5.92 ProductDetail??鞎駁?瑼餉??敺toreSettings.get霈??蝘駁撖急香NT$1000/NT$100
3. `(v5.92)` ??fix: v5.92 ??????靘耨甇??aspect-square?spect-[3/4]+object-cover?bject-contain
2. `(v5.92)` ??fix: v5.92 AdminProducts Modal Footer?箏?嚗ialogContent?批??Ⅱflex摰孵?踹?grid銵?
2. `(v5.92)` ??fix: v5.92 AdminProducts Modal蝘駁overflow-hidden?Ｗ儔?脣??
2. `(v5.79)` ??fix: v5.79 AdminProducts Modal璈怠?皞Ｗ?寞靽格迤嚗crollArea Viewport?verflow-x-hidden+DialogContent??max-w-2xl
2. `(v5.77)` ??fix: v5.77 scheduledAt?亥岷璇辣靽格迤+????蝯曹?+CLAUDE.md??閬?
3. `(v5.76)` ??fix: v5.76 scheduledAt???澆??寞靽格迤嚗etPublishedPosts????瞈???靽格迤+皜??null?喲?

working tree: clean

### 撌脣??芋蝯?

| 頝舐 | ?辣 | ???| 隤芣? |
|------|------|------|------|
| `/dashboard/purchasing` | `OSPurchasing.tsx` | ??| ?怨疏蝞∠?嚗ake銝脫嚗xcel?臬嚗鞎典?嚗?摨?|
| `/dashboard/inventory` | `OSInventory.tsx` | ??| 摨怠?蝞∠?嚗憿??寞活?日?嚗?風?莎?餈?0蝑?嚗???雿??芷嚗uper_admin嚗?蝯梯???摨怠???嚗temValue嚗??敺耨?寞???|
| `/dashboard/products` | `OSProducts.tsx` | ??| ???嚗之暻?44蝑歇?臬嚗704蝑?嚗撅文?憿?|
| `/dashboard/ca-menu` | `OSCaMenu.tsx` | ??| ??蝞∠? |
| `/dashboard/delivery` | `OSDelivery.tsx` | ??| ?恣??敺鞎典撱箇?嚗偷?嗆摨怠? |
| `/dashboard/accounting` | `OSAccounting.tsx` | ??| 撣喳?蝞∠?嚗?Tab嚗??憓?隞?|
| `/dashboard/franchisee-payments` | `OSFranchiseePayments.tsx` | ??| ??銝餃董甈?|
| `/dashboard/rebate` | `OSRebate.tsx` | ??| ?雿?董甈?|
| `/dashboard/profit-loss` | `OSProfitLoss.tsx` | ??| ???銵冽嚗PI?4嚗reaChart瘥頞典嚗ieChart?楝??嚗arChart鞎餌蝯?嚗???蝝啗” |
| `/dashboard/scheduling` | `OSScheduling.tsx` | ?? | ?蝞∠?嚗??憓撌亥???|
| `/dashboard/daily-report` | `OSDailyReport.tsx` | ??| ?撣??|
| `/dashboard/franchisees` | `OSCustomers.tsx` | ??| ??銝餃?銵剁????嚗鞈澆???|
| `/dashboard/customers` | `ComingSoon` | ??| 摰Ｘ蝞∠?嚗? |
| `/dayone/portal/forgot-password` | `DayonePortalForgotPassword.tsx` | ??| 憿舐內?舐鼠?餉店 0980-190-857 |

---

## DB ?暹?敹怎嚗?026-04-19 ?臬敺?

| 銵?| 蝑 | 隤芣? |
|----|------|------|
| os_procurement_orders | 484 | 453撘萄之暻交風??+ 31撘萇頂蝯望??|
| os_procurement_items | 10263 | ?急風?脣??? |
| os_inventory | 187 | B憿?4 + ?嗡?鞈141 + ?Ｘ?22 |
| os_inventory_logs | 706 | ??/31?日??箸?暺?65蝑?+ 4/1敺澈摮孛??81蝑?|
| os_payables | 27 | 25蝑之暻交風?莎?撱???遢嚗? 2蝑???|
| os_products | 704 | ??67 + 憭折漸?臬?啣遣137蝑?needsReview=1嚗?|
| os_stores | 12 | 靘?隞暻?2??撣?2026-04-19撱箇?嚗?|
| os_suppliers | 9+ | 撱??/鋆?/??/蝐唾健/鋆?/蝢?摰?隡臭澈/摰/摰_?望暑嚗??嗡?嚗?|

### ?? 撌脩鞈?蝻粹

- `os_procurement_orders.storeId`嚗?6蝑??摸ULL嚗toreName蝛箏?銝脫???撣?撅祆迤撣賂?
- `os_procurement_items.unitPrice=0`嚗?376蝑?撠董?梯”?芣項??026-02敺??湔閮?⊿脰疏?對???銵嚗?
- `os_products.needsReview=1`嚗?37蝑?憭折漸甇瑕?臬?啣遣??嚗?鈭箏極??/dashboard/products 蝣箄?嚗?
- 撉啣????葛撘??蝑??拳 vs ?雿榆?堆??脰疏?孵榆10???鈭箏極蝣箄?

### os_stores ?撣??殷?tenantId=1嚗?

| ?撣??| ?剖? |
|---------|------|
| 靘?隞暻??扈?像摨?| ?扈?像摨?|
| 靘?隞暻??扈?摨?| ?扈?摨?|
| 靘?隞暻?憭折?摨?| 憭折?摨?|
| 靘?隞暻??勗摨?| ?勗摨?|
| 靘?隞暻??勗控摨?| ?勗控摨?|
| 靘?隞暻?瘞?摨?| 瘞?摨?|
| 靘?隞暻?瘞貉?摨?| 瘞貉?摨?|
| 靘?隞暻??璇?摨?| ?璇?摨?|
| 靘?隞暻??扈銝剖控摨?| ?扈銝剖控摨?|
| 靘?隞暻?镼踹扈蝳?摨?| 镼踹扈蝳?摨?|
| 靘?隞暻?鞎∠?摨?| 鞎∠?摨?|
| 靘?隞暻??Ｙ?摨?| ?Ｙ?摨?|

---

## 敺????賣???

### 銝餌?隞餃?

**P1 敺?霅???閰望?敺?Ⅱ隤?嚗?*
- [ ] **?垢撽?**嚗?dashboard/purchasing??dashboard/inventory??dashboard/accounting 憿舐內甇瑕鞈??臬甇?Ⅱ
- [ ] **needsReview ??蝣箄?**嚗?37蝑撱箏???鈭箏極??/dashboard/products ??蝣箄??桐?/?
- [ ] **??銵券?霅?*嚗Ⅱ隤?os_daily_reports 撌脫??撣?梯?????銵典?銵冽??⊥迤蝣粹＊蝷?

**P2 ?祆?嚗?*
- [ ] ?勗?桀??踝??芯?摨??芯??寞嚗?
- [ ] 瘣曇??桃絞?游??堆?頝券?撣?雿菜鞎典嚗?
- [ ] ?銵?蝝啣??澆??舀嚗???唳撘?
- [ ] chunk size ?芸?嚗ndex.js ~6500kB嚗? code splitting嚗?

**P3 銋?嚗?*
- [ ] BOM ?拇?皜嚗?撌交?隞塚??∟頃鞈?蝛拙? + os_products ?皞Ⅱ嚗?
- [ ] 憭扳偶 LIFF 甇?? liffId嚗???嚗?
- [ ] ?函頂蝯?RWD 撖拇
- [ ] ?蝞∠??∪極鞈??臬

**撌脣????砍?閰望?嚗?026-04-19嚗?**
- [x] 3/31 ?日?鞈??臬嚗?65蝑?B憿?4+?嗡?鞈141嚗?
- [x] 憭折漸甇瑕?怨疏閮?臬嚗?53撘蛛?2025/12~2026/04嚗?
- [x] 撱?撠董?梯”?臬嚗?5蝑?隞董甈橘?2026-02~04嚗?
- [x] v5.63 撣喳?銝?靽格迤嚗etPayable/?雿?”????/憌???亦?撖血潘?
- [x] v5.64 ??銵冽?雿??券靽格迤嚗amelCase嚗? 摨怠???蝯梯?
- [x] v5.65 ???銵冽?”??嚗echarts嚗? 摨怠??敺耨?寞???+ 餈?0蝑???
- [x] v5.67 蝚砌?璇臭耨甇???怨疏?交??身?券+敹恍??/ 撣喳??遢?身?券+????靽風 / profitLoss.ts 蝣箄?撌脫迤蝣?/ OSInventory.tsx deleteMut 蝣箄?撌脫迤蝣?
- [x] v5.68 蝚砌?璇臭耨甇??manager甈?B?寞? / ???? / 摨怠???30蝑?/ ????50蝑?needsReview / 撣喳??亦??敦頝唾?
- [x] v5.69 鋆?鈭?靽格迤嚗B??purchasing_os/daily_report_os / OSProfitLoss?”+redirect蝣箄? / ?亦??敦蝣箄? / 摨怠???蝣箄? / ????+敺Ⅱ隤Ⅱ隤?
- [x] v5.70 ?雿??蝞耨甇??rebateRate > 1 ?支誑 100嚗? profitLoss 撌脫? channelSales/dailyTrend/procurementCost/isCostEstimated / ?雿?董甈曉? accounting.listRebates + calculateRebates ?? / OSDailyReport ???湔??viewYear/viewMonth
- [x] v5.71 ??銝餃鞎典甈?嚗rocurement list ??franchiseeOrAdminProcedure嚗ranchisee ??storeId?s_stores ?? storeName ?芸?蝭拚嚗SPurchasing ??isFranchisee ?梯?摨蝭拚/?寥??芷/????

---

## ?閬?Leo ????????

| 鞈? | 敺鋆∪??| ?澆? | ?券?| ???|
|------|----------|------|------|------|
| 3/31 ?日?鞈? | ?∟頃鈭箏?? | Excel | 摨怠??箸?暺?| ??撌脣??|
| 憭折漸甇瑕?怨疏 | 憭折漸?鞎典銵?| Excel | 甇瑕?怨疏閮? | ??撌脣?伐?2025/12韏瘀? |
| 撱?撠董?梯” | 憭折漸????撣?| Excel | 甇瑕??撣單狡 | ??撌脣?伐?2026-02韏瘀? |
| ?∟頃?箄疏蝞∠?嚗?025?典僑嚗?| 憭折漸?脣鞎函恣??| Excel | 2025甇瑕鋆? | ??敺?嚗???025/12敺? |
| ?銵?蝝堆???堆? | ?唳?銵雯??臬 | xlsx | ?銵?撣?| ??敺?靘?|

---

## ??璆剖??摩嚗偶銋???

### 靘???憿?
- **A憿??湧?**嚗誨撘??梁/??/蝐唾健/鋆?/蝢?摰?隡臭澈
  ?怨疏??received ???芾???撣單狡嚗?閮澈摮?
- **B憿??芷?嚗?*嚗???摰_?望暑/蝡?/銝?瘜?撅/瘞貉?
  ?怨疏??received ??摨怠?憓? + ??撣單狡
  瘣曇???signed ??摨怠?皜? + ?撣單狡
  ??`os_suppliers.deliveryType='yulian'` ?批嚗?撖急香蝔?蝣?
  > **瘜冽?**嚗憿??迤撘?蝔梁??瘣陸????瘣?嚗s_suppliers ?澈摮絞閮”?誑甇斤皞?

### 摨怠??摩
- **?箸?暺?*嚗?026-03-31 ?日?撌脣?伐?165蝑?reason='3/31?日??箸?暺??嚗?
- ?怨疏??received嚗憿???os_inventory currentQty +嚗神 os_inventory_logs(in)
- 瘣曇???signed嚗憿???os_inventory currentQty -嚗神 os_inventory_logs(out)
- ??隤踵嚗?憛怠???撖?os_inventory_logs(adjust)
- **閫貊璇辣**嚗憿?AND orderDate >= 2026-04-01嚗?/31?歇?怠?箸?暺嚗???閫貊嚗?

### 甇瑕?臬霅
- `os_procurement_orders.sourceType = 'damai_import'`嚗之暻交風?脣?亦???
- `os_payables.sourceType = 'damai_import'`嚗之暻交風?脫?隞董甈?
- `os_inventory_logs.reason LIKE '憭折漸%'` ??`'3/31?日?%'`嚗風?脣?亦?摨怠?閮?
- ?脤?銴嚗鞎典??externalOrderId嚗?隞董甈曄 supplierName+yearMonth+sourceType

### 撣喳????
- ?怨疏??received ??os_payables 蝝臬?嚗?摨銵?generateMonthlyPayables嚗?
- ?銵?蝝啣????autoMatchTransactions ??鈭箏極蝣箄?嚗??芸?璅?嚗?
- ?雿??撱???孵繩1.12撌桅? / 隡臭澈撌桀 / ???菔疏甈橘?os_rebate_rules 摮?DB嚗?
- ?疏隤輯疏 ???? billTransfers ??os_franchisee_payments

### ???賢?閬?
- ?澆?嚗??閬/閮?桐?嚗????曉??ㄐ嚗摮?supplierName嚗?
- ?亙?嚗A銵刻???憭折漸??摮?aliases JSON ???
- needsReview=1嚗之暻亙?交撱箏????鈭箏極蝣箄?嚗?蝡舀?璈??

### os_stores ?撣??蝭?
- ?典??澆?嚗靘?隞暻?{?撣?`嚗?嚗?暺?暻?憭折?摨?
- ?亥岷??敹?撠?name ??CONCAT('靘?隞暻?', shortName) ?踹?銝???
- storeName嚗?摮?雿?瘞賊?摮??storeId ??FK

---

## 蝯行憭扯??閬???

**??閬?嚗蝟餌絞?拍嚗5.77嚗?**
- Railway 隡箸??典? TiDB 鞈?摨怠???UTC
- ??????脰??澈?? UTC嚗new Date()` ??Node.js UTC ?啣??喟 UTC嚗?
- ?垢憿舐內??嚗toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })`
- ?垢 datetime-local 頛詨獢?*霈??*嚗new Date(utcString).getTime() + 8*60*60*1000` ??8 撠?嚗? `toISOString().slice(0,16)`
- ?垢 datetime-local 頛詨獢?*?**嚗?銝脣???`:00+08:00`嚗?憒?`"2026-04-24T15:00"` ??`"2026-04-24T15:00:00+08:00"`嚗?蝡?`new Date()` ?芸?頧?UTC
- ???澆?甇?Ⅱ??嚗getPublishedPosts` WHERE ? `or(isNull(scheduledAt), lte(scheduledAt, now))`嚗?蝡???芰?箇嚗?*銝?閬遙雿?cron ???孛??*
- 甇方???冽?????芯?瘨???????

**shadcn Dialog 銝挾撘?撅閬?嚗5.81 蝣箇?嚗?**
- shadcn `DialogContent` ?箇? className ??`grid`嚗?亙 `flex flex-col` ? tailwind-merge ?質???display嚗? flex sizing嚗flex-1`/`min-h-0`嚗 grid?lex 頧??捆?刻ㄐ銵銝帘摰?
- **甇?Ⅱ??**嚗??摰?Header + ?舀?摰?+ ?箏? Footer??畾萄?????`DialogContent` ?批?銝??蝣箇? `div` ????摰對?
  ```tsx
  <DialogContent className="!max-w-2xl p-0 gap-0 max-h-[90vh]">
    <div className="flex flex-col h-full max-h-[90vh]">
      <DialogHeader className="... shrink-0">...</DialogHeader>
      <ScrollArea className="flex-1 min-h-0 w-full">...</ScrollArea>
      <DialogFooter className="... shrink-0">...</DialogFooter>
    </div>
  </DialogContent>
  ```
- `DialogContent` ?芾?鞎砍?雿?撠箏站嚗lex 銵?勗撅?div ?批
- `ScrollArea` 敹???`min-h-0`嚗? flex 摰孵鋆∩??嗥葬嚗???Footer ???
- `overflow-hidden` **銝? `DialogContent`**嚗??芣 ScrollArea ???
- ??蝮桀?鋆?嚗rounded-*` ??`overflow-hidden` 閬???*?嗅惜 div**嚗???img ?祈澈嚗mg ??`w-full h-full object-cover object-center`

**Make 銝脫嚗?*
- 瘥予 14:55 ?芸??瑁?嚗?? /api/procurement/import
- secret: ordersome-sync-2026
- 撌脩Ⅱ隤迤撣賂?Railway log ??\[Procurement Import\] 閮?嚗?

**?萎辣蝟餌絞嚗?*
- Railway 撠? SMTP嚗odemailer 銝??
- ?剜?銝?靽殷??芸?璆剖??

**DB 瘜冽?鈭?嚗?*
- os_payables.netPayable = totalAmount - rebateAmount嚗 generateMonthlyPayables ????????totalAmount嚗?calculateRebates offset ???
- profitLoss ?雿?? os_rebates.netRebate嚗? os_rebate_records嚗?
- profitLoss 憌??嚗? os_payables ?祕鞈???祕?潘??血?隡啁? 35%嚗?蝡舫＊蝷箸?瘜其?皞?
- profitLoss.ts ?銵函 tenantId嚗amelCase嚗?storeId ?撌脩嚗s_monthly_reports ??storeId 甈?嚗?
- profitLoss ?∟頃?敺?os_payables WHERE month=YYYY-MM ?伐??∟???fallback 35%
- OSInventory.tsx deleteMut 撌脫??inventory.deleteItem嚗eleteTarget/deleteReason state 朣?嚗?
- ?怨疏蝞∠??交??身?箇征嚗?券嚗?敹恍?祇??祆?/銝?/?券???冽?撓?亙椰??
- 撣喳?蝞∠? month ?身?箇征嚗＊蝷箏?冽?隞踝?嚗?雿? mutation嚗eneratePayables/calcRebates/autoMatch/billTransfers嚗 month ?箇征??disabled
- manager 甈??寞?B嚗sModuleDefs ??managerAllowed 甈?嚗??managerAllowed:true ?芋蝯?撠?manager 憿舐內嚗鞎????亙/SOP/閮剖??曹耨/瘥瑼Ｘ銵剁?
- ???銵冽??useEffect role 瑼Ｘ嚗? super_admin 銝 has_procurement_access ??亙???/dashboard
- 摨怠?蝞∠???蝡臬?????30 蝑?蝭拚嚗?????/雿郎??霈???蝵桅?蝣?
- ?????????50 蝑?+ needsReview 敺垢蝭拚嚗sProducts.productList input ??needsReview: z.boolean().optional()嚗?
- ??撣單狡瘥????蝝啜???頝唾? /dashboard/purchasing?supplier=撱???
- OSPurchasing.tsx 霈 URL ?supplier= ??芸?撣嗅撱?蝭拚嚗seSearch + useEffect嚗?
- os_products ??704 蝑?v5.57敺??怠之暻交風?脣?交撱?37蝑?needsReview=1嚗?
- os_products ??`temperature` 甈?銝??剁?皞怠惜摮 `category2`
- **??撣單狡?芸???v5.92嚗?*嚗rocurement.updateStatus received ???upsert os_payables嚗?撱?+?遢蝝臬? totalAmount嚗etPayable=totalAmount-rebateAmount嚗?銝??閬????????隞?generateMonthlyPayables 靽?雿??????/靽格迤撌亙
- **?雿?頂蝯梁絞銝嚗5.86嚗?*嚗SRebate.tsx ?券?寧 accounting 頝舐嚗istRebates/calculateRebates/updateRebate + listPayables/markPayablePaid嚗?osRebate router 靽?雿?蝡臭??孛?潘??雿?Ⅱ隤甈?dialog ??靽格????雿?靘摩鈭???鈭箏極頛詨撖阡???
- os_delivery_orders.toStoreId 撌脫?箏?閮?NULL
- os_franchisee_payments.userId 撌脫?箏?閮?NULL
- packCost = 憭折漸?脰疏?對??湔撠?嚗?銝 unitQty ? unit_cost
- os_daily_reports 甈???camelCase嚗enantId, reportDate, instoreSales, uberSales, pandaSales, guestInstore, guestUber, guestPanda, phoneOrderAmount, deliveryOrderAmount
- os_monthly_reports 甈???camelCase嚗enantId, electricityFee, waterFee, staffSalaryCost, performanceReview, monthlyPlan
- profitLoss ?亙 totalSales = instoreSales+uberSales+pandaSales+phoneOrderAmount+deliveryOrderAmount
- os_inventory.itemValue = currentQty ? unitCost嚗閰Ｘ?閮?嚗?撖阡?甈?嚗?
- profitLoss ?啣? dailyTrend嚗??亥隅?ａ????channelSales嚗楝???拐辣嚗? procurementCost/isCostEstimated
- osRebate.calculate嚗ebateRate > 1 ?隞?100嚗s_suppliers 摮??舐???湔嚗? 10.71 = 10.71%嚗?
- procurement list ?寧 franchiseeOrAdminProcedure嚗erver/_core/trpc.ts ?啣?嚗?franchisee ?芸?蝭拚?芰? storeId?s_stores 撠???撣???
- OSPurchasing.tsx嚗sFranchisee = user.role==='franchisee'嚗???亦祟???寥??芷/?啣??怨疏/??鋆/?臬/?蝑???canEdit ????嚗anEdit ?砍歇? franchisee嚗?
- OSRebate.tsx ??accounting.listRebates嚗 os_rebates嚗? accounting.calculateRebates ??嚗?蝞?雿?神??os_rebates嚗?
- OSDailyReport MonthlyOverviewTab 撟湔? state ?孵???viewYear/viewMonth嚗elect 撌脣?甇交?堆?
- OSProfitLoss 雿輻 recharts嚗reaChart 瘥頞典?ieChart ?楝???arChart 鞎餌蝯?
- **scheduledAt ???澆?嚗5.76 ?寞靽格迤嚗?*嚗etPublishedPosts WHERE 璇辣? `or(isNull(scheduledAt), lte(scheduledAt, now))`嚗tatus=published 銝?蝔?啗??憿舐內?嚗??閬?cron/publishScheduled ??閫貊嚗??嚗B摮TC嚗?蝡舫＊蝷箄??啣?嚗TC+8嚗??????08:00嚗??斗?蝔?null嚗.string().nullable().optional()嚗?
- os_inventory.updatedAt 憿舐內?敺耨?寞????誨 lastCountDate 甈?嚗?
- products.salesCountOffset嚗5.85嚗?蝞∠??∪隤踵??株??詨?蝘駁?嚗??圈＊蝷?= ?祕閮隞嗆 + offset嚗igration 0028 ??Railway ????銵?ADD COLUMN IF NOT EXISTS嚗?
- getHistory LIMIT ?寧 10嚗istoryDialog 憿舐內?? 10 蝑????
- os_stores 銵冽 2026-04-19 ?啣遣嚗 12 ??撣?schema ?銝雿菜??

**os_stores 銵函?瑽?**
```sql
id INT AUTO_INCREMENT PRIMARY KEY
tenantId INT NOT NULL
name VARCHAR(100) NOT NULL        -- ?典?嚗???暺?暻?憭折?摨?
shortName VARCHAR(50)             -- ?剖?嚗??之????
storeCode VARCHAR(20)             -- ???撣誨蝣?
isActive TINYINT DEFAULT 1
createdAt DATETIME
updatedAt DATETIME
INDEX idx_tenant_name (tenantId, name)
```

**?????嚗?*
- ?怨疏??confirmed ???怨疏蝞∠??遣蝡晷頠??????頝唾? /dashboard/delivery
- 瘣曇???signed ??摨怠?皜? + os_franchisee_payments ?芸??Ｙ?
- 撣喳?蝞∠? Tab1 ??撣單狡???蝝啜? 頝唾??怨疏蝞∠?撣嗅??祟??

**銝活??閰望??Ⅱ隤?**
1. `git status` clean
2. `pnpm run build` ?園隤?
3. CLAUDE.md ??歇?湔

---

## 蝟餌絞撣豢

| 撣豢 | ??| 隤芣? |
|------|----|------|
| `HQ_STORE_ID` | `401534` | 摰蝮賡 storeId嚗??犖?⊥??剔 |
| `SYNC_SECRET` | `ordersome-sync-2026` | Make Webhook 撽? |
| `DAYONE_TENANT_ID` | `90004` | 憭扳偶?? tenantId |
| `OS_TENANT_ID` | `1` | 靘?隞暻?tenantId |
| `GMAIL_APP_PASSWORD` | Railway 撌脰身摰?| SMTP ?箏鋡怠???sendMail 撖阡?銝??|

---

## 蝟餌絞?嗆?蝮質汗

**憭??嗆瑽?*
```
摰??嚗??砍嚗?
??? 靘?隞暻潘?tenantId=1嚗??拙?擗??嚗?2??撣?os_stores撌脣遣嚗?
??? 憭扳偶??嚗enantId=90004嚗?隞祥SaaS摰Ｘ

靘?隞暻?ERP 璅∠?嚗?
?∟頃摨怠?嚗鞎?摨怠?/??嚗? 撣喳?鞎∪?嚗董???雿???嚗? ?撣?璆哨??亙/?/??
```

**?銵ㄖ敹急**

| 撅斗活 | ?銵?|
|------|------|
| ?垢獢 | React 19 + TypeScript |
| 頝舐 | Wouter 3 |
| ??恣??| TanStack Query v5 + Zustand 5 |
| UI ?辣 | shadcn/ui嚗adix UI嚗? Tailwind CSS 4 |
| 敺垢獢 | Express 4 |
| API 撅?| tRPC 11 |
| ORM | Drizzle ORM嚗ySQL ?寡?嚗
| 鞈?摨?| TiDB Cloud嚗ySQL ?詨捆嚗
| ???脣? | Cloudflare R2 |
| ?? | 蝬?嚗CPay嚗
| ?芸???| Make嚗ebhook/Scenario嚗

**閮剛?蝟餌絞**
- 摨嚗???`#f7f6f3`嚗蜓?莎?amber `#b45309`
- ?湧?甈??荔?`#1c1917`嚗楛??嚗?
- KPI 摮?嚗???jf-kamabit

---

## 甈??里?貉???瘞訾???嚗?

| 閫 | ?芷 | 雿誥 | 靽格 | ?啣? |
|------|------|------|------|------|
| super_admin | ?臭誑嚗?憛怠???撖?audit log嚗?| ?臭誑 | ?臭誑 | ?臭誑 |
| manager | 銝? | ?臭誑嚗?憛怠??? | ?臭誑嚗神敹怎嚗?| ?臭誑 |

???文?靽格撖?os_audit_logs嚗s_audit_logs 銝鋡怠?扎?

---

## ?銵

- `has_procurement_access` ?垢 any cast 鋆??伐?`useAuth` User ?甇???游?嚗?
- 憭扳偶/靘?隞暻?ERP ??`dy_`/`os_` 銵其???`schema.ts`嚗 raw SQL
- ?祆?????芷蝘餃 R2嚗client/public/images/menu/korean-roll/`嚗?
- chunk size 頞?嚗ndex.js 6453kB嚗?? code splitting

---

## Migration 璅?撽?蝔?嚗?甈∪???

?瑁?隞颱? migration 敺?**敹?** DESCRIBE 蝣箄?甈???摮??TiDB嚗?
```bash
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();
async function check() {
  const url = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: url.hostname, port: parseInt(url.port)||4000,
    user: url.username, password: url.password,
    database: url.pathname.slice(1).split('?')[0],
    ssl: { rejectUnauthorized: false },
  });
  const [rows] = await conn.execute('DESCRIBE 銵典?');
  console.log(rows.map(r => r.Field).join(', '));
  await conn.end();
}
check().catch(console.error);
"
```

> **?**嚗?026-04-18 ??0023 migration ?芸祕?銵?TiDB 蝻?`has_procurement_access` / `last_login_at` ?拇?嚗??渡?亙援瞏啜QL 頝?瘝?臭?蝑甈?撌脣??具?

---

## tRPC Procurement Router 摰 Procedures

- `list` / `create` / `getDetail` / `updateStatus` / `groupBySupplier`
- `pushToLine` / `supplierLineList` / `supplierLineUpsert` / `getSuppliers`
- `deleteOrder`嚗uperAdmin嚗?/ `batchDeleteOrders`嚗uperAdmin嚗?/ `updateNote`
- `updateItem` / `addItem` / `listStoreNames` / `listSupplierNames`
- `getPickList` / `markPrinted` / `importFromDamai`嚗ublic嚗?/ `importFromDamaiExcel`
- `listNeedsReview`

## tRPC Delivery Router 摰 Procedures

- `listDeliveryOrders` / `getDeliveryDetail` / `createDeliveryOrder`
- `createFromProcurement` / `updateStatus` / `getMonthStats`

---

## 憭扳偶敺齒嚗???蝣箄?嚗?

- LIFF 甇?? liffId嚗??遣蝡??芣 `client/src/pages/liff/LiffOrder.tsx` 銝銵?
- 蝛?甈?LINE ?冽?嚗ron ?箇?撌脣遣嚗?撖虫??潮?頛荔?
- Portal 摰Ｘ?身撖Ⅳ email嚗?撽??芣?蝬脣?敺蝙??Resend嚗?

---

## Make ?芸??葡??

- ?撣?銵?Webhook ???湔撖恍?`os_daily_reports`嚗YNC_SECRET 撌脰身嚗?
- ?∟頃 importFromDamai ??銝?韏?Google Sheets
- Make Webhook URL嚗https://hook.us2.make.com/6ihglkavm26i29mdgg33dvxngggv1xiu`
- SYNC_SECRET嚗ordersome-sync-2026`

---

## 撠??箸鞈?

- **蝬脣?**嚗ttps://ordersome.com.tw
- **?函蔡**嚗ailway嚗??CI/CD嚗ush 敺?2-3 ????嚗?
- **鞈?摨?*嚗iDB Cloud嚗ySQL ?詨捆嚗?
- **憟辣蝞∠?**嚗npm 10
- **Git 閬?**嚗ommit ?芰 `git add ??瑼?`嚗?銝 `git add -A`

---

## 敺遣蝵桀之隞餃?嚗?銝剖?甈?蝞∠?蝟餌絞

**?格?**嚗?隞???賢???Ｙ? role ?斗?摩嚗遣蝡?銝剖?甈??批??

**閬??嗆?嚗?*
1. DB ?啣? `os_user_permissions` 銵?
   - `userId, moduleKey, canView, canEdit, canDelete`
2. 敺垢?啣? `permissionMiddleware`嚗?隞?adminProcedure/managerAllowed嚗?
3. ?垢?冽蝞∠?????身摰I嚗恣??臬?瘥?user ??璅∠?
4. `AdminDashboardLayout` ?孵? permissions API 霈?閬芋蝯?銝? hardcode
5. ???Ｙ? `isSuperAdmin`/`isManager`/`canSeeCost` ?斗蝯曹?敺?permissions 霈

**?芸???**嚗2嚗?桀? UAT fix ?券摰?敺銵?
**?摯敶梢蝭?**嚗AdminDashboardLayout.tsx`????OS ERP ???蝡?`trpc.ts`

---

## 敺遣蝵殷??? os_menu_items 銵?

**??**嚗os_menu_items` 鞈?銵典 TiDB 銝??剁?撠 OSCaMenu ??∟???

**?閬?**
1. ?瑁? migration 撱箇? `os_menu_items` ??`os_menu_item_ingredients` 銵?
2. ?臬?暹????鞈?
3. ?臬? `os_products.unitCost` 閮??

**?芸???**嚗2嚗?銝頛芾???
---

## 撠店鈭斗?怠?嚗?026-04-23嚗?銝??閰勗??????臬嚗?

- ??閬?嚗靘??撠店?質??? `CLAUDE.md`嚗蒂?函?擃葉??閬?
- ?祈憚撌脣??蒂 push嚗?
  - commit: `135ca5b`
  - message: `fix: stabilize daily report and shop cart hero buttons`
- ?祈憚撖阡?靽格瑼?嚗?
  - `client/src/pages/dashboard/OSDailyReport.tsx`
  - `client/src/pages/shop/ShopHome.tsx`
  - `client/src/pages/shop/ShopCategory.tsx`
- ?祈憚靽格迤?批捆嚗?
  - `OSDailyReport.tsx` 撌脤???頛帘摰??研?
  - 瘥?亙撌脣??乓?蝞??賂??身?箔?憭押?
  - ?亙????銝憭?/ 隞予 / 敺?憭押翰?瑟???
  - ????隡潮? React 撏拇蔑??憸券 state ?郊撖急?撌脩宏?扎?
  - ??????hero ??頃?抵????賢??賢???嚗歇??`ShopHome.tsx` ??`ShopCategory.tsx` 靽格迤??
- 雿輻???梢?嚗?
  - 銋? `/dashboard/daily-report` ?曄??湔撏拇蔑嚗蝙?刻歇?芾?????研?
  - 雿輻??撣詨???賢援瞏啜??賜??commit / push??閬?嫣???
- ?桀??閬?銝??閰勗???鈭?
  - ?活鈭箏極瑼Ｘ `/dashboard/daily-report` 撖阡???臬甇?虜??
  - ?炎?交?璈?????header / 鞈潛頠???芋?砍?＊蝷箝?
  - ?亥??摰撽?嚗????祆? `node_modules` 蝻箸? / 甈? / build toolchain ?芷??
- ?祆??啣??暹?嚗?
  - `npm run build` ?曉?冽?唬?鞈渡撩瑼?銝??冽璆剖?蝔?蝣潮隤扎?
  - ?暸???`vite` ?曆??啜??隞?dist 瑼撩憭晞indows 甈? / PowerShell / npm cache ????
  - ???舀璈極?琿???嚗?蝑蝬脩???祈澈銝摰???
- 銝???閰梁??圈挾敺??臭誑??雿輻?牧嚗?
  - ??撌脣?霈??`CLAUDE.md` ??銝頛芯漱?伐???撽?瘥?亙??璈??頃?抵?憿舐內嚗?蝜潛?靽柴?

---

## Dayone 2026-04-24 嚙褕充嚙踝蕭嚙踝蕭

- 嚙誕用者要嚙瘩 Dayone 嚙賣接嚙踝蕭T嚙踝蕭嚙緻嚙璀嚙緣嚙羯嚙編嚙磕嚙褕案，嚙踝蕭嚙踝蕭@嚙賠迎蕭嚙踝蕭嚙篇嚙稷 `CLAUDE.md`嚙瘠
- 嚙緩嚙踝蕭嚙踝蕭 Dayone 嚙踝蕭嚙踝蕭u嚙踝蕭嚙踝版嚙踝蕭嚙踝蕭:
  - `client/src/components/DayoneLayout.tsx`
  - `client/src/pages/dayone/driver/DriverLayout.tsx`
  - `client/src/pages/dayone/DayoneDashboard.tsx`
  - `client/src/pages/dayone/DayoneOrders.tsx`
  - `client/src/pages/dayone/DayoneDrivers.tsx`
  - `client/src/components/TenantUserManagement.tsx`
  - `client/src/pages/dayone/DayoneCustomersContent.tsx`
  - `client/src/pages/dayone/DayoneLiffOrders.tsx`
  - `client/src/pages/dayone/DayoneDistricts.tsx`
- 嚙緩嚙論伐蕭 Dayone 嚙緬嚙踝蕭嚙踝蕭 tenant 嚙罷嚙踝蕭:
  - 嚙篁嚙踝蕭 driver 嚙踝蕭嚙踝蕭 `TENANT_ID` 嚙踝蕭 `2` 嚙踝蕭^ `90004`
- 嚙緩嚙論伐蕭/嚙踝蕭嚙賬的 Dayone 嚙誰歹蕭嚙豬選蕭:
  - `server/routers/dayone/dispatch.ts`
    - 嚙諍穿蕭嚙踝蕭嚙褕歹蕭嚙璀嚙踝蕭嚙踝蕭嚙諍伐蕭 AR
    - 嚙瘠嚙盤嚙踝蕭嚙踝蕭嚙踝蕭犰P嚙畿嚙踝蕭嚙踝蕭w嚙編嚙衛寫嚙皚 `dy_stock_movements`
    - 嚙踝蕭s嚙踝蕭嚙踝蕭嚙踝蕭嚙諍時同嚙畿 box ledger 嚙瞑 AR
  - `server/routers/dayone/driver.ts`
    - 嚙緬嚙踝蕭嚙瞇嚙緬嚙踝蕭鵀?delivered 嚙褕會嚙褕鳴蕭/嚙踝蕭s AR
  - `server/routers/dayone/orders.ts`
    - `confirmDelivery` 嚙罵嚙諒對蕭嚙?`paidAmount` 嚙踝蕭嚙確嚙踝蕭s `paymentStatus`
    - 嚙箴嚙瘤嚙褕同嚙畿 upsert AR
- 嚙緩嚙確嚙緹嚙踝蕭 Dayone 嚙緙嚙緹嚙踝蕭嚙瘢:
  - 嚙諍前 repo 嚙踝蕭嚙踝蕭 `pnpm check` 嚙踝蕭嚙稽嚙篌嚙緬嚙皚嚙踝蕭 tRPC typing 嚙踝蕭嚙瘩嚙諉伐蕭嚙諸，嚙踝蕭嚙瞌 Dayone 嚙踝蕭@嚙課組造嚙踝蕭
  - `npm run build` 嚙踝蕭嚙踝蕭嚙範嚙箭嚙踝蕭嚙課缺歹蕭 `estree-walker`
- Dayone 嚙磊嚙瑾嚙畿嚙諒堆蕭嚙線嚙踝蕭:
  - 嚙諄一 `dayone.driver.getMyTodayOrders` 嚙瞑 `dayone.drivers.myOrders`
  - 嚙褕上嚙緬嚙踝蕭嚙諸貨嚙稷嚙緩嚙踝蕭嚙踝蕭嚙踝蕭嚙緙嚙緹嚙瞑 UI
  - 嚙踝蕭i嚙篆簽嚙踝蕭嚙踝蕭B嚙踝蕭嚙踝蕭嚙窯嚙踝蕭嚙畿嚙緬嚙踝蕭嚙踝蕭嚙線嚙踝蕭B嚙褓歹蕭簽嚙踝蕭嚙踝蕭謢剁蕭嚙踝蕭P嚙踝蕭嚙?

- 2026-04-24 嚙衝二嚙踝蕭嚙褕強:
  - `server/routers/dayone/dispatch.ts` 嚙緩嚙踝蕭嚙踝蕭嚙踝蕭g嚙踝蕭嚙踝蕭嚙箭 ASCII 嚙緩嚙踝蕭嚙踝蕭嚙踝蕭嚙璀嚙論免嚙衛碼嚙緝嚙踝蕭伬P router 嚙磐嚙踝蕭C
  - `server/routers/dayone/dispatch.ts` 嚙編嚙磕 `returnInventory`嚙璀嚙踝蕭嚙踝蕭嚙褕上嚙緬嚙踝蕭嚙諸貨嚙稷嚙緩嚙緙嚙緹嚙璀嚙稷嚙緩嚙褕會嚙磕嚙稼 `dy_inventory` 嚙衛寫嚙皚 `dy_stock_movements`嚙璀`refType='dispatch_return'`嚙瘠
  - `server/routers/dayone/dispatch.ts` 嚙踝蕭 `listDispatch` 嚙緩嚙罷嚙踝蕭q嚙踝蕭嚙踝蕭嚙踝蕭d嚙諛己嚙踝蕭嚙踝蕭嚙踝蕭嚙踝蕭A嚙踝蕭嚙璀嚙線嚙踝蕭嚙豬理嚙豎。
  - `server/routers/dayone/dispatch.ts` 嚙踝蕭 `getDispatchDetail` 嚙緹嚙箭嚙罵嚙稷嚙踝蕭 `products` 嚙瘟嚙碼嚙踝蕭A嚙踝蕭K嚙箴嚙豎堆蕭嚙諸貨嚙稷嚙緩嚙踝蕭J嚙瘠
  - `server/routers/dayone/driver.ts`嚙畿`orders.ts`嚙畿`drivers.ts` 嚙緩嚙踝成嚙踝蕭嚙箭嚙箠嚙踝蕭嚙瑾嚙踝蕭嚙踝蕭嚙璀嚙踝蕭嚙踝蕭嚙踝蕭嚙踝蕭嚙瘢嚙衛碼嚙踝蕭嚙羯嚙確嚙踝蕭嚙瘠
  - 嚙緬嚙踝蕭嚙豎已嚙諄一嚙踝蕭嚙諸賂蕭虓嚙踝蕭嚙?`dayone.driver.getMyTodayOrders` 嚙瘩嚙線嚙璀嚙論免嚙瞑嚙褕混嚙踝蕭 `dayone.drivers.myOrders` 嚙瞑嚙踝蕭 `dayone.orders.updateStatus` 嚙緙嚙踝蕭嚙緙嚙緹嚙罷嚙踝蕭嚙瘠
  - 嚙緩嚙踝蕭嚙踝蕭嚙緬嚙踝蕭嚙豎堆蕭嚙磕嚙踝蕭嚙踝蕭:
    - `client/src/pages/dayone/driver/DriverLayout.tsx`
    - `client/src/pages/dayone/driver/DriverHome.tsx`
    - `client/src/pages/dayone/driver/DriverToday.tsx`
    - `client/src/pages/dayone/driver/DriverOrders.tsx`
    - `client/src/pages/dayone/driver/DriverPickup.tsx`
    - `client/src/pages/dayone/driver/DriverDone.tsx`
    - `client/src/pages/dayone/driver/DriverOrderDetail.tsx`
    - `client/src/pages/dayone/driver/DriverWorkLog.tsx`
  - `DriverWorkLog.tsx` 嚙緩嚙踝蕭嚙磕嚙諸貨嚙稷嚙緩 UI嚙璀嚙箠嚙踝蕭嚙踝蕭嚙踝蕭嚙踝蕭擛?蕭嚙踝蕭~嚙踝蕭嚙稷嚙褕庫嚙編嚙璀嚙璀嚙箴嚙碼嚙賡結嚙瘠
  - `client/src/pages/dayone/DayoneDispatch.tsx` 嚙緩嚙賬頁嚙踝蕭嚙踝蕭嚙璀嚙踝蕭X:
    - 嚙諍立穿蕭嚙踝蕭
    - 嚙踝蕭嚙踝蕭嚙踝蕭嚙踝蕭
    - 嚙瘠嚙盤嚙踝蕭嚙緩嚙編
    - 嚙緹嚙褕加嚙踝蕭
    - 嚙諸貨嚙稷嚙緩
  - 嚙緩嚙踝蕭 TypeScript `transpileModule` 嚙緩嚙踝本嚙踝蕭嚙踝蕭嚙踝蕭嚙瘢 Dayone 嚙褕案堆蕭嚙緙嚙糊嚙踝蕭嚙踝蕭嚙課，嚙踝蕭嚙瘦嚙踝蕭 `TRANSPILE_OK`嚙瘠
  - 嚙踝蕭嚙豎恬蕭嚙踝蕭`嚙踝蕭:
    - `dy_ap_records` 嚙諍前嚙踝蕭嚙踝蕭嚙緞嚙踝蕭A嚙罵嚙踝蕭嚙褕級佗蕭嚙諒剁蕭嚙踝蕭嚙諉歹蕭/嚙踝蕭J嚙窯嚙踝蕭b嚙踝蕭嚙踝蕭
    - 嚙罵嚙踝蕭嚙踝蕭狾嚙?Dayone 嚙瘩嚙踝蕭嚙磕嚙踝蕭嚙踝蕭嚙踝蕭嚙踝蕭r嚙緣嚙諄化清嚙羯嚙稷嚙踝蕭嚙賬中嚙踝蕭
    - repo 嚙踝蕭嚙踝蕭 `pnpm check` / `npm run build` 嚙踝蕭嚙踝蕭嚙皚嚙踝蕭嚙瞎嚙論堆蕭嚙瘩嚙緞嚙確嚙璀嚙踝蕭嚙賞直嚙踝蕭嚙踝蕭嚙諉瘀蕭 Dayone 嚙踝蕭珩敓嚙踝蕭嚙踝蕭嚙踝蕭嚙?

## Dayone 2026-04-24 第三輪補強

- 依使用者要求，Dayone 交接與改動紀錄持續只寫入 CLAUDE.md，不另開 handoff 檔。
- 2026-04-24 已再次完成 Dayone 高風險頁面語法驗證，以下頁面用 TypeScript 	ranspileModule 檢查皆為 FILE_OK:
  - client/src/pages/dayone/DayoneProducts.tsx
  - client/src/pages/dayone/DayoneInventoryContent.tsx
  - client/src/pages/dayone/DayonePurchaseContent.tsx
  - client/src/pages/dayone/DayoneUsers.tsx
  - client/src/pages/dayone/DayoneDispatch.tsx
- 2026-04-24 
pm run build 再次成功，代表目前 Dayone 這批前後端改動至少通過正式 production build，不是停留在理論可行。
- 本輪補齊 Dayone 舊樣式/舊文字頁面重做:
  - client/src/pages/dayone/DayoneProducts.tsx
  - client/src/pages/dayone/DayoneInventoryContent.tsx
  - client/src/pages/dayone/DayonePurchaseContent.tsx
  - client/src/pages/dayone/DayoneUsers.tsx
- 目前可以較高信心判斷 Dayone 模組不會因這批改動在 build 階段崩潰；但 repo 全域 pnpm check 仍有既有型別錯誤，不能把全站型別紅字全部歸咎於 Dayone。
- 後續主軸:
  - 先把 Dayone 低頻頁面殘留舊樣式繼續清完
  - 再往上游進貨簽收、AP 彙總、供應商月結邏輯補齊
  - 最後才進細節視覺微調與列印單優化

## Dayone 2026-04-24 首頁白畫面事故紀錄

- 使用者回報 ordersome.com.tw 出現整站白畫面，優先級提升為 production incident。
- 已先停止往下追加新功能，改為事故排查。
- 排查方向改為全站首頁與 App 啟動鏈，而不是只看 Dayone，因為白畫面發生在 /。
- 已發現 client/src/pages/Home.tsx 存在嚴重內容污染風險，為避免首頁 runtime render 失敗，已整頁重寫為乾淨穩定版本。
- 2026-04-24 事故修復後再次驗證:
  - client/src/pages/Home.tsx TypeScript 	ranspileModule = HOME_TRANSPILE_OK
  - 
pm run build = success
- 後續文件要求補強:
  - Dayone 各頁面跳轉邏輯、資料流、未來新增節點掛接方式，要持續記錄在 CLAUDE.md 或既有相關文件
  - 不只記錄 UI 改動，也要記錄流程節點、資料來源、狀態變化與下游影響
- 下一步主軸:
  - 先確認首頁白畫面 hotfix 已上線
  - 接著補 Dayone 頁面地圖、頁面跳轉邏輯、真實作業流程對照
  - 再繼續補上游進貨/AP 彙總與低頻頁面清理

## 2026-04-24 Chunk 熱修復

- 使用者回報 /dashboard/admin/products 等多個 lazy route 全白。
- 排查後確認 repo 近期確實有 manualChunks + 大量 React.lazy 調整歷史，且 commit 歷史存在反覆 reapply / revert，屬高風險部署項。
- 為優先恢復線上穩定性，已先將 ite.config.ts 內自訂 
ollupOptions.output.manualChunks 全數移除，回退到保守單一 chunk 策略，避免 Railway / CDN / 快取 / chunk 對不上造成白畫面。
- 本次處置原則:
  - 先恢復可用
  - 再重新規劃 chunk 策略
  - 未取得 Railway log 與瀏覽器 console 前，不再冒進做進一步拆包

## Dayone 2026-04-24 頁面邏輯與流程地圖

### 一、管理端頁面主線
- /dayone
  - 角色: 大永管理總覽首頁
  - 功能: 看今日訂單、待簽收進貨、已送達、異常、金額與庫存警示
  - 下游影響: 作為訂單、派車、進貨、帳務的入口
- /dayone/orders
  - 角色: 訂單池
  - 來源: LIFF、Portal、管理員代建單
  - 功能: 查詢、建立、修改、確認配送資訊
  - 下游影響: 派車單生成的來源資料
- /dayone/customers
  - 角色: 客戶主檔
  - 功能: 管理下游商家、電話、地址、月結條件、區域歸屬
  - 下游影響: 訂單、派車、應收帳
- /dayone/drivers
  - 角色: 司機主檔
  - 功能: 管理司機、車牌、聯絡方式、帳號
  - 下游影響: 派車與司機端登入流程
- /dayone/products
  - 角色: 品項主檔
  - 功能: 管理蛋品品項、單位、價格、啟用狀態
  - 下游影響: 訂單、進貨、庫存、帳務
- /dayone/inventory
  - 角色: 庫存總覽
  - 功能: 看現有庫存、警示、異動紀錄
  - 下游影響: 派車扣庫、回庫、進貨入庫
- /dayone/purchase
  - 角色: 採購與供應商進貨管理
  - 功能: 看供應商與進貨相關資料
  - 下游影響: 進貨簽收、AP
- /dayone/districts
  - 角色: 區域與配送星期規則
  - 功能: 定義配送區域、配送星期、排序優先權
  - 下游影響: 派車規劃與路線歸組
- /dayone/liff-orders
  - 角色: LIFF 訂單入口查核頁
  - 功能: 看 LIFF 進單狀況與訂單內容
  - 下游影響: 回流到訂單池
- /dayone/dispatch
  - 角色: 派車工作台
  - 功能: 建立派車、列印、臨時加站、查看派車明細、剩貨回庫
  - 下游影響: 扣庫存、司機配送、應收帳、司機現金日結
- /dayone/purchase-receipts
  - 角色: 進貨簽收
  - 功能: 上游簽名、入庫、進貨異動
  - 下游影響: 庫存增加、AP 明細
- /dayone/ar
  - 角色: 應收帳款
  - 功能: 看客戶未收、已收、逾期、付款狀態
  - 下游影響: 對帳與催收
- /dayone/users
  - 角色: 帳號管理
  - 功能: 管理管理員、員工、司機帳號
  - 下游影響: 權限與登入

### 二、客戶端與司機端主線
- /dayone/portal/*
  - 角色: 下游客戶入口
  - 功能: 下單、看對帳、看帳戶資料
  - 主流程: 客戶下單 -> 回寫 dy_orders
- /driver/*
  - 角色: 司機手機工作台
  - 主流程: 今日配送 -> 撿貨 -> 送貨 -> 簽名/收款 -> 回庫 -> 日結
  - 關鍵頁:
    - /driver/today: 今日任務總覽
    - /driver/orders: 訂單與停靠點清單
    - /driver/order/:id: 單筆配送、簽名、收款
    - /driver/pickup: 撿貨 / 上車作業
    - /driver/done: 已完成配送
    - /driver/worklog: 現金、剩貨回庫、日結

### 三、真實作業流程對照
1. 上游供應商進貨
- 現場簽收後進貨入庫
- 系統應同步: 增加庫存、寫庫存異動、建立供應商 AP 明細
- 目前已完成到「入庫 + AP 明細」，後續要補供應商日/月彙總視角

2. 下游訂單進入
- 來源可為 LIFF、Portal、人工代建
- 系統統一進訂單池 dy_orders
- 後續由管理端整併派車

3. 派車與出車
- 依日期、區域、司機生成派車單
- 列印派車單時進行正式扣庫
- 司機依派車單撿貨並出車
- 目前已完成「列印扣庫」與「派車工作台」

4. 司機配送與簽收
- 客戶簽名、現收或月結狀態回傳
- 系統應在送達後形成或更新 AR
- 目前已調整為接近這個時點，不再於建立派車時提早建立 AR

5. 司機剩貨回庫
- 若車上有剩貨，回倉後需回補庫存
- 系統應同步: 庫存增加、寫庫存異動、保留日結痕跡
- 目前已補上 
eturnInventory

### 四、後續新增節點的原則
- 新節點一律先判斷它屬於哪一條主線:
  - 訂單主線
  - 進貨主線
  - 派車配送主線
  - 帳務主線
- 新節點若會改數量、金額或狀態，必須明記:
  - 資料來源
  - 觸發時點
  - 影響資料表
  - 會不會改庫存
  - 會不會改 AR/AP
- 不能只加畫面不加流程說明，避免後續頁面越做越多但資料聯動失真

### 五、目前仍需補完的事項
- 供應商 AP 日結 / 月結彙總
- 臨時加貨的補單與差異對帳
- 庫存更完整的三段式狀態: 可用 / 已派車 / 回庫待驗
- 派車單、撿貨單、簽收單的列印格式優化
- 低頻 Dayone 頁面殘留舊文案與舊版型持續清理

## Dayone 2026-04-24 第四輪補齊

- 本輪依使用者指定順序執行:
  - 1. 先清殘留英文與舊樣式頁面
  - 2. 再補 CLAUDE.md 流程與擴充規則
  - 3. 最後補上游 AP 彙總邏輯
- 已重寫並清乾淨的頁面:
  - `client/src/pages/dayone/DayonePurchaseReceipts.tsx`
  - `client/src/pages/dayone/DayoneARContent.tsx`
  - `client/src/pages/dayone/DayoneCustomersContent.tsx`
  - `client/src/pages/dayone/driver/DriverPickup.tsx`
- `DayonePurchaseReceipts.tsx` 本輪變更:
  - 補上手機與桌面一致的進貨簽收工作台
  - 建立收貨單後仍維持「供應商簽名 -> 入庫 -> 建 AP」原功能
  - 新增本月供應商應付快照，讓進貨頁可直接看 AP 聚合，不必再靠腦內對帳
  - 進貨頁畫面全面改成乾淨中文，避免亂碼與英中混雜
- `DayoneARContent.tsx` 本輪變更:
  - 應收帳款、司機日報、月結對帳三個 tab 全面改為乾淨中文與一致版型
  - 保留收款、異常解決、建立司機日報、匯出 Excel、列印月結等既有功能
  - 把「逾期客戶 / 未收金額 / 司機現金異常」這些管理資訊直接拉到可讀狀態
- `server/routers/dayone/ap.ts` 本輪變更:
  - 新增 `dayone.ap.summary`
  - summary 輸入: `tenantId`, `supplierId?`, `month?`
  - summary 輸出:
    - `overview`: 供應商數、應付總額、已付、未付、逾期筆數
    - `suppliers`: 各供應商於該月的簽收單數、帳款筆數、總額、未付、最近到期日
  - 目的: 讓上游進貨簽收後的 AP 不再只是逐筆明細，而是先有日/月彙總入口

## Dayone 2026-04-24 擴充節點規則補充

- 後續如果再加節點，例如:
  - 供應商付款單
  - 臨時加貨補單
  - 司機車載庫存
  - 客戶退貨或回箱
  - 對帳核銷
- 一律先寫清楚這五件事再開發:
  - 節點屬於哪條主線
  - 觸發時點是建立、列印、簽名、送達還是回庫
  - 會動到哪些資料表
  - 是否影響庫存數量
  - 是否影響 AR / AP
- Dayone 目前推薦主線拆法:
  - 訂單主線: `dy_orders`
  - 派車配送主線: `dy_dispatch_orders`, `dy_dispatch_items`
  - 進貨主線: `dy_purchase_receipts`
  - 庫存主線: `dy_inventory`, `dy_stock_movements`
  - 帳務主線:
    - 下游應收 `dy_ar_records`
    - 上游應付 `dy_ap_records`
- 若未來再做 chunk / lazy route 優化:
  - 先確認 Railway 部署與瀏覽器 runtime log
  - 不可直接重上全站 manualChunks
  - 任何拆包都必須先驗證首頁與 Dayone 主路由 `/dayone/*` 不白畫面

## Dayone 2026-04-24 對話轉移提示

### 目前已確認
- 2026-04-24 最新已 push commit: `259a792` `feat: polish dayone finance and purchase workflows`
- 本輪已通過 `npm run build`
- 白畫面主事故已修復，且本輪沒有重新打開高風險 `manualChunks`
- 已重做並清理的重要頁面:
  - `client/src/pages/dayone/DayonePurchaseReceipts.tsx`
  - `client/src/pages/dayone/DayoneARContent.tsx`
  - `client/src/pages/dayone/DayoneCustomersContent.tsx`
  - `client/src/pages/dayone/driver/DriverPickup.tsx`
- 已新增上游 AP 彙總 API:
  - `server/routers/dayone/ap.ts` -> `dayone.ap.summary`

### 必須老實告知下一個對話框的事項
- 目前不能說「整個網站 100% 沒問題」
- 目前能高信心說的是:
  - build 有過
  - 白畫面主事故已壓下來
  - Dayone 進貨/帳務/客戶/司機撿貨主線已比之前穩很多
- 目前還不能視為完全結案的原因:
  - 這輪沒有逐頁人工 smoke test 全 Dayone / 全站所有路由
  - `pnpm check` 仍有 repo 舊型別問題，不能當成 Dayone 單獨回歸驗證
  - 上游 AP 雖已補彙總入口，但仍不是完整付款核銷流
  - 臨時加貨補單、庫存三段式、供應商付款單都還沒補完

### 目前邏輯狀態判斷
- 已較符合真實作業的部分:
  - 上游進貨: 建單 -> 供應商簽名 -> 入庫 -> 建 AP 明細
  - 下游應收: 送達後形成 / 更新 AR，而不是派車一建立就先認列
  - 司機流程: 撿貨 -> 配送 -> 簽收 / 收款 -> 剩貨回庫 -> 日結
  - 進貨頁可直接看供應商月度 AP 聚合，不再只剩逐筆明細
- 尚未完全閉環的部分:
  - 供應商付款單 / AP 核銷明細
  - 臨時加貨補單與差異對帳
  - 庫存三段式狀態: 可用 / 已派車 / 回庫待驗
  - 低頻頁面殘留中文化與一致性掃描

### 下一個對話框建議直接接續的提示
請先讀 `CLAUDE.md` 最後幾段「Dayone 2026-04-24 第四輪補齊」與「Dayone 2026-04-24 對話轉移提示」，然後接著做以下事情，不要重做已完成頁面:
1. 先做 Dayone 逐頁 smoke test 規劃與關鍵路由檢查，優先 `/dayone`, `/dayone/orders`, `/dayone/customers`, `/dayone/dispatch`, `/dayone/purchase-receipts`, `/dayone/ar`, `/driver/*`
2. 補上游 AP 真正付款 / 核銷流程與前端頁面入口，不只 summary
3. 補臨時加貨補單與差異對帳流程
4. 規劃庫存三段式狀態，但不要再冒進做高風險 chunk 拆包
5. 所有新增節點都必須寫回 `CLAUDE.md`，說清楚主線、觸發時點、資料表、庫存影響、AR/AP 影響

### 下一步優先順序
- 第一優先: 驗證，不要先追新功能
- 第二優先: AP 付款核銷
- 第三優先: 臨時加貨補單
- 第四優先: 庫存三段式
## Dayone 2026-04-24 第五輪視覺系統補強

- 本輪依使用者要求，不只修單頁，而是往整個 Dayone 後台的精品感與一致性提升。
- 已先建立可跨品牌沿用的後台視覺規範文件:
  - docs/backoffice-visual-system-v1.md
- 這份規範目前定下的共用原則:
  - 後台主標題以穩定可讀的 UI 字體為主，不再依賴過度強勢的品牌字
  - 色彩以暖白 / 石墨 / amber 為核心，強調色只用在重點，不鋪滿全頁
  - 畫布寬度、卡片圓角、陰影、表格表頭、空狀態統一成同一套節奏
  - 同一套規範未來可延伸到宇聯與來點什麼後台，不必每次重新摸索
- 本輪已實作的共用視覺層:
  - client/src/index.css
  - client/src/components/DayoneLayout.tsx
- 本輪已往新視覺系統靠攏的頁面:
  - client/src/pages/dayone/DayoneDashboard.tsx
  - client/src/pages/dayone/DayoneOrders.tsx
  - client/src/pages/dayone/DayoneCustomersContent.tsx
  - client/src/pages/dayone/DayoneLiffOrders.tsx
- 本輪視覺補強重點:
  - 側邊欄 header、使用者區塊、active 狀態改成更成熟的營運後台質感
  - 共用 hero / stat card / surface card / table shell / empty state 已建立
  - LIFF 訂單頁不再是英文佔位感，而是納入 Dayone 同一套資訊層次
- 注意:
  - 這輪主體是視覺系統與版型提升，不涉及 Dayone 主流程邏輯改寫
  - 若後續新增宇聯或來點什麼後台頁面，優先引用 docs/backoffice-visual-system-v1.md 與既有 token/class
## OrderSome 2026-04-24 首頁入口與品牌首頁第一輪重構

- 本輪依使用者最新要求，修改範圍包含:
  - 最外層首頁入口流程 `client/src/pages/Home.tsx`
  - 開場過場動畫 `client/src/components/LogoIntro.tsx`
  - 來點什麼前台首頁 `client/src/pages/brand/BrandHome.tsx`
  - 來點什麼共用外框 `client/src/components/layout/BrandLayout.tsx`
  - 來點什麼共用導覽與頁尾 `client/src/components/layout/BrandHeader.tsx` `client/src/components/layout/BrandFooter.tsx`
- 本輪明確不動的範圍:
  - 宇聯官網內頁內容先不修改，只保留首頁入口卡片與導流存在
- 本輪設計方向:
  - 來點什麼走黃 / 米白 / 石墨灰主軸，不走俗亮黃，也不走難閱讀的過度裝飾
  - 參考更有節奏與動感的品牌首頁語法，但不直接照抄外部網站
  - 重點是先把版型張力、留白、卡片層次、標題節奏與品牌情緒拉起來
- 本輪已落地的重點:
  - 首頁入口改成更清楚的雙品牌分流，並把來點什麼作為主要視覺焦點
  - 原本較醜的開場動畫改成較短、較乾淨、低風險的品牌卡片式過場
  - 來點什麼首頁改成可延伸的品牌型 landing page，並預留多個圖片區塊給後續素材進場
  - Header / Footer / 背景畫布同步拉到一致語言，避免入口與內頁像不同站
- 圖片與動畫策略:
  - 本輪先預留圖片 slot，不硬塞假圖
  - 後續若使用者提供實拍、餐點或門市素材，可在既有 slot 上補 hover、漂浮貼紙、局部 glow、進場動畫
- 驗證狀態:
  - `npm run build` 已通過
  - 這輪尚未做完整人工逐頁視覺 smoke test
- 下一輪建議優先順序:
  1. 先人工檢查 `/`, `/brand`, `/brand/menu`, `/brand/stores`, `/brand/franchise`
  2. 依實際圖片素材補首頁 hero、餐點區、footer 圖像模組
  3. 再把 BrandMenu / BrandStores / BrandFranchise 視覺語言往同一套系統收斂
## OrderSome 2026-04-24 第二輪去 AI 感與前台收斂

- 使用者明確指出上一版最大問題不是功能，而是首頁入口與來點什麼前台整體有很重的 AI 感。
- 這輪已依使用者反饋做減法，不再用「解釋型文案」或自我描述式設計術語。
- 使用者指定要改的首頁關鍵字句:
  - 開場與首頁主標調整為「台韓兩味，混搭就對」
  - 移除 `Brand x Corporate x Commerce` 類型文字
  - 移除類似「一邊是更年輕、更有節奏...」這種不會出現在真品牌首頁的句子
- 這輪已重做或收斂的頁面:
  - `client/src/pages/Home.tsx`
  - `client/src/components/LogoIntro.tsx`
  - `client/src/components/layout/BrandHeader.tsx`
  - `client/src/components/layout/BrandFooter.tsx`
  - `client/src/pages/brand/BrandHome.tsx`
  - `client/src/pages/brand/BrandMenu.tsx`
  - `client/src/pages/brand/BrandStores.tsx`
  - `client/src/pages/brand/BrandFranchise.tsx`
  - `client/src/pages/brand/BrandStory.tsx`
  - `client/src/pages/brand/BrandNews.tsx`
- 這輪的實際調整方向:
  - 文案更短、更像品牌自己會講的話
  - 保留黃 / 米白 / 石墨灰，但拿掉過度自我解釋與樣板式設計詞
  - 入口頁與品牌站共用語氣，不再像兩個不同提案拼在一起
  - 仍保留圖片 slot，但用更低存在感的方式呈現，避免 mockup 感過重
- 驗證:
  - `npm run build` 已再次通過
- 後續若還要再往參考站靠近，應優先補:
  1. 真實餐點 / 門市 / 人物圖
  2. 更細的 hover / sticker / 進場動態
  3. 品牌首頁單一主視覺敘事，而不是再加更多說明文字
## OrderSome 2026-04-24 前台回退紀錄

- 使用者明確要求將首頁入口與來點什麼前台回退到未修改前的樣子，並指定 Dayone 不要動。
- 本次回退範圍:
  - `client/src/pages/Home.tsx`
  - `client/src/components/LogoIntro.tsx`
  - `client/src/components/layout/BrandLayout.tsx`
  - `client/src/components/layout/BrandHeader.tsx`
  - `client/src/components/layout/BrandFooter.tsx`
  - `client/src/pages/brand/BrandHome.tsx`
  - `client/src/pages/brand/BrandMenu.tsx`
  - `client/src/pages/brand/BrandStores.tsx`
  - `client/src/pages/brand/BrandFranchise.tsx`
  - `client/src/pages/brand/BrandStory.tsx`
  - `client/src/pages/brand/BrandNews.tsx`
- 回退基準:
  - 使用 `5c6a57b` 這個尚未開始改 OrderSome 前台的穩定點做 restore
- 驗證:
  - `npm run build` 已通過
- 注意:
  - 本次是前台視覺整包回退，不涉及 Dayone 後台視覺系統的回退`r`n## Dayone 2026-04-24 第六輪邏輯補強

- 本輪先不擴大新頁面，而是補 Dayone 已有主線的真實邏輯缺口。
- 已新增文件:
  - docs/system-boundary-matrix-v1.md
  - 用來明確區分宇聯 / 來點什麼 / 大永哪些共用、哪些必須分開，後續開發先以 Dayone 獨立產品線處理。
- 已補 Dayone AP 付款工作台:
  - client/src/pages/dayone/DayonePurchaseReceipts.tsx
  - 在進貨簽收頁直接新增 AP 付款核銷區，可查看供應商應付、已付、未付、到期日，並直接進行付款。
- 已修正 Dayone 收付款分次核銷邏輯:
  - server/routers/dayone/ap.ts
  - server/routers/dayone/ar.ts
  - 原本 markPaid 會直接覆蓋 paidAmount，現在改為累加式更新，分次付款不會再把前一次已付金額洗掉。
- 驗證:
  - 
pm run build 已通過
- 目前 Dayone 主線狀態:
  - AP 已從只有 summary 進展到可直接付款核銷
  - AR / AP 的部分付款邏輯已較符合真實作業
  - 尚未完成的下一步仍是: 臨時加貨補單、差異對帳、庫存三段式、逐頁 smoke test
## Dayone 2026-04-24 對話轉移提示（最新）

### 目前最新狀態
- 最新已 push commit: 1242b34 eat: strengthen dayone payment workflows
- 本輪已通過 
pm run build
- 已新增文件:
  - docs/system-boundary-matrix-v1.md
- 已完成的 Dayone 補強:
  - client/src/pages/dayone/DayonePurchaseReceipts.tsx
    - 新增 AP 付款工作台
    - 可直接查看供應商應付 / 已付 / 未付 / 到期日
    - 可直接開付款核銷 dialog
  - server/routers/dayone/ap.ts
    - markPaid 改為累加式付款，不再覆蓋前次已付金額
  - server/routers/dayone/ar.ts
    - markPaid 改為累加式收款，不再覆蓋前次已收金額

### Dayone 目前已完成到哪
- 上游進貨主線較完整:
  - 建單 -> 供應商簽名 -> 入庫 -> 建 AP -> AP 可付款核銷
- 下游應收主線較完整:
  - 送達後形成 / 更新 AR -> 可分次收款
- 司機主線已比之前穩:
  - 撿貨 -> 配送 -> 簽收 / 收款 -> 剩貨回庫 -> 日結

### Dayone 還沒完成的重點
- 逐頁 smoke test 還沒完整做完
- 臨時加貨補單與差異對帳還沒做
- 庫存三段式狀態 可用 / 已派車 / 回庫待驗 還沒做
- 供應商付款單完整閉環仍可再細化，但目前已先有 AP 付款工作台

### 下一個對話框必須先做的順序
1. 先讀 CLAUDE.md 最後兩段 Dayone 交接，不要憑印象亂做
2. 先做 Dayone 關鍵路由 smoke test 規劃與檢查，優先:
   - /dayone
   - /dayone/orders
   - /dayone/customers
   - /dayone/dispatch
   - /dayone/purchase-receipts
   - /dayone/ar
   - /driver/*
3. 再做「臨時加貨補單與差異對帳」
4. 再規劃「庫存三段式狀態」
5. 每新增一個節點，都要寫回 CLAUDE.md

### 對下一個對話框的硬性提醒
- 不要動 OrderSome / 宇聯前台，現在主線是先把 Dayone 做完
- 不要碰高風險 chunk / lazy route 拆包
- 不要自作主張大改視覺，現在優先是邏輯閉環與驗證
- 不能說系統 100% 沒問題，必須老實區分「已驗證」和「尚未驗證」
- 每做一輪都要 uild 驗證
- 有 commit / push 才能算真正交付

### 使用者習慣與合作規則
- 使用者非常在意有沒有嚴格遵守 CLAUDE.md
- 使用者不喜歡 AI 感很重的文案、設計、說法
- 使用者要的是直接做，不要空談太久
- 但如果是高風險決策，仍要先停一下確認，不可亂猜
- 使用者很在意:
  - 有沒有 commit
  - 有沒有 push
  - 有沒有更新 CLAUDE.md
- 如果你說「改好了」，但沒有 push，使用者會直接認定沒有完成
- 回報要誠實，不能把「build 有過」講成「全站都驗證完」

### 可直接貼給下一個對話框的起手提示
請先讀 CLAUDE.md 最後一段「Dayone 2026-04-24 對話轉移提示（最新）」並嚴格遵守，現在不要動 OrderSome / 宇聯前台，先把 Dayone 做完。請先從 Dayone 關鍵路由 smoke test 規劃與檢查開始，接著做臨時加貨補單與差異對帳流程。所有新增節點都要寫回 CLAUDE.md，每輪都要跑 
pm run build 驗證，完成後一定要 commit、push，不能只改本機。請誠實區分「已驗證」與「尚未驗證」，不要亂說 100% 沒問題，也不要做高風險 chunk 拆包。

## Dayone 2026-04-24 progress note (this round)
- Scope kept on Dayone only. OrderSome / ???? not touched.
- Smoke-test planning/check notes written in docs/dayone-smoke-test-and-stock-plan-2026-04-24.md.
- Static route review covered: /dayone, /dayone/orders, /dayone/customers, /dayone/dispatch, /dayone/purchase-receipts, /dayone/ar, /driver/*.
- Added dispatch supplement support in server/routers/dayone/dispatch.ts:
  - manualAddStop can now optionally create a dispatch_supplement order with dy_order_items.
  - Dispatch item now links to created orderId when supplement items exist.
- Added purchase receipt anomaly reconciliation flow:
  - server/routers/dayone/purchaseReceipt.ts -> reconcileAnomaly
  - client/src/pages/dayone/DayonePurchaseReceipts.tsx -> reconcile dialog + action entry
- Added dispatch-side temporary supplement inputs in client/src/pages/dayone/DayoneDispatch.tsx without changing route/chunk structure.
- Fixed dashboard anomaly KPI in client/src/pages/dayone/DayoneDashboard.tsx to use status === 'anomaly'.
- Inventory 3-stage status is only planned this round, not fully implemented yet.

### Verified this round
- npm run build passed after the above changes.
- Static code/path review was completed for the listed Dayone routes.

### Not fully verified yet
- No full manual click-through smoke test across every listed route yet.
- No end-to-end real data verification for supplement order -> dispatch -> reconciliation chain yet.
- Inventory 3-stage state is still a plan, not a completed logic rollout yet.




