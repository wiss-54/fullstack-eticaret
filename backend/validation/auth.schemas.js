const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(200),
  fullName: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(10).max(30).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(200),
});

module.exports = {
  registerSchema,
  loginSchema,
};
