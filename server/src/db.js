const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

let pool = null;

function loadEnv() {
  const envPaths = [
    path.resolve(__dirname, '../.env'),
    path.resolve(process.cwd(), 'server/.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const raw = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
        const lines = raw.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (val.length > 0 || !process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch (e) {}
    }
  }
}

function getPool() {
  loadEnv();
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'creator_app',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'creator_platform',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

// Wrapper pool object to ensure execute uses active pool
const activePool = {
  execute: async (...args) => {
    return getPool().execute(...args);
  },
  getConnection: async () => {
    return getPool().getConnection();
  }
};

async function testConnection() {
  try {
    const connection = await activePool.getConnection();
    console.log(' Successfully connected to MySQL database:', process.env.DB_NAME || 'creator_platform');
    connection.release();
    return true;
  } catch (error) {
    console.error(' Database connection failure:', error.message);
    return false;
  }
}

module.exports = {
  pool: activePool,
  testConnection
};
