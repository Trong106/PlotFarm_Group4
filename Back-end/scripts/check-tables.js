require('dotenv').config();
const { connectDB, closeDB } = require('../src/config/db');

async function check() {
  const pool = await connectDB();
  const r = await pool.request().query('SELECT name FROM sys.tables ORDER BY name');
  console.log('DB Tables found:', r.recordset.map(x => x.name).join(', '));
  await closeDB();
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
