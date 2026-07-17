const express = require('express');
const { requireCustomer } = require('../middleware/auth.middleware');
const { z } = require('zod');
const {
  OrderError,
  getOrderById,
  attachPaymentSession,
  markOrderPaid,
  markOrderPaymentFailed,
  findOrderByProviderConversationId,
  isOnlinePaymentMethod,
} = require('../services/orders.service');
const {
  getProvider,
  getFrontendUrl,
  initCheckout,
  verifyPaytrNotification,
} = require('../services/payments.service');

const router = express.Router();

const initSchema = z.object({
  orderId: z.number().int().positive(),
});

const mockCompleteSchema = z.object({
  orderId: z.number().int().positive(),
  token: z.string().trim().min(8).max(200),
  success: z.boolean(),
});

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '85.34.78.112';
}

router.post('/init', requireCustomer, async (req, res) => {
  const parsed = initSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz odeme istegi',
      details: parsed.error.issues,
    });
  }

  try {
    const order = await getOrderById(parsed.data.orderId);
    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Siparis bulunamadi' });
    }

    if (!isOnlinePaymentMethod(order.paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Bu siparis kart ile odeme icin degil',
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, error: 'Siparis zaten odendi' });
    }

    const session = await initCheckout(order, { userIp: clientIp(req) });
    const updated = await attachPaymentSession(order.id, session);
    if (!updated) {
      return res.status(409).json({
        success: false,
        error: 'Odeme oturumu baslatilamadi',
      });
    }

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        provider: session.provider,
        token: session.token,
        paymentPageUrl: session.paymentPageUrl,
        iframeToken: session.iframeToken ?? null,
      },
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Odeme baslatilamadi' });
  }
});

router.post('/mock/complete', requireCustomer, async (req, res) => {
  if (getProvider() !== 'mock') {
    return res.status(403).json({
      success: false,
      error: 'Mock odeme sadece mock modunda kullanilabilir',
    });
  }

  const parsed = mockCompleteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz mock odeme istegi',
      details: parsed.error.issues,
    });
  }

  try {
    const order = await getOrderById(parsed.data.orderId);
    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Siparis bulunamadi' });
    }

    if (order.providerPaymentId !== parsed.data.token) {
      return res.status(400).json({ success: false, error: 'Gecersiz odeme tokeni' });
    }

    if (parsed.data.success) {
      const paid = await markOrderPaid(order.id, {
        providerPaymentId: parsed.data.token,
      });
      return res.json({ success: true, data: paid });
    }

    const failed = await markOrderPaymentFailed(order.id, {
      providerPaymentId: parsed.data.token,
    });
    return res.json({ success: true, data: failed });
  } catch (err) {
    if (err instanceof OrderError) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Odeme tamamlanamadi' });
  }
});

// PayTR bildirim URL — siparis onay/iptal SADECE burada yapilir
router.post('/paytr/notification', async (req, res) => {
  try {
    if (!verifyPaytrNotification(req.body || {})) {
      return res.status(400).send('PAYTR notification failed: bad hash');
    }

    const merchantOid = String(req.body.merchant_oid || '');
    const status = String(req.body.status || '');
    const order = await findOrderByProviderConversationId(merchantOid);

    if (!order) {
      return res.status(404).send('OK');
    }

    if (status === 'success') {
      await markOrderPaid(order.id, {
        providerConversationId: merchantOid,
        providerPaymentId: order.providerPaymentId,
      });
    } else {
      await markOrderPaymentFailed(order.id, {
        providerConversationId: merchantOid,
      });
    }

    return res.send('OK');
  } catch (err) {
    console.error(err);
    return res.status(500).send('PAYTR notification failed');
  }
});

router.get('/provider', (_req, res) => {
  res.json({
    success: true,
    data: {
      provider: getProvider(),
      frontendUrl: getFrontendUrl(),
    },
  });
});

module.exports = router;
