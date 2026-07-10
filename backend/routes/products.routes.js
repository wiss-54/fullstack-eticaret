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
const {
  listOptionsByProductId,
  replaceProductOptions,
} = require('../services/product-options.service');
const {
  listVariantsByProductId,
  replaceProductVariants,
} = require('../services/product-variants.service');
const { replaceProductVariantsSchema } = require('../validation/product-variants.schemas');
const { replaceProductOptionsSchema } = require('../validation/product-options.schemas');
const { requireAdmin } = require('../middleware/auth.middleware');

function parsePositiveInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

router.get('/', async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit) ?? 20;
    const offset = parsePositiveInt(req.query.offset) ?? 0;
    const categoryId = parsePositiveInt(req.query.categoryId);
    const products = await listProducts(limit, offset, categoryId || null);
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

    const options = await listOptionsByProductId(id);
    const variantData = await listVariantsByProductId(id);
    res.json({
      success: true,
      data: {
        ...product,
        options,
        variantAxes: variantData.axes,
        variants: variantData.variants,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
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

router.put('/:id', requireAdmin, async (req, res) => {
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

router.put('/:id/options', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  const parsed = replaceProductOptionsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid product options payload',
      details: parsed.error.issues,
    });
  }

  try {
    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    for (const option of parsed.data) {
      if (option.optionType === 'select' && (!option.choices || option.choices.length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'Select tipi seceneklerde en az bir deger olmali',
        });
      }
    }

    const options = await replaceProductOptions(id, parsed.data);
    res.json({ success: true, data: options });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

router.put('/:id/variants', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  const parsed = replaceProductVariantsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid product variants payload',
      details: parsed.error.issues,
    });
  }

  try {
    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (parsed.data.axes.length > 0) {
      for (const axis of parsed.data.axes) {
        if (!axis.values || axis.values.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Her varyant ekseninde en az bir deger olmali',
          });
        }
      }
    }

    const variantData = await replaceProductVariants(id, parsed.data);
    const updatedProduct = await getProductById(id);
    res.json({
      success: true,
      data: {
        ...updatedProduct,
        variantAxes: variantData.axes,
        variants: variantData.variants,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
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

