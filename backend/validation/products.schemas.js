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
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().url().optional(),
);

const productCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: nonEmptyString,
  price: positivePrice,
  stock: nonNegativeInt,
  imageUrl: imageUrlSchema.optional(),
});

const productUpdateSchema = productCreateSchema;

module.exports = {
  productCreateSchema,
  productUpdateSchema,
};

