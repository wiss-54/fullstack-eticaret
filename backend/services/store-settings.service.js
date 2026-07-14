const { pool } = require('../db');

const DEFAULT_FEATURES = [
  { title: 'Kisisellestirme', text: 'Her urune ozel secenekler ve not alani' },
  { title: 'Guvenli Siparis', text: 'Stok ve secenek kontrolu otomatik' },
  { title: 'Hizli Yonetim', text: 'Admin panelden urun ve secenek yonetimi' },
  { title: 'Canli Takip', text: 'Monitoring ile sistem durumu izleme' },
];

function mapRow(row) {
  return {
    brandName: row.brandName,
    logoUrl: row.logoUrl,
    accentColor: row.accentColor,
    heroEyebrow: row.heroEyebrow,
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    heroCtaLabel: row.heroCtaLabel,
    heroCtaHref: row.heroCtaHref,
    heroSecondaryCtaLabel: row.heroSecondaryCtaLabel,
    heroSecondaryCtaHref: row.heroSecondaryCtaHref,
    featureCards: Array.isArray(row.featureCards) ? row.featureCards : DEFAULT_FEATURES,
    productsEyebrow: row.productsEyebrow,
    productsTitle: row.productsTitle,
    productsSubtitle: row.productsSubtitle,
    footerLeft: row.footerLeft,
    footerRight: row.footerRight,
    updatedAt: row.updatedAt,
  };
}

const SELECT_SQL = `
  SELECT
    brand_name AS "brandName",
    logo_url AS "logoUrl",
    accent_color AS "accentColor",
    hero_eyebrow AS "heroEyebrow",
    hero_title AS "heroTitle",
    hero_subtitle AS "heroSubtitle",
    hero_cta_label AS "heroCtaLabel",
    hero_cta_href AS "heroCtaHref",
    hero_secondary_cta_label AS "heroSecondaryCtaLabel",
    hero_secondary_cta_href AS "heroSecondaryCtaHref",
    feature_cards AS "featureCards",
    products_eyebrow AS "productsEyebrow",
    products_title AS "productsTitle",
    products_subtitle AS "productsSubtitle",
    footer_left AS "footerLeft",
    footer_right AS "footerRight",
    updated_at AS "updatedAt"
  FROM store_settings
  WHERE id = 1
  LIMIT 1
`;

async function getStoreSettings() {
  const result = await pool.query(SELECT_SQL);
  if (result.rows.length === 0) {
    await pool.query('INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING');
    const again = await pool.query(SELECT_SQL);
    return mapRow(again.rows[0]);
  }
  return mapRow(result.rows[0]);
}

async function updateStoreSettings(input) {
  const result = await pool.query(
    `
      UPDATE store_settings
      SET
        brand_name = $1,
        logo_url = $2,
        accent_color = $3,
        hero_eyebrow = $4,
        hero_title = $5,
        hero_subtitle = $6,
        hero_cta_label = $7,
        hero_cta_href = $8,
        hero_secondary_cta_label = $9,
        hero_secondary_cta_href = $10,
        feature_cards = $11::jsonb,
        products_eyebrow = $12,
        products_title = $13,
        products_subtitle = $14,
        footer_left = $15,
        footer_right = $16,
        updated_at = NOW()
      WHERE id = 1
      RETURNING
        brand_name AS "brandName",
        logo_url AS "logoUrl",
        accent_color AS "accentColor",
        hero_eyebrow AS "heroEyebrow",
        hero_title AS "heroTitle",
        hero_subtitle AS "heroSubtitle",
        hero_cta_label AS "heroCtaLabel",
        hero_cta_href AS "heroCtaHref",
        hero_secondary_cta_label AS "heroSecondaryCtaLabel",
        hero_secondary_cta_href AS "heroSecondaryCtaHref",
        feature_cards AS "featureCards",
        products_eyebrow AS "productsEyebrow",
        products_title AS "productsTitle",
        products_subtitle AS "productsSubtitle",
        footer_left AS "footerLeft",
        footer_right AS "footerRight",
        updated_at AS "updatedAt"
    `,
    [
      input.brandName,
      input.logoUrl ?? null,
      input.accentColor,
      input.heroEyebrow,
      input.heroTitle,
      input.heroSubtitle,
      input.heroCtaLabel,
      input.heroCtaHref,
      input.heroSecondaryCtaLabel,
      input.heroSecondaryCtaHref,
      JSON.stringify(input.featureCards ?? DEFAULT_FEATURES),
      input.productsEyebrow,
      input.productsTitle,
      input.productsSubtitle,
      input.footerLeft,
      input.footerRight,
    ],
  );

  if (result.rows.length === 0) {
    await pool.query('INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING');
    return updateStoreSettings(input);
  }

  return mapRow(result.rows[0]);
}

module.exports = {
  getStoreSettings,
  updateStoreSettings,
  DEFAULT_FEATURES,
};
