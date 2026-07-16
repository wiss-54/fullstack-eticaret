const { pool } = require('../db');
const {
  DEFAULT_FEATURES,
  DEFAULT_SECTIONS,
  getThemePreset,
  listThemePresets,
} = require('./store-theme-presets');

function mapRow(row) {
  return {
    brandName: row.brandName,
    logoUrl: row.logoUrl,
    accentColor: row.accentColor,
    themeId: row.themeId ?? 'classic-amber',
    surfaceStyle: row.surfaceStyle ?? 'warm',
    radiusStyle: row.radiusStyle ?? 'rounded',
    buttonStyle: row.buttonStyle ?? 'pill',
    heroLayout: row.heroLayout ?? 'split',
    fontStyle: row.fontStyle ?? 'classic',
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
    textStyles:
      row.textStyles && typeof row.textStyles === 'object' && !Array.isArray(row.textStyles)
        ? row.textStyles
        : {},
    sections: Array.isArray(row.sections) && row.sections.length > 0 ? row.sections : DEFAULT_SECTIONS,
    updatedAt: row.updatedAt,
  };
}

const SELECT_SQL = `
  SELECT
    brand_name AS "brandName",
    logo_url AS "logoUrl",
    accent_color AS "accentColor",
    theme_id AS "themeId",
    surface_style AS "surfaceStyle",
    radius_style AS "radiusStyle",
    button_style AS "buttonStyle",
    hero_layout AS "heroLayout",
    font_style AS "fontStyle",
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
    text_styles AS "textStyles",
    sections,
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
        theme_id = $4,
        surface_style = $5,
        radius_style = $6,
        button_style = $7,
        hero_layout = $8,
        font_style = $9,
        hero_eyebrow = $10,
        hero_title = $11,
        hero_subtitle = $12,
        hero_cta_label = $13,
        hero_cta_href = $14,
        hero_secondary_cta_label = $15,
        hero_secondary_cta_href = $16,
        feature_cards = $17::jsonb,
        products_eyebrow = $18,
        products_title = $19,
        products_subtitle = $20,
        footer_left = $21,
        footer_right = $22,
        text_styles = $23::jsonb,
        sections = $24::jsonb,
        updated_at = NOW()
      WHERE id = 1
      RETURNING
        brand_name AS "brandName",
        logo_url AS "logoUrl",
        accent_color AS "accentColor",
        theme_id AS "themeId",
        surface_style AS "surfaceStyle",
        radius_style AS "radiusStyle",
        button_style AS "buttonStyle",
        hero_layout AS "heroLayout",
        font_style AS "fontStyle",
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
        text_styles AS "textStyles",
        sections,
        updated_at AS "updatedAt"
    `,
    [
      input.brandName,
      input.logoUrl ?? null,
      input.accentColor,
      input.themeId,
      input.surfaceStyle,
      input.radiusStyle,
      input.buttonStyle,
      input.heroLayout,
      input.fontStyle,
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
      JSON.stringify(input.textStyles ?? {}),
      JSON.stringify(input.sections ?? DEFAULT_SECTIONS),
    ],
  );

  if (result.rows.length === 0) {
    await pool.query('INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING');
    return updateStoreSettings(input);
  }

  return mapRow(result.rows[0]);
}

async function applyThemePreset(themeId) {
  const preset = getThemePreset(themeId);
  if (!preset) {
    const error = new Error('Tema bulunamadi');
    error.statusCode = 404;
    throw error;
  }

  const current = await getStoreSettings();
  return updateStoreSettings({
    ...current,
    ...preset.settings,
    brandName: current.brandName,
    logoUrl: current.logoUrl,
    footerLeft: current.footerLeft,
    footerRight: current.footerRight,
  });
}

module.exports = {
  getStoreSettings,
  updateStoreSettings,
  applyThemePreset,
  listThemePresets,
  DEFAULT_FEATURES,
  DEFAULT_SECTIONS,
};
