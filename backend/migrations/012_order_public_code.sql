-- Opaque customer-facing order code (do not expose sequential id volume).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS public_code VARCHAR(20);

UPDATE orders
SET public_code = 'ES-' || upper(substr(md5(id::text || created_at::text || random()::text), 1, 8))
WHERE public_code IS NULL;

ALTER TABLE orders
  ALTER COLUMN public_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_public_code
  ON orders (public_code);
