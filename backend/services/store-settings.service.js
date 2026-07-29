const { pool } = require('../db');
const {
  DEFAULT_FEATURES,
  DEFAULT_SECTIONS,
  getThemePreset,
  listThemePresets,
} = require('./store-theme-presets');

const DEFAULT_HERO_TEXT_ITEMS_ORDER = ['eyebrow', 'title', 'subtitle', 'ctas'];
const DEFAULT_HERO_CTA_BUTTONS_ORDER = ['primary', 'secondary'];
const DEFAULT_HERO_FEATURE_SIDE = 'right';
const DEFAULT_NAV_ITEM_1_LABEL = 'Kategoriler';
const DEFAULT_NAV_ITEM_1_HREF = '#kategoriler';
const DEFAULT_NAV_ITEM_2_LABEL = 'Koleksiyon';
const DEFAULT_NAV_ITEM_2_HREF = '#urunler';

function sameHashTarget(a, b) {
  const left = String(a || '').replace(/^\//, '');
  const right = String(b || '').replace(/^\//, '');
  return Boolean(left) && left === right;
}

/** Eski kayitlarda iki link de #urunler ise kategoriler ayri hedefe alinir. */
function normalizeNavItem1Href(href, otherHref) {
  const value = href || DEFAULT_NAV_ITEM_1_HREF;
  const other = otherHref || DEFAULT_NAV_ITEM_2_HREF;
  if (sameHashTarget(value, '#urunler') && sameHashTarget(other, '#urunler')) {
    return DEFAULT_NAV_ITEM_1_HREF;
  }
  return value;
}

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
    heroTextItemsOrder: Array.isArray(row.heroTextItemsOrder)
      ? row.heroTextItemsOrder
      : DEFAULT_HERO_TEXT_ITEMS_ORDER,
    heroCtaButtonsOrder: Array.isArray(row.heroCtaButtonsOrder)
      ? row.heroCtaButtonsOrder
      : DEFAULT_HERO_CTA_BUTTONS_ORDER,
    heroFeatureSide:
      row.heroFeatureSide === 'left' || row.heroFeatureSide === 'right'
        ? row.heroFeatureSide
        : DEFAULT_HERO_FEATURE_SIDE,
    featureCards: Array.isArray(row.featureCards) ? row.featureCards : DEFAULT_FEATURES,
    productsEyebrow: row.productsEyebrow,
    productsTitle: row.productsTitle,
    productsSubtitle: row.productsSubtitle,
    navItem1Label: row.navItem1Label || DEFAULT_NAV_ITEM_1_LABEL,
    navItem1Href: normalizeNavItem1Href(row.navItem1Href, row.navItem2Href),
    navItem2Label: row.navItem2Label || DEFAULT_NAV_ITEM_2_LABEL,
    navItem2Href: row.navItem2Href || DEFAULT_NAV_ITEM_2_HREF,
    footerLeft: row.footerLeft,
    footerRight: row.footerRight,
    currencyCode: row.currencyCode || 'TRY',
    currencyDecimals:
      typeof row.currencyDecimals === 'number' && Number.isFinite(row.currencyDecimals)
        ? Math.min(4, Math.max(0, Math.floor(row.currencyDecimals)))
        : 2,
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
    hero_text_items_order AS "heroTextItemsOrder",
    hero_cta_buttons_order AS "heroCtaButtonsOrder",
    hero_feature_side AS "heroFeatureSide",
    feature_cards AS "featureCards",
    products_eyebrow AS "productsEyebrow",
    products_title AS "productsTitle",
    products_subtitle AS "productsSubtitle",
    nav_item_1_label AS "navItem1Label",
    nav_item_1_href AS "navItem1Href",
    nav_item_2_label AS "navItem2Label",
    nav_item_2_href AS "navItem2Href",
    footer_left AS "footerLeft",
    footer_right AS "footerRight",
    COALESCE(currency_code, 'TRY') AS "currencyCode",
    COALESCE(currency_decimals, 2) AS "currencyDecimals",
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
  const heroTextItemsOrder = Array.isArray(input.heroTextItemsOrder)
    ? input.heroTextItemsOrder
    : DEFAULT_HERO_TEXT_ITEMS_ORDER;
  const heroCtaButtonsOrder = Array.isArray(input.heroCtaButtonsOrder)
    ? input.heroCtaButtonsOrder
    : DEFAULT_HERO_CTA_BUTTONS_ORDER;
  const heroFeatureSide =
    input.heroFeatureSide === 'left' || input.heroFeatureSide === 'right'
      ? input.heroFeatureSide
      : DEFAULT_HERO_FEATURE_SIDE;

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
        hero_text_items_order = $18::jsonb,
        hero_cta_buttons_order = $19::jsonb,
        hero_feature_side = $20,
        products_eyebrow = $21,
        products_title = $22,
        products_subtitle = $23,
        nav_item_1_label = $24,
        nav_item_1_href = $25,
        nav_item_2_label = $26,
        nav_item_2_href = $27,
        footer_left = $28,
        footer_right = $29,
        currency_code = $30,
        currency_decimals = $31,
        text_styles = $32::jsonb,
        sections = $33::jsonb,
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
        hero_text_items_order AS "heroTextItemsOrder",
        hero_cta_buttons_order AS "heroCtaButtonsOrder",
        hero_feature_side AS "heroFeatureSide",
        feature_cards AS "featureCards",
        products_eyebrow AS "productsEyebrow",
        products_title AS "productsTitle",
        products_subtitle AS "productsSubtitle",
        nav_item_1_label AS "navItem1Label",
        nav_item_1_href AS "navItem1Href",
        nav_item_2_label AS "navItem2Label",
        nav_item_2_href AS "navItem2Href",
        footer_left AS "footerLeft",
        footer_right AS "footerRight",
        COALESCE(currency_code, 'TRY') AS "currencyCode",
        COALESCE(currency_decimals, 2) AS "currencyDecimals",
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
      JSON.stringify(heroTextItemsOrder),
      JSON.stringify(heroCtaButtonsOrder),
      heroFeatureSide,
      input.productsEyebrow,
      input.productsTitle,
      input.productsSubtitle,
      input.navItem1Label || DEFAULT_NAV_ITEM_1_LABEL,
      input.navItem1Href || DEFAULT_NAV_ITEM_1_HREF,
      input.navItem2Label || DEFAULT_NAV_ITEM_2_LABEL,
      input.navItem2Href || DEFAULT_NAV_ITEM_2_HREF,
      input.footerLeft,
      input.footerRight,
      (input.currencyCode || 'TRY').toUpperCase(),
      typeof input.currencyDecimals === 'number' ? input.currencyDecimals : 2,
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
    navItem1Label: current.navItem1Label,
    navItem1Href: current.navItem1Href,
    navItem2Label: current.navItem2Label,
    navItem2Href: current.navItem2Href,
    footerLeft: current.footerLeft,
    footerRight: current.footerRight,
    currencyCode: current.currencyCode,
    currencyDecimals: current.currencyDecimals,
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
