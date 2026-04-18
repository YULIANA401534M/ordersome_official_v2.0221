import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

config();

const url = new URL(process.env.DATABASE_URL);
const conn = await createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 4000,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1).split('?')[0],
  ssl: { rejectUnauthorized: false },
});

const updates = [
  {
    "supplier": "廣弘",
    "original": "東豪-勁辣雞腿(特大)10片/包",
    "final_name": "勁辣雞腿(特大)10片/包",
    "changed": true
  },
  {
    "supplier": "一豆實業",
    "original": "米漿_2500ml/包",
    "final_name": "米漿_2500ml",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "立芳-厚切牛肉堡20片/包",
    "final_name": "厚切牛肉堡20片/包",
    "changed": true
  },
  {
    "supplier": "一豆實業",
    "original": "無糖豆漿2500ml/包",
    "final_name": "無糖豆漿2500ml",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "合茂-黑胡椒豬排20片/盒",
    "final_name": "黑胡椒豬排20片/箱",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "食伯樂濃湯粉1kg/包",
    "final_name": "食伯樂濃湯粉1kg",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "(府)韓式辣豬排",
    "final_name": "韓式辣豬排/盒",
    "changed": true
  },
  {
    "supplier": "裕展",
    "original": "純綠茶包24入/袋",
    "final_name": "純綠茶包24入",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "憶-勁辣雞肉片1kg/包",
    "final_name": "勁辣雞肉片1kg/包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "東豪-香燻雞肉片1kg/包",
    "final_name": "香燻雞肉片1kg/包",
    "changed": true
  },
  {
    "supplier": "裕展",
    "original": "凍頂烏龍茶25g*20包/袋",
    "final_name": "凍頂烏龍茶25g*20包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "(A)香燻雞肉片1kg/包(胸)",
    "final_name": "香燻雞肉片1kg/包(胸)/包",
    "changed": true
  },
  {
    "supplier": "裕展",
    "original": "奶香金萱茶_25*20包/袋",
    "final_name": "奶香金萱茶_25*20包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "(A)香燻雞肉片1kg/包(腿)",
    "final_name": "香燻雞肉片1kg/包(腿)/包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "紅龍-照燒燻雞腿-12片/包",
    "final_name": "照燒燻雞腿-12片/包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "富統-五花培根1kg",
    "final_name": "五花培根1kg/包",
    "changed": true
  },
  {
    "supplier": "美食家",
    "original": "富統-五花培根1kg",
    "final_name": "五花培根1kg/包",
    "changed": true
  },
  {
    "supplier": "裕展",
    "original": "奶香金萱茶_50入/袋",
    "final_name": "奶香金萱茶_50入",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "憶家鄉-大火腿切片3kg/條",
    "final_name": "大火腿切片3kg/條",
    "changed": true
  },
  {
    "supplier": "開元",
    "original": "花香甜橘咖啡豆_1磅/袋",
    "final_name": "花香甜橘咖啡豆_1磅",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "(古堡)大火腿1kg/包",
    "final_name": "大火腿1kg/條",
    "changed": true
  },
  {
    "supplier": "開元",
    "original": "杏仁黑可可咖啡豆_1磅/袋",
    "final_name": "杏仁黑可可咖啡豆_1磅",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "(大成)香雞堡50片/包",
    "final_name": "香雞堡50片/包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "廣弘正點韓式炸雞",
    "final_name": "韓式炸雞/包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "強匠優質雞塊_1kg*12包/箱",
    "final_name": "優質雞塊_1kg*12包/包",
    "changed": true
  },
  {
    "supplier": "伯享",
    "original": "可可巧克力-1kg/包",
    "final_name": "可可巧克力-1kg",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "骰子雞球_1kg*12包/箱",
    "final_name": "骰子雞球_1kg*12包/包",
    "changed": true
  },
  {
    "supplier": "伯享",
    "original": "抹茶拿鐵-1kg/包",
    "final_name": "抹茶拿鐵-1kg",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "G2200特級預炸薯條_2.27kg/包",
    "final_name": "特級預炸薯條_2.27kg/包",
    "changed": true
  },
  {
    "supplier": "伯享",
    "original": "地瓜拿鐵-1kg/包",
    "final_name": "地瓜拿鐵-1kg",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "台糖二砂糖50kg/袋",
    "final_name": "台糖二砂糖50kg",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "(M)辣味薯球911892<1.5KG>",
    "final_name": "辣味薯球911892<1.5KG>/包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "乳瑪琳440g/罐",
    "final_name": "乳瑪琳440g",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "RICOS起司醬-3KG/罐",
    "final_name": "RICOS起司醬-3KG",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "鄉村93細薯2KG",
    "final_name": "鄉村93細薯2KG/包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "梨山花生醬(細滑)_2.8kg/罐",
    "final_name": "梨山花生醬(細滑)_2.8kg",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "滿味細薯_2KG",
    "final_name": "滿味細薯_2KG/包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "梨山草莓醬_3.2kg/罐",
    "final_name": "梨山草莓醬_3.2kg",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "巧克力醬3kg/罐",
    "final_name": "巧克力醬3kg",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "福汎巧克力3kg/罐",
    "final_name": "福汎巧克力3kg",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "椰香奶酥1.8KG/罐",
    "final_name": "椰香奶酥1.8KG",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "(億)小熱狗50根/包",
    "final_name": "小熱狗50根/包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "藍莓果醬900g/罐",
    "final_name": "藍莓果醬900g",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "(強)香Q地瓜椪1kg",
    "final_name": "香Q地瓜椪1kg/包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "(金品)全麥蛋餅皮25張/包",
    "final_name": "全麥蛋餅皮25張/包",
    "changed": true
  },
  {
    "supplier": "美食家",
    "original": "義美-滿福堡20個/袋",
    "final_name": "義美-滿福堡20個/箱",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "福華*煲湯真功夫600g/罐",
    "final_name": "福華*煲湯真功夫600g",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "福芝麻醬_600g/罐",
    "final_name": "福芝麻醬_600g",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "福芝麻醬_3kg/罐",
    "final_name": "福芝麻醬_3kg",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "冷凍青花菜1kg/包-約50顆",
    "final_name": "冷凍青花菜1kg/包-約50顆/包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "康寶鮮雞晶（1K-12包）/箱",
    "final_name": "康寶鮮雞晶（1K-12包）",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "海苔粉300g/包",
    "final_name": "海苔粉300g",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "花生粉3kg/包",
    "final_name": "花生粉3kg",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "祥旺特級蛋絲(3mm)_500g/包",
    "final_name": "特級蛋絲(3mm)_500g/包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "熟白芝麻_5斤/包",
    "final_name": "熟白芝麻_5斤",
    "changed": true
  },
  {
    "supplier": "美食家",
    "original": "祥旺特級蛋絲(3mm)_500g/包",
    "final_name": "特級蛋絲(3mm)_500g/包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "熟白芝麻_半斤/包",
    "final_name": "熟白芝麻_半斤",
    "changed": true
  },
  {
    "supplier": "美食家",
    "original": "豬五花肉片(厚度2mm)_1kg/盒",
    "final_name": "豬五花肉片(厚度2mm)_1kg/包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "源美甜辣醬5L/罐",
    "final_name": "源美甜辣醬5L",
    "changed": true
  },
  {
    "supplier": "津谷",
    "original": "國產五花底(切片2mm)",
    "final_name": "國產五花底(切片2mm)_1kg/kg",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "源美醬油膏5L/罐",
    "final_name": "源美醬油膏5L",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "加拿大豬炒片",
    "final_name": "加拿大豬炒片_1kg/kg",
    "changed": true
  },
  {
    "supplier": "VIC",
    "original": "豬肉$200/kg 代工費$50/kg",
    "final_name": "代工豬肉_3kg/式",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "純到幸福濃縮豆漿_1.5kg*10包/箱",
    "final_name": "純到幸福濃縮豆漿_1.5kg*10包/包",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "韓國帝王蟹膏醬1kg",
    "final_name": "韓國帝王蟹膏醬1kg/包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "台鹽精鹽_1kg/包",
    "final_name": "台鹽精鹽_1kg",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "韓式飯捲用黃蘿蔔1kg(47~50條)",
    "final_name": "韓式飯捲用黃蘿蔔1kg(47~50條)/根",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "年糕條1.8kg",
    "final_name": "年糕條1.8kg/包",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "日式風味蟹肉棒",
    "final_name": "日式風味蟹肉棒/盒",
    "changed": true
  },
  {
    "supplier": "立墩",
    "original": "點心盒_100入*10條/箱",
    "final_name": "點心盒_100入*10條",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "金雞蛋蜂蜜柚子茶-2KG/6罐/箱",
    "final_name": "金雞蛋蜂蜜柚子茶-2KG_6罐/箱",
    "changed": true
  },
  {
    "supplier": "立墩",
    "original": "大吐司盒_100入*6條/箱",
    "final_name": "大吐司盒_100入*6條",
    "changed": true
  },
  {
    "supplier": "永豐南北貨",
    "original": "點心盒_100入*10條/箱",
    "final_name": "點心盒_100入*10條",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "多用途辣味醬",
    "final_name": "多用途辣味醬/罐",
    "changed": true
  },
  {
    "supplier": "永豐南北貨",
    "original": "39H吐司盒_100入*10條/箱",
    "final_name": "39H吐司盒_100入*10條",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "韓式BBQ醬",
    "final_name": "韓式BBQ醬/罐",
    "changed": true
  },
  {
    "supplier": "永豐南北貨",
    "original": "私版902紙碗_600入/箱",
    "final_name": "私版902紙碗_600入",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "不倒翁炸雞醬-2KG/包(原味)",
    "final_name": "不倒翁炸雞醬-2KG/包(原味)/包",
    "changed": true
  },
  {
    "supplier": "宇聯",
    "original": "飯捲專用盒_50入*12條/箱",
    "final_name": "飯捲專用盒_50入*12條",
    "changed": true
  },
  {
    "supplier": "宇聯",
    "original": "飯捲盒上蓋_50入*12條/箱",
    "final_name": "飯捲盒上蓋_50入*12條",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "順昌-辣椒醬",
    "final_name": "順昌-辣椒醬/盒",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "順昌-辣椒醬",
    "final_name": "順昌-辣椒醬/盒",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "阿里郎粗辣椒粉/3kg",
    "final_name": "阿里郎粗辣椒粉/3kg/包",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "阿里郎細辣椒粉/3kg",
    "final_name": "阿里郎細辣椒粉/3kg/包",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "乾海帶芽",
    "final_name": "乾海帶芽/包",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "蝦子牌-菀島海苔絲",
    "final_name": "蝦子牌-菀島海苔絲/包",
    "changed": true
  },
  {
    "supplier": "立墩",
    "original": "飲料杯(16oz)_50入*20條/箱",
    "final_name": "飲料杯(16oz)_50入*20條",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "不倒翁芝麻香油",
    "final_name": "不倒翁芝麻香油/瓶",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "403牛皮紙100入/束",
    "final_name": "403牛皮紙100入",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "韓式專用豆腐條_320g/18 入/箱",
    "final_name": "韓式專用豆腐條_320g/18 入/入",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "韓式雙色乳酪絲 1kg/12包",
    "final_name": "韓式雙色乳酪絲 1kg/12包/包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "飲料杯座(3杯)50入/包",
    "final_name": "飲料杯座(3杯)50入",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "韓式專用起司片1033g(84片)/8入",
    "final_name": "韓式專用起司片1033g(84片)/8入/包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "飲料杯座(4杯)50入/包",
    "final_name": "飲料杯座(4杯)50入",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "飲料杯座(6杯)50入/包",
    "final_name": "飲料杯座(6杯)50入",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "酥炸紫菜冬粉捲(冷凍)",
    "final_name": "酥炸紫菜冬粉捲(冷凍)/包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "三明治袋*4050g/盒",
    "final_name": "三明治袋*4050g",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "韓味泡菜水餃900g(50粒)",
    "final_name": "韓味泡菜水餃900g(50粒)/包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "0號夾鏈袋-100入/包",
    "final_name": "0號夾鏈袋-100入",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "透明點心盒(OP-L020)_100入/條",
    "final_name": "透明點心盒(OP-L020)_100入",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "902碗-空白(箱)_50入*12條/箱",
    "final_name": "902碗-空白(箱)_50入*12條",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "165凸蓋_50入*12條/箱",
    "final_name": "165凸蓋_50入*12條",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "平蓋(霧面)_50入*12條/箱",
    "final_name": "平蓋(霧面)_50入*12條",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "165-1內襯_50入*12條/箱",
    "final_name": "165-1內襯_50入*12條",
    "changed": true
  },
  {
    "supplier": "韓濟",
    "original": "CHEF ONE濃味小魚乾湯汁_2kg/罐",
    "final_name": "CHEF ONE濃味小魚乾湯汁_2kg/包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "塑膠湯匙-100入/包",
    "final_name": "塑膠湯匙-100入",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "筷子(袋)30包/袋",
    "final_name": "筷子(袋)30包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "4-7吋竹籤_800g/包",
    "final_name": "4-7吋竹籤_800g",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "水果叉-10包/盒",
    "final_name": "水果叉-10包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "肉鬆-5斤",
    "final_name": "肉鬆-5斤/桶",
    "changed": true
  },
  {
    "supplier": "米谷",
    "original": "招牌壽司米_30KG",
    "final_name": "招牌壽司米_30KG/袋",
    "changed": true
  },
  {
    "supplier": "米谷",
    "original": "圓糯米_600g/包",
    "final_name": "圓糯米_600g/袋",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "橡皮筋#18_1KG/袋",
    "final_name": "橡皮筋#18_1KG",
    "changed": true
  },
  {
    "supplier": "鑫旺",
    "original": "玉米濃湯-320湯碗 50入/條",
    "final_name": "玉米濃湯-320湯碗 50入",
    "changed": true
  },
  {
    "supplier": "凱田/鑫旺",
    "original": "糖粉",
    "final_name": "糖粉/斤",
    "changed": true
  },
  {
    "supplier": "鑫旺",
    "original": "玉米濃湯-2632蓋 50入/條",
    "final_name": "玉米濃湯-2632蓋 50入",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "咖啡12OZ(杯)50入/條",
    "final_name": "咖啡12OZ(杯)50入",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "咖啡(蓋)50入/條",
    "final_name": "咖啡(蓋)50入",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "遠洋鮪魚6罐/箱",
    "final_name": "遠洋鮪魚6罐/罐",
    "changed": true
  },
  {
    "supplier": "宇聯",
    "original": "黃金比例蛋餅粉-1.52kg/包",
    "final_name": "黃金比例蛋餅粉-1.52kg",
    "changed": true
  },
  {
    "supplier": "美食家",
    "original": "遠洋鮪魚6罐/箱",
    "final_name": "遠洋鮪魚6罐/罐",
    "changed": true
  },
  {
    "supplier": "宇聯",
    "original": "鹿兒島焙茶粉-200g/包",
    "final_name": "鹿兒島焙茶粉-200g",
    "changed": true
  },
  {
    "supplier": "貞香",
    "original": "素食香鬆_600g/包",
    "final_name": "素食香鬆_600g",
    "changed": true
  },
  {
    "supplier": "好事多",
    "original": "芥末醬396g*2入/組",
    "final_name": "芥末醬396g*2入",
    "changed": true
  },
  {
    "supplier": "宇聯",
    "original": "來點x阿妮辣醬_5L/桶",
    "final_name": "來點x阿妮辣醬_5L",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "AVOSET濃縮奶精-1KG",
    "final_name": "AVOSET濃縮奶精-1KG/罐",
    "changed": true
  },
  {
    "supplier": "美食家",
    "original": "康寶法式沙拉醬",
    "final_name": "康寶法式沙拉醬/包",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "康寶法式沙拉醬",
    "final_name": "康寶法式沙拉醬/包",
    "changed": true
  },
  {
    "supplier": "凱蒂",
    "original": "黑胡椒醬_6KG/箱",
    "final_name": "黑胡椒醬_6KG",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "美玉白汁沙拉醬",
    "final_name": "美玉白汁沙拉醬/包",
    "changed": true
  },
  {
    "supplier": "凱蒂",
    "original": "蘑菇醬_6KG/箱",
    "final_name": "蘑菇醬_6KG",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "(億)西式千島沙拉醬-500g/包",
    "final_name": "西式千島沙拉醬-500g/包",
    "changed": true
  },
  {
    "supplier": "VIC",
    "original": "慶尚道辣炒豬_3kg/箱",
    "final_name": "慶尚道辣炒豬_3kg",
    "changed": true
  },
  {
    "supplier": "凱蒂",
    "original": "特製咖哩醬_6kg/箱",
    "final_name": "特製咖哩醬_6kg",
    "changed": true
  },
  {
    "supplier": "VIC",
    "original": "韓式黑醬_80g/包",
    "final_name": "韓式黑醬_80g",
    "changed": true
  },
  {
    "supplier": "長春騰",
    "original": "大漢堡包",
    "final_name": "大漢堡包/個",
    "changed": true
  },
  {
    "supplier": "瑪爾氏",
    "original": "皇家1號-超香辣椒鹽粉_600g/盒",
    "final_name": "皇家1號-超香辣椒鹽粉_600g",
    "changed": true
  },
  {
    "supplier": "長春騰",
    "original": "白吐司(20片)切邊",
    "final_name": "白吐司(20片)切邊/條",
    "changed": true
  },
  {
    "supplier": "誠泰",
    "original": "來點什麼老味醬油膏_5L/桶",
    "final_name": "來點什麼老味醬油膏_5L",
    "changed": true
  },
  {
    "supplier": "長春騰",
    "original": "厚切厚片",
    "final_name": "厚切厚片/條",
    "changed": true
  },
  {
    "supplier": "長春騰",
    "original": "竹炭堡",
    "final_name": "竹炭堡/顆",
    "changed": true
  },
  {
    "supplier": "椪椪",
    "original": "大吐司20片 切邊",
    "final_name": "大吐司20片 切邊/條",
    "changed": true
  },
  {
    "supplier": "椪椪",
    "original": "大厚片 不切邊",
    "final_name": "大厚片 不切邊/條",
    "changed": true
  },
  {
    "supplier": "椪椪",
    "original": "大吐司 不切邊",
    "final_name": "大吐司 不切邊/條",
    "changed": true
  },
  {
    "supplier": "椪椪",
    "original": "大白麥 切邊",
    "final_name": "大白麥 切邊/條",
    "changed": true
  },
  {
    "supplier": "椪椪",
    "original": "大漢堡 全切",
    "final_name": "大漢堡 全切/顆",
    "changed": true
  },
  {
    "supplier": "椪椪",
    "original": "竹炭堡",
    "final_name": "竹炭堡/顆",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "美生菜/斤(算價錢用)",
    "final_name": "美生菜/斤(算價錢用)/斤",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "黃豆芽",
    "final_name": "黃豆芽/斤",
    "changed": true
  },
  {
    "supplier": "甘先生",
    "original": "飯捲海苔_15張*50包/箱",
    "final_name": "飯捲海苔_15張*50包",
    "changed": true
  },
  {
    "supplier": "一點利",
    "original": "高麗菜絲0.1cm",
    "final_name": "高麗菜絲0.1cm/斤",
    "changed": true
  },
  {
    "supplier": "甘先生",
    "original": "壽司海苔_100張*60包/箱",
    "final_name": "壽司海苔_100張*60包",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "美生菜/斤",
    "final_name": "美生菜_1斤/斤",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "小黃瓜/斤",
    "final_name": "小黃瓜_1斤/斤",
    "changed": true
  },
  {
    "supplier": "聯華",
    "original": "三角海苔包裝_100張*24包/箱",
    "final_name": "三角海苔包裝_100張*24包",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "小黃瓜/兩",
    "final_name": "小黃瓜_1兩/兩",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "牛番茄/斤",
    "final_name": "牛番茄_1斤/斤",
    "changed": true
  },
  {
    "supplier": "台灣美味",
    "original": "黃金玉米罐頭(易)24入/箱",
    "final_name": "黃金玉米罐頭(易)24入",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "牛番茄/兩",
    "final_name": "牛番茄_1兩/兩",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "檸檬/斤",
    "final_name": "檸檬_1斤/斤",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "蒜仁/公斤",
    "final_name": "蒜仁_1公斤/公斤",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "薑/公斤",
    "final_name": "薑_1公斤/公斤",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "朝天椒/公斤",
    "final_name": "朝天椒_1公斤/公斤",
    "changed": true
  },
  {
    "supplier": "宇聯",
    "original": "飲料封口膜_約2300入/捲",
    "final_name": "飲料封口膜_約2300入",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "大辣椒/公斤",
    "final_name": "大辣椒_1公斤/公斤",
    "changed": true
  },
  {
    "supplier": "永豐南北貨",
    "original": "飲料封口膜_約3000入/捲",
    "final_name": "飲料封口膜_約3000入",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "紅蘿蔔絲/斤",
    "final_name": "紅蘿蔔絲_1斤/斤",
    "changed": true
  },
  {
    "supplier": "台益",
    "original": "瓦斯15KG(逢甲)/20KG(東勢)",
    "final_name": "瓦斯15KG(逢甲)/20KG(東勢)/桶",
    "changed": true
  },
  {
    "supplier": "農享",
    "original": "雞蛋20斤/籃",
    "final_name": "雞蛋20斤/籃/籃",
    "changed": true
  },
  {
    "supplier": "西螺菜商",
    "original": "朝天椒/公斤(已去蒂頭)",
    "final_name": "朝天椒/公斤(已去蒂頭)/公斤",
    "changed": true
  },
  {
    "supplier": "西螺菜商",
    "original": "牛角椒/公斤(已去蒂頭)",
    "final_name": "牛角椒/公斤(已去蒂頭)/公斤",
    "changed": true
  },
  {
    "supplier": "西螺菜商",
    "original": "蒜仁/公斤",
    "final_name": "蒜仁_1公斤/公斤",
    "changed": true
  },
  {
    "supplier": "西螺菜商",
    "original": "嫩薑/公斤",
    "final_name": "嫩薑_1公斤/公斤",
    "changed": true
  },
  {
    "supplier": "宥杏",
    "original": "苜蓿芽/斤",
    "final_name": "苜蓿芽_1斤/斤",
    "changed": true
  },
  {
    "supplier": "好市多",
    "original": "3M膠帶_8入/捲",
    "final_name": "3M膠帶_8入",
    "changed": true
  },
  {
    "supplier": "長鴻",
    "original": "喜常來-萬用衛生手套_100入/盒",
    "final_name": "喜常來-萬用衛生手套_100入",
    "changed": true
  },
  {
    "supplier": "甘先生",
    "original": "飯捲包裝(正方形)850張/包",
    "final_name": "飯捲包裝(正方形)850張",
    "changed": true
  },
  {
    "supplier": "甘先生",
    "original": "飯捲包裝(長方形)1200張/包",
    "final_name": "飯捲包裝(長方形)1200張",
    "changed": true
  },
  {
    "supplier": "五洲",
    "original": "感熱紙_60捲/箱",
    "final_name": "感熱紙_60捲",
    "changed": true
  },
  {
    "supplier": "倫特",
    "original": "感熱紙_3捲*20條/箱",
    "final_name": "感熱紙_3捲*20條",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "3M通用海綿菜瓜布(褐色)_10片/包",
    "final_name": "3M通用海綿菜瓜布(褐色)_10片",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "3M通用海綿菜瓜布(綠色)_10片/包",
    "final_name": "3M通用海綿菜瓜布(綠色)_10片",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "洗碗精4L(箱) 4罐/箱",
    "final_name": "洗碗精4L(箱) 4罐",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "漂白水_4L*4罐/箱",
    "final_name": "漂白水_4L*4罐",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "漂白水_4L/罐",
    "final_name": "漂白水_4L",
    "changed": true
  },
  {
    "supplier": "廣弘",
    "original": "加倍柔衛生紙_30包/箱",
    "final_name": "加倍柔衛生紙_30包",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "廚房餐巾紙_6捲*8袋/箱",
    "final_name": "廚房餐巾紙_6捲*8袋",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "垃圾袋(紅/藍)_3捲/包",
    "final_name": "垃圾袋(紅/藍)_3捲",
    "changed": true
  },
  {
    "supplier": "凱田",
    "original": "小蘇打-300克/包",
    "final_name": "小蘇打-300克",
    "changed": true
  }
];

let success = 0, skip = 0, fail = 0;

for (const item of updates) {
  try {
    // 舊名稱放進 aliases，新名稱更新 name
    const [rows] = await conn.execute(
      'SELECT id, aliases FROM os_products WHERE tenantId=1 AND supplierName=? AND name=? LIMIT 1',
      [item.supplier, item.original]
    );
    
    if (rows.length === 0) {
      console.log(`找不到：[${item.supplier}] ${item.original}`);
      skip++;
      continue;
    }
    
    const row = rows[0];
    // 把舊名稱加入 aliases
    let aliases = [];
    try {
      aliases = row.aliases ? JSON.parse(row.aliases) : [];
    } catch(e) { aliases = []; }
    
    if (!aliases.includes(item.original)) {
      aliases.push(item.original);
    }
    
    await conn.execute(
      'UPDATE os_products SET name=?, aliases=?, updatedAt=NOW() WHERE id=?',
      [item.final_name, JSON.stringify(aliases), row.id]
    );
    success++;
  } catch(e) {
    console.error(`失敗：[${item.supplier}] ${item.original}`, e.message);
    fail++;
  }
}

console.log(`完成：更新 ${success} 筆，找不到 ${skip} 筆，失敗 ${fail} 筆`);
await conn.end();
