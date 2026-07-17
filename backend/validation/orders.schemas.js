const { z } = require('zod');

const selectedOptionSchema = z.object({
  optionId: z.number().int().positive(),
  label: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(200),
  priceDelta: z.number().finite().optional(),
});

const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().positive().max(99),
  selectedOptions: z.array(selectedOptionSchema).optional(),
  customerNote: z.string().trim().max(500).optional(),
});

const createOrderSchema = z.object({
  shippingCity: z.string().trim().min(2).max(100),
  shippingDistrict: z.string().trim().min(2).max(100),
  shippingAddressLine: z.string().trim().min(5).max(1000),
  customerPhone: z.string().trim().min(10).max(30),
  orderNote: z.string().trim().max(1000).optional(),
  paymentMethod: z.enum(['manual', 'cod', 'paytr']).optional(),
  items: z.array(orderItemSchema).min(1).max(50),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'shipped', 'cancelled']),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
