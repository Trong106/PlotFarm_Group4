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
    max: 10,                 // Maximum active connections in pool
    min: 2,                  // Minimum warm connections maintained
    idleTimeoutMillis: 30000,// Close idle connection after 30s
    acquireTimeoutMillis: 15000, // Timeout when acquiring connection
  },
};

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
