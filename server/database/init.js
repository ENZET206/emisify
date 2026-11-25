// Membuat semua tabel dari database/schema.sql. Aman dijalankan ulang (yang sudah ada dilewati).
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.pool.query(sql);
  console.log('Struktur database siap (database/schema.sql).');
})()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.pool.end());
