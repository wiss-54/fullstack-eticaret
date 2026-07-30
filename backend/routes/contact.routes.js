const express = require('express');
const { z } = require('zod');
const { sendContactMessage } = require('../services/email.service');

const router = express.Router();

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().nullable(),
  message: z.string().trim().min(5).max(2000),
});

router.post('/', async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz iletisim formu',
      details: parsed.error.issues,
    });
  }

  try {
    await sendContactMessage({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone?.trim() || null,
      message: parsed.data.message,
    });
    res.json({ success: true, message: 'Mesajiniz alindi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Mesaj gonderilemedi. Lutfen daha sonra tekrar dene.',
    });
  }
});

module.exports = router;
