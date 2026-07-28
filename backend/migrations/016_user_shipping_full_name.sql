ALTER TABLE users
  ADD COLUMN IF NOT EXISTS shipping_full_name VARCHAR(200);

UPDATE users
SET shipping_full_name = full_name
WHERE shipping_full_name IS NULL;
