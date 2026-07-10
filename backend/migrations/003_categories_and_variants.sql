CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) NOT NULL DEFAULT 'simple';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_product_type_check'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_product_type_check
      CHECK (product_type IN ('simple', 'variant'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS product_variant_axes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_style VARCHAR(20) NOT NULL DEFAULT 'button'
    CHECK (display_style IN ('list', 'button', 'color')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_variant_axis_values (
  id SERIAL PRIMARY KEY,
  axis_id INTEGER NOT NULL REFERENCES product_variant_axes(id) ON DELETE CASCADE,
  label VARCHAR(200) NOT NULL,
  color_hex VARCHAR(7),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_key VARCHAR(255) NOT NULL,
  sku VARCHAR(80),
  price NUMERIC(12,2),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, option_key)
);

CREATE TABLE IF NOT EXISTS product_variant_selections (
  variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  axis_id INTEGER NOT NULL REFERENCES product_variant_axes(id) ON DELETE CASCADE,
  axis_value_id INTEGER NOT NULL REFERENCES product_variant_axis_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, axis_id)
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_axes_product_id ON product_variant_axes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_axis_values_axis_id ON product_variant_axis_values(axis_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
