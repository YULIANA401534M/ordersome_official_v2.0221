import mysql from 'mysql2/promise';

const stores = [
  {
    name: "來點什麼 逢甲旗艦店",
    address: "台中市西屯區福星路222號",
    phone: "(04) 2452-9057",
    openingHours: "07:00–14:00, 18:30–01:30",
    latitude: 24.1785,
    longitude: 120.6458
  },
  {
    name: "來點什麼 東勢店",
    address: "台中市東勢區東崎路五段411號",
    phone: "(04) 2588-3100",
    openingHours: "05:30–12:30 (平日), 06:30–13:30 (週末)",
    latitude: 24.2583,
    longitude: 120.8278
  },
  {
    name: "來點什麼 東山店",
    address: "台中市北屯區軍和街314號",
    phone: "(04) 2239-9257",
    openingHours: "06:00–13:00 (平日), 06:30–13:30 (週末)",
    latitude: 24.1892,
    longitude: 120.7156
  },
  {
    name: "來點什麼 大里店",
    address: "台中市大里區東明路336號",
    phone: "(04) 2482-2201",
    openingHours: "06:30–13:00 (平日), 07:00–13:30 (週末)",
    latitude: 24.0998,
    longitude: 120.6847
  },
  {
    name: "來點什麼 草屯中山店",
    address: "南投縣草屯鎮中山街131號",
    phone: "(04) 9236-7737",
    openingHours: "06:00–18:00 (一至三), 06:00–13:30 (四至日)",
    latitude: 23.9731,
    longitude: 120.6833
  },
  {
    name: "來點什麼 北區永興店",
    address: "台中市北區永興街195號",
    phone: "(04) 2236-0839",
    openingHours: "06:30–20:00 (平日), 07:00–20:00 (週末)",
    latitude: 24.1567,
    longitude: 120.6789
  },
  {
    name: "來點什麼 財神店",
    address: "台中市北屯區瀋陽路三段347號",
    phone: "(04) 2247-1858",
    openingHours: "06:30–13:30",
    latitude: 24.1823,
    longitude: 120.6912
  },
  {
    name: "來點什麼 民權店",
    address: "台中市西區民權路374號",
    phone: "(04) 2208-3399",
    openingHours: "07:00–14:00",
    latitude: 24.1456,
    longitude: 120.6634
  },
  {
    name: "來點什麼 西屯福上店",
    address: "台中市西屯區福上巷143號",
    phone: "(04) 2296-5668",
    openingHours: "06:00–13:30 (週一公休)",
    latitude: 24.1734,
    longitude: 120.6523
  },
  {
    name: "來點什麼 瀋陽梅川店",
    address: "台中市北屯區瀋陽路二段34號",
    phone: "(04) 2241-0271",
    openingHours: "06:30–13:30, 17:00–19:30 (週一公休)",
    latitude: 24.1678,
    longitude: 120.6845
  },
  {
    name: "來點什麼 北屯昌平店",
    address: "台中市北屯區昌平路二段5之4號",
    phone: "(04) 2247-8415",
    openingHours: "06:30–18:00 (一三五), 06:30–13:30 (二四)",
    latitude: 24.1789,
    longitude: 120.6934
  },
  {
    name: "來點什麼 南屯林新店",
    address: "台中市南屯區惠中路三段54號",
    phone: "(04) 2380-2780",
    openingHours: "06:30–13:30",
    latitude: 24.1423,
    longitude: 120.6512
  }
];

async function importStores() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // 先清除舊的門市資料
  await connection.execute('DELETE FROM stores');
  
  // 匯入新的門市資料
  for (const store of stores) {
    await connection.execute(
      `INSERT INTO stores (name, address, phone, openingHours, latitude, longitude, isActive, sortOrder, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, true, 0, NOW(), NOW())`,
      [store.name, store.address, store.phone, store.openingHours, store.latitude, store.longitude]
    );
    console.log(`✓ 已匯入: ${store.name}`);
  }
  
  console.log(`\n✅ 成功匯入 ${stores.length} 間門市資料！`);
  await connection.end();
}

importStores().catch(console.error);
