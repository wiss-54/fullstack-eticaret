const express = require('express');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../validation/auth.schemas');
const { createUser, verifyUserCredentials, getUserById } = require('../services/users.service');
const { requireCustomer } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz kayit bilgisi',
      details: parsed.error.issues,
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, error: 'Sunucu ayarlari eksik' });
  }

  try {
    const user = await createUser(parsed.data);
    const token = jwt.sign(
      { role: 'customer', userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    return res.status(201).json({ success: true, token, data: user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Bu e-posta zaten kayitli' });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Kayit olusturulamadi' });
  }
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz giris bilgisi',
      details: parsed.error.issues,
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, error: 'Sunucu ayarlari eksik' });
  }

  try {
    const user = await verifyUserCredentials(parsed.data.email, parsed.data.password);
    if (!user) {
      return res.status(401).json({ success: false, error: 'E-posta veya sifre hatali' });
    }

    const token = jwt.sign(
      { role: 'customer', userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    return res.json({ success: true, token, data: user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Giris yapilamadi' });
  }
});

router.get('/me', requireCustomer, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Kullanici bulunamadi' });
    }
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Kullanici bilgisi alinamadi' });
  }
});

module.exports = router;
