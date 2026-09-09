const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || '127.0.0.1',
  database: process.env.DB_DATABASE || 'PlotFarmDB',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

const connectDB = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('[Database] Connected to Microsoft SQL Server (PlotFarmDB)');
    }
    return pool;
  } catch (error) {
    console.error('[Database] Connection error:', error.message);
    return null;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDB() first.');
  }
  return pool;
};

module.exports = {
  connectDB,
  getPool,
  sql,
};
