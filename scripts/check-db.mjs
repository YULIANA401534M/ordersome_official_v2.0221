import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(url);

console.log('\n=== Query 1: SHOW COLUMNS FROM dy_orders WHERE Field IN (driverNote, cashCollected) ===');
try {
  const [rows] = await conn.execute(
    "SHOW COLUMNS FROM dy_orders WHERE Field IN ('driverNote', 'cashCollected')"
  );
  console.table(rows);
} catch (e) {
  console.error('Error:', e.message);
}

console.log('\n=== Query 2: COUNT dy_work_logs table ===');
try {
  const [rows] = await conn.execute(
    "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'dy_work_logs'"
  );
  console.table(rows);
} catch (e) {
  console.error('Error:', e.message);
}

console.log('\n=== Query 3: Total table count in database ===');
try {
  const [rows] = await conn.execute(
    "SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = DATABASE()"
  );
  console.table(rows);
} catch (e) {
  console.error('Error:', e.message);
}

console.log('\n=== Query 4: List all dy_* tables ===');
try {
  const [rows] = await conn.execute(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name LIKE 'dy_%' ORDER BY table_name"
  );
  console.table(rows);
} catch (e) {
  console.error('Error:', e.message);
}

await conn.end();
