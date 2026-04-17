import { createConnection } from 'mysql2/promise';

const conn = await createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  const years = [2025, 2026, 2027];
  for (const year of years) {
    const res = await fetch(
      `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`
    );
    const data = await res.json();
    let count = 0;
    for (const item of data) {
      const dateStr = `${item.date.slice(0,4)}-${item.date.slice(4,6)}-${item.date.slice(6,8)}`;
      await conn.execute(`
        INSERT INTO os_tw_holidays (date, isHoliday, description, year)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE isHoliday=VALUES(isHoliday), description=VALUES(description)
      `, [dateStr, item.isHoliday ? 1 : 0, item.description || null, year]);
      count++;
    }
    console.log(`${year} 年假日資料寫入 ${count} 筆`);
  }
} finally {
  await conn.end();
}
