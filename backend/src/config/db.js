const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('✅ Terhubung ke database PostgreSQL di Docker!');
});

pool.on('error', (err) => {
  console.error('❌ Terjadi kesalahan database:', err.message);
});

module.exports = pool;