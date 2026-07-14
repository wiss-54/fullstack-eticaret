const express = require('express');
const { requireAdmin } = require('../middleware/auth.middleware');
const { storeSettingsUpdateSchema } = require('../validation/store-settings.schemas');
const {
  getStoreSettings,
  updateStoreSettings,
} = require('../services/store-settings.service');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const settings = await getStoreSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Magaza ayarlari alinamadi' });
  }
});

router.put('/', requireAdmin, async (req, res) => {
  const parsed = storeSettingsUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz magaza ayarlari',
      details: parsed.error.issues,
    });
  }

  try {
    const settings = await updateStoreSettings(parsed.data);
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Magaza ayarlari guncellenemedi' });
  }
});

module.exports = router;
