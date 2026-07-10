const { z } = require('zod');

const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(140).optional(),
  parentId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

const categoryUpdateSchema = categoryCreateSchema;

module.exports = {
  categoryCreateSchema,
  categoryUpdateSchema,
};
