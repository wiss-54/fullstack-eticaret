const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { requireAdmin } = require('../middleware/auth.middleware');
const { getSystemStatus } = require('../services/monitoring.service');

const router = express.Router();

const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Gecersiz giris bilgisi' });
  }

  const { username, password } = parsed.data;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUsername || !adminPasswordHash || !process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, error: 'Admin ayarlari eksik' });
  }

  if (username !== adminUsername) {
    return res.status(401).json({ success: false, error: 'Kullanici adi veya sifre hatali' });
  }

  const passwordOk = await bcrypt.compare(password, adminPasswordHash);
  if (!passwordOk) {
    return res.status(401).json({ success: false, error: 'Kullanici adi veya sifre hatali' });
  }

  const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });

  return res.json({ success: true, token });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ success: true, data: { username: req.admin.username, role: req.admin.role } });
});

router.get('/status', requireAdmin, async (_req, res) => {
  try {
    const data = await getSystemStatus();
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Monitoring verisi alinamadi' });
  }
});

module.exports = router;
