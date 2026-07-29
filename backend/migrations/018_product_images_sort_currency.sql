-- Coklu urun gorseli + vitrin sirasi + fiyat kuru ayarlari

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_urls JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE products
SET image_urls = CASE
  WHEN image_url IS NOT NULL AND btrim(image_url) <> '' THEN jsonb_build_array(image_url)
  ELSE '[]'::jsonb
END
WHERE image_urls = '[]'::jsonb OR image_urls IS NULL;

UPDATE products
SET sort_order = id
WHERE sort_order = 0;

CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products (sort_order ASC, id DESC);

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) NOT NULL DEFAULT 'TRY';

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS currency_decimals SMALLINT NOT NULL DEFAULT 2
    CHECK (currency_decimals >= 0 AND currency_decimals <= 4);
