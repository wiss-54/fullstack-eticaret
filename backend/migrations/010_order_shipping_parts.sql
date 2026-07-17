ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS shipping_district VARCHAR(100),
  ADD COLUMN IF NOT EXISTS shipping_address_line TEXT;

-- Eski tek alanli adresleri acik adres satirina tasir
UPDATE orders
SET shipping_address_line = shipping_address
WHERE shipping_address_line IS NULL
  AND shipping_address IS NOT NULL
  AND shipping_address <> '';
