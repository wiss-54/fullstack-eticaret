const express = require('express');
const {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../services/categories.service');
const {
  categoryCreateSchema,
  categoryUpdateSchema,
} = require('../validation/categories.schemas');
const { requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const data = await listCategories();
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  try {
    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const parsed = categoryCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid category payload',
      details: parsed.error.issues,
    });
  }

  try {
    const category = await createCategory(parsed.data);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Bu slug zaten kullaniliyor' });
    }
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  const parsed = categoryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid category payload',
      details: parsed.error.issues,
    });
  }

  try {
    const category = await updateCategory(id, parsed.data);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Bu slug zaten kullaniliyor' });
    }
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  try {
    const deleted = await deleteCategory(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

module.exports = router;
