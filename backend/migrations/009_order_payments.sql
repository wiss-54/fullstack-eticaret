ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(30),
  ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS provider_conversation_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stock_reserved BOOLEAN NOT NULL DEFAULT false;

-- Mevcut COD/havale siparisleri stok dusmus kabul edilir
UPDATE orders
SET
  stock_reserved = true,
  payment_status = CASE
    WHEN payment_method IN ('cod', 'manual') THEN 'unpaid'
    ELSE payment_status
  END
WHERE stock_reserved = false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_provider_payment_id
  ON orders (provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);
