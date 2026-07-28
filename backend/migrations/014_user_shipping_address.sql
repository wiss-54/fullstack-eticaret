-- Saved default shipping address on customer profile
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS shipping_city TEXT,
  ADD COLUMN IF NOT EXISTS shipping_district TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address_line TEXT;
