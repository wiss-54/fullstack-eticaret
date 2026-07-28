const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { requireAdmin } = require('../middleware/auth.middleware');
const { getSystemStatus } = require('../services/monitoring.service');
const { updateOrderStatusSchema } = require('../validation/orders.schemas');
const {
  getOrderById,
  listAllOrders,
  updateOrderStatus,
} = require('../services/orders.service');

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

router.get('/orders', requireAdmin, async (_req, res) => {
  try {
    const orders = await listAllOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Siparisler alinamadi' });
  }
});

router.get('/orders/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, error: 'Gecersiz siparis id' });
  }

  try {
    const order = await getOrderById(id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Siparis bulunamadi' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Siparis alinamadi' });
  }
});

router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, error: 'Gecersiz siparis id' });
  }

  const parsed = updateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz durum bilgisi',
      details: parsed.error.issues,
    });
  }

  try {
    const order = await updateOrderStatus(id, parsed.data.status);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Siparis bulunamadi' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    console.error(err);
    if (err?.code === '23514') {
      return res.status(409).json({
        success: false,
        error: 'Siparis durumu veritabani tarafinda reddedildi. Migration gerekli olabilir.',
      });
    }
    res.status(500).json({ success: false, error: 'Siparis guncellenemedi' });
  }
});

module.exports = router;
