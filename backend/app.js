const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { pool } = require('./db');
const productsRoutes = require('./routes/products.routes');
const adminRoutes = require('./routes/admin.routes');
const versionRoutes = require('./routes/version.routes');
const { ensureUploadDir, UPLOAD_DIR } = require('./middleware/upload.middleware');

const app = express();

// Nginx arkasinda gercek client IP icin gerekli; yoksa tum trafige tek bucket dusuyor.
app.set('trust proxy', 1);

ensureUploadDir();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Cok fazla deneme. Lutfen biraz sonra tekrar dene.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const path = (req.originalUrl || req.url || '').split('?')[0];
    return (
      path === '/api/test-db' ||
      path === '/api/version' ||
      path.startsWith('/api/version/')
    );
  },
  message: { success: false, error: 'Cok fazla istek. Lutfen biraz sonra tekrar dene.' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api', apiLimiter);

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
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/store-settings', require('./routes/store-settings.routes'));
app.use('/api/admin/uploads', require('./routes/uploads.routes'));
app.use('/api/admin', adminRoutes);
app.use('/api/version', versionRoutes);

module.exports = app;
