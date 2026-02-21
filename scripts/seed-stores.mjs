import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function seedStores() {
  if (!DATABASE_URL) {
    console.log('DATABASE_URL not set, skipping seed');
    return;
  }

  const connection = await mysql.createConnection(DATABASE_URL);
  
  const stores = [
    {
      name: '來點什麼 東勢總店',
      address: '台中市東勢區豐勢路518號',
      phone: '04-2587-0000',
      openingHours: '週一至週日 06:00-14:00',
      latitude: '24.2583',
      longitude: '120.8278',
      isActive: 1,
      sortOrder: 1,
    },
    {
      name: '來點什麼 豐原店',
      address: '台中市豐原區中正路100號',
      phone: '04-2528-0000',
      openingHours: '週一至週日 06:00-14:00',
      latitude: '24.2428',
      longitude: '120.7183',
      isActive: 1,
      sortOrder: 2,
    },
    {
      name: '來點什麼 台中店',
      address: '台中市西區公益路68號',
      phone: '04-2301-0000',
      openingHours: '週一至週日 06:00-14:00',
      latitude: '24.1469',
      longitude: '120.6619',
      isActive: 1,
      sortOrder: 3,
    },
  ];

  for (const store of stores) {
    try {
      await connection.execute(
        `INSERT INTO stores (name, address, phone, openingHours, latitude, longitude, isActive, sortOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE name=name`,
        [store.name, store.address, store.phone, store.openingHours, store.latitude, store.longitude, store.isActive, store.sortOrder]
      );
      console.log(`Added store: ${store.name}`);
    } catch (error) {
      console.error(`Error adding store ${store.name}:`, error.message);
    }
  }

  await connection.end();
  console.log('Store seeding complete!');
}

seedStores().catch(console.error);
