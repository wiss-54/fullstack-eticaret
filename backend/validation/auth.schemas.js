const { z } = require('zod');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10,11}$/, 'Telefon numarasi 10 veya 11 haneli olmali');

const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(200),
  fullName: z.string().trim().min(2).max(200),
  phone: phoneSchema.optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(200),
});

const shippingAddressSchema = z.object({
  shippingFullName: z.string().trim().min(2).max(200),
  phone: phoneSchema.optional(),
  shippingCity: z.string().trim().min(2).max(100),
  shippingDistrict: z.string().trim().min(2).max(100),
  shippingAddressLine: z.string().trim().min(5).max(500),
});

module.exports = {
  registerSchema,
  loginSchema,
  shippingAddressSchema,
};
