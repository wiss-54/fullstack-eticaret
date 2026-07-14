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
    if (v === null) return null;
    if (v === undefined) return undefined;
    if (typeof v === 'string' && v.trim() === '') return null;
    return typeof v === 'string' ? v.trim() : v;
  },
  z
    .union([
      z
        .string()
        .max(2000)
        .refine(
          (value) =>
            value.startsWith('/uploads/') ||
            /^https?:\/\/.+/i.test(value),
          { message: 'Gorsel URL veya yuklenen /uploads/ yolu olmali' },
        ),
      z.null(),
    ])
    .optional(),
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

