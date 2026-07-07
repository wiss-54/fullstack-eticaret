const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Veritabanı test ucu
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      message: 'PostgreSQL bağlantısı fişek gibi kankam!', 
      time: result.rows[0].now 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Veritabanına bağlanırken bir hata oluştu.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend sunucusu ${PORT} portunda fırtına gibi çalışıyor!`);
});