const { z } = require('zod');

const choiceSchema = z.object({
  label: z.string().trim().min(1).max(200),
  priceDelta: z.number().finite().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

const productOptionSchema = z.object({
  label: z.string().trim().min(1).max(100),
  optionType: z.enum(['select', 'text']),
  required: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  choices: z.array(choiceSchema).optional(),
});

const replaceProductOptionsSchema = z.array(productOptionSchema).max(20);

module.exports = {
  replaceProductOptionsSchema,
};
