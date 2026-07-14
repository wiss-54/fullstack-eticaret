const { z } = require('zod');

const featureCardSchema = z.object({
  title: z.string().trim().min(1).max(80),
  text: z.string().trim().min(1).max(200),
});

const logoUrlSchema = z.preprocess(
  (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string' && v.trim() === '') return null;
    return typeof v === 'string' ? v.trim() : v;
  },
  z
    .union([
      z
        .string()
        .max(2000)
        .refine(
          (value) => value.startsWith('/uploads/') || /^https?:\/\/.+/i.test(value),
          { message: 'Logo URL veya /uploads/ yolu olmali' },
        ),
      z.null(),
    ])
    .optional(),
);

const storeSettingsUpdateSchema = z.object({
  brandName: z.string().trim().min(1).max(100),
  logoUrl: logoUrlSchema,
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Renk #RRGGBB formatinda olmali'),
  heroEyebrow: z.string().trim().min(1).max(120),
  heroTitle: z.string().trim().min(1).max(200),
  heroSubtitle: z.string().trim().min(1).max(1000),
  heroCtaLabel: z.string().trim().min(1).max(100),
  heroCtaHref: z.string().trim().min(1).max(300),
  heroSecondaryCtaLabel: z.string().trim().min(1).max(100),
  heroSecondaryCtaHref: z.string().trim().min(1).max(300),
  featureCards: z.array(featureCardSchema).min(0).max(6),
  productsEyebrow: z.string().trim().min(1).max(120),
  productsTitle: z.string().trim().min(1).max(200),
  productsSubtitle: z.string().trim().min(1).max(1000),
  footerLeft: z.string().trim().min(1).max(500),
  footerRight: z.string().trim().min(1).max(500),
});

module.exports = {
  storeSettingsUpdateSchema,
};
