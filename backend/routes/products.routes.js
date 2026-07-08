const express = require('express');
const router = express.Router();

const {
  productCreateSchema,
  productUpdateSchema,
} = require('../validation/products.schemas');
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../services/products.service');

function parsePositiveInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

router.get('/', async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit) ?? 20;
    const offset = parsePositiveInt(req.query.offset) ?? 0;
    const products = await listProducts(limit, offset);
    res.json({ success: true, data: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }

    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

router.post('/', async (req, res) => {
  const parsed = productCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid product payload',
      details: parsed.error.issues,
    });
  }

  try {
    const product = await createProduct(parsed.data);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid product payload',
      details: parsed.error.issues,
    });
  }

  try {
    const product = await updateProduct(id, parsed.data);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }

    const ok = await deleteProduct(id);
    if (!ok) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

module.exports = router;

