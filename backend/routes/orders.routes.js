const express = require('express');
const { requireCustomer } = require('../middleware/auth.middleware');
const { createOrderSchema } = require('../validation/orders.schemas');
const {
  OrderError,
  createOrder,
  getOrderByIdOrPublicCode,
  listOrdersByUserId,
} = require('../services/orders.service');
const { getUserById } = require('../services/users.service');

const router = express.Router();

router.post('/', requireCustomer, async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz siparis bilgisi',
      details: parsed.error.issues,
    });
  }

  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Kullanici bulunamadi' });
    }

    const order = await createOrder(user, parsed.data);
    return res.status(201).json({ success: true, data: order });
  } catch (err) {
    if (err instanceof OrderError) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Siparis olusturulamadi' });
  }
});

router.get('/', requireCustomer, async (req, res) => {
  try {
    const orders = await listOrdersByUserId(req.user.id);
    res.set('Cache-Control', 'no-store');
    return res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Siparisler alinamadi' });
  }
});

router.get('/:idOrCode', requireCustomer, async (req, res) => {
  const idOrCode = String(req.params.idOrCode || '').trim();
  if (!idOrCode) {
    return res.status(400).json({ success: false, error: 'Gecersiz siparis kodu' });
  }

  try {
    const order = await getOrderByIdOrPublicCode(idOrCode);
    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Siparis bulunamadi' });
    }
    res.set('Cache-Control', 'no-store');
    return res.json({ success: true, data: order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Siparis alinamadi' });
  }
});

module.exports = router;
