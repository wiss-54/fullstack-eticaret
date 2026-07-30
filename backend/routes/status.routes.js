const express = require('express');
const { getPublicStatus } = require('../services/monitoring.service');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const force = String(_req.query.refresh || '') === '1';
    const data = await getPublicStatus({ force });
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Durum bilgisi alinamadi' });
  }
});

module.exports = router;
