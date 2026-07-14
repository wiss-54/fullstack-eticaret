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

const baseSection = {
  id: z.string().trim().min(1).max(80),
  enabled: z.boolean(),
};

const sectionSchema = z.discriminatedUnion('type', [
  z.object({ ...baseSection, type: z.literal('hero') }),
  z.object({ ...baseSection, type: z.literal('features') }),
  z.object({ ...baseSection, type: z.literal('products') }),
  z.object({
    ...baseSection,
    type: z.literal('rich_text'),
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(2000),
    align: z.enum(['left', 'center']).optional(),
  }),
  z.object({
    ...baseSection,
    type: z.literal('banner'),
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(1000),
    ctaLabel: z.string().trim().max(100).optional(),
    ctaHref: z.string().trim().max(300).optional(),
    tone: z.enum(['accent', 'muted', 'dark']).optional(),
  }),
  z.object({
    ...baseSection,
    type: z.literal('cta'),
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(1000),
    ctaLabel: z.string().trim().min(1).max(100),
    ctaHref: z.string().trim().min(1).max(300),
  }),
]);

const storeSettingsUpdateSchema = z.object({
  brandName: z.string().trim().min(1).max(100),
  logoUrl: logoUrlSchema,
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Renk #RRGGBB formatinda olmali'),
  themeId: z.enum(['classic-amber', 'modern-slate', 'soft-blush', 'bold-ink']),
  surfaceStyle: z.enum(['warm', 'cool', 'soft', 'contrast']),
  radiusStyle: z.enum(['soft', 'rounded', 'sharp']),
  buttonStyle: z.enum(['pill', 'rounded', 'square']),
  heroLayout: z.enum(['split', 'centered', 'minimal']),
  fontStyle: z.enum(['classic', 'modern', 'elegant']),
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
  sections: z.array(sectionSchema).min(1).max(20),
});

const applyThemeSchema = z.object({
  themeId: z.enum(['classic-amber', 'modern-slate', 'soft-blush', 'bold-ink']),
});

module.exports = {
  storeSettingsUpdateSchema,
  applyThemeSchema,
};
