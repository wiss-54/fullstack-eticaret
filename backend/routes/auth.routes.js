const express = require('express');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema, shippingAddressSchema } = require('../validation/auth.schemas');
const {
  createUser,
  verifyUserCredentials,
  getUserById,
  verifyEmailByToken,
  resendVerificationEmail,
  updateUserShippingAddress,
} = require('../services/users.service');
const { requireCustomer } = require('../middleware/auth.middleware');

const router = express.Router();

function signCustomerToken(user) {
  return jwt.sign(
    { role: 'customer', userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

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

    return res.status(201).json({
      success: true,
      message: 'Kayit olusturuldu. E-posta adresinize dogrulama linki gonderildi.',
      data: user,
    });
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
    const result = await verifyUserCredentials(parsed.data.email, parsed.data.password);
    if (result.status === 'invalid') {
      return res.status(401).json({ success: false, error: 'E-posta veya sifre hatali' });
    }

    if (result.status === 'unverified') {
      return res.status(403).json({
        success: false,
        error: 'E-posta adresiniz dogrulanmamis. Gelen kutunuzu kontrol edin.',
        code: 'EMAIL_NOT_VERIFIED',
        data: { email: result.user.email },
      });
    }

    const token = signCustomerToken(result.user);
    return res.json({ success: true, token, data: result.user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Giris yapilamadi' });
  }
});

router.post('/verify-email', async (req, res) => {
  const token = req.body?.token?.trim();
  if (!token) {
    return res.status(400).json({ success: false, error: 'Dogrulama kodu gerekli' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, error: 'Sunucu ayarlari eksik' });
  }

  try {
    const user = await verifyEmailByToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Dogrulama linki gecersiz veya suresi dolmus',
      });
    }

    const authToken = signCustomerToken(user);
    return res.json({
      success: true,
      message: 'E-posta adresiniz dogrulandi',
      token: authToken,
      data: user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'E-posta dogrulanamadi' });
  }
});

router.post('/resend-verification', async (req, res) => {
  const email = req.body?.email?.trim();
  if (!email) {
    return res.status(400).json({ success: false, error: 'E-posta adresi gerekli' });
  }

  try {
    await resendVerificationEmail(email);
    return res.json({
      success: true,
      message: 'Dogrulama e-postasi gonderildi. Gelen kutunuzu kontrol edin.',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'E-posta gonderilemedi' });
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

router.patch('/me/shipping-address', requireCustomer, async (req, res) => {
  const parsed = shippingAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz adres bilgisi',
      details: parsed.error.issues,
    });
  }

  try {
    const user = await updateUserShippingAddress(req.user.id, parsed.data);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Kullanici bulunamadi' });
    }
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Adres kaydedilemedi' });
  }
});

module.exports = router;
