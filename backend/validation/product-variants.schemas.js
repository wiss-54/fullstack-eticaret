const { z } = require('zod');

const axisValueSchema = z.object({
  label: z.string().trim().min(1).max(200),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
});

const variantAxisSchema = z.object({
  name: z.string().trim().min(1).max(100),
  displayStyle: z.enum(['list', 'button', 'color']).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  values: z.array(axisValueSchema).min(1).max(30),
});

const variantRowSchema = z.object({
  valueLabels: z.array(z.string().trim().min(1).max(200)).min(1).max(3),
  sku: z.string().trim().max(80).optional().nullable(),
  price: z.number().finite().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

const replaceProductVariantsSchema = z.object({
  axes: z.array(variantAxisSchema).max(3),
  variants: z.array(variantRowSchema).max(512),
});

module.exports = {
  replaceProductVariantsSchema,
};
