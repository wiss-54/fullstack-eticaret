CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'shipped', 'cancelled')),
  payment_method VARCHAR(30) NOT NULL DEFAULT 'manual',
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(30),
  shipping_address TEXT NOT NULL,
  order_note TEXT,
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  product_name VARCHAR(200) NOT NULL,
  variant_label VARCHAR(255),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  selected_options JSONB NOT NULL DEFAULT '[]',
  customer_note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
