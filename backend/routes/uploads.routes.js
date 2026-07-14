const express = require('express');
const { requireAdmin } = require('../middleware/auth.middleware');
const {
  upload,
  toPublicUploadPath,
} = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/', requireAdmin, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Dosya en fazla 5MB olabilir'
          : err.message || 'Yukleme basarisiz';
      return res.status(400).json({ success: false, error: message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Dosya secilmedi' });
    }

    const imageUrl = toPublicUploadPath(req.file.filename);
    return res.status(201).json({
      success: true,
      data: {
        imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  });
});

module.exports = router;
