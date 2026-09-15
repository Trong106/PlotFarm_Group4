const mssqlTedious = require('mssql');
let mssqlNative = null;
try {
  mssqlNative = require('mssql/msnodesqlv8');
} catch (e) {}

require('dotenv').config();

const serverName = process.env.DB_SERVER || '(localdb)\\MSSQLLocalDB';
const isLocalDB = serverName.toLowerCase().includes('localdb');

const sql = isLocalDB && mssqlNative ? mssqlNative : mssqlTedious;

const config = {
  server: serverName,
  database: process.env.DB_DATABASE || 'PlotFarmDB',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 15000,
  },
};

if (isLocalDB && mssqlNative) {
  config.driver = 'msnodesqlv8';
  config.options.trustedConnection = true;
} else {
  if (process.env.DB_USER) config.user = process.env.DB_USER;
  if (process.env.DB_PASSWORD) config.password = process.env.DB_PASSWORD;
  config.port = parseInt(process.env.DB_PORT, 10) || 1433;
}

let pool = null;

/**
 * Initialize and connect to SQL Server Connection Pool
 */
const connectDB = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(config);

      // Handle unexpected connection errors without crashing Node.js process
      pool.on('error', (err) => {
        console.error('[Database Pool Error]:', err.message);
      });

      console.log('[Database] Connected to Microsoft SQL Server (PlotFarmDB)');
    }
    return pool;
  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    return null;
  }
};

/**
 * Get active connection pool
 */
const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDB() first.');
  }
  return pool;
};

/**
 * Helper to execute parameterized queries safely against SQL Injection
 * @param {string} text - SQL Query with @param placeholders
 * @param {object} params - Key-value pair of parameters
 */
const executeQuery = async (text, params = {}) => {
  const currentPool = getPool();
  const request = currentPool.request();

  for (const [key, value] of Object.entries(params)) {
    request.input(key, value);
  }

  return await request.query(text);
};

/**
 * Close connection pool explicitly (useful for tests or graceful shutdown)
 */
const closeDB = async () => {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('[Database] Connection pool closed.');
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  getPool,
  executeQuery,
  closeDB,
  sql,
};
