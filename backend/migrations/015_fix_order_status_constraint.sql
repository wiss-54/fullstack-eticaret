-- Older environments can keep an outdated orders.status CHECK constraint
-- from before new admin workflow states were introduced.
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'preparing', 'shipped', 'cancelled'));
