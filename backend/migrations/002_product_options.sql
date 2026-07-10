CREATE TABLE IF NOT EXISTS product_options (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  option_type VARCHAR(20) NOT NULL CHECK (option_type IN ('select', 'text')),
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_option_choices (
  id SERIAL PRIMARY KEY,
  option_id INTEGER NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
  label VARCHAR(200) NOT NULL,
  price_delta NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_options_product_id ON product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_product_option_choices_option_id ON product_option_choices(option_id);
