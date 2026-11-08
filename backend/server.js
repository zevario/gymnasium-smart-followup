const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint dasar untuk tes
app.get('/', async (req, res) => {
  try {
    // Tes query sederhana ke database
    const result = await db.query('SELECT NOW()');
    res.json({
      message: 'Server Gymnasyum Backend Aktif!',
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});