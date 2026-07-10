const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { pool } = require('./db');
const productsRoutes = require('./routes/products.routes');
const adminRoutes = require('./routes/admin.routes');
const versionRoutes = require('./routes/version.routes');

const app = express();

app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(cors());
app.use(express.json());

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'PostgreSQL bağlantısı fişek gibi kankam!',
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Veritabanına bağlanırken bir hata oluştu.',
    });
  }
});

app.use('/api/products', productsRoutes);
app.use('/api/categories', require('./routes/categories.routes'));
app.use('/api/admin', adminRoutes);
app.use('/api/version', versionRoutes);

module.exports = app;
