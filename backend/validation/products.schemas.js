const { z } = require('zod');

const nonEmptyString = z
  .string()
  .trim()
  .min(1)
  .max(2000);

const positivePrice = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
  z.number().nonnegative().finite(),
);

const nonNegativeInt = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().nonnegative(),
);

const imageUrlSchema = z.preprocess(
  (v) => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === 'string' && v.trim() === '') return undefined;
    return v;
  },
  z.string().url().optional(),
);

const productCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: nonEmptyString,
  price: positivePrice,
  stock: nonNegativeInt,
  imageUrl: imageUrlSchema.optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  productType: z.enum(['simple', 'variant']).optional(),
});

const productUpdateSchema = productCreateSchema;

module.exports = {
  productCreateSchema,
  productUpdateSchema,
};

