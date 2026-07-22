CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand_name VARCHAR(100) NOT NULL DEFAULT 'EticaretShop',
  logo_url TEXT,
  accent_color VARCHAR(20) NOT NULL DEFAULT '#92400e',
  hero_eyebrow VARCHAR(120) NOT NULL DEFAULT 'EticaretShop',
  hero_title VARCHAR(200) NOT NULL DEFAULT 'Ozel anlarina ozel urunler',
  hero_subtitle TEXT NOT NULL DEFAULT 'Kişiselleştirilebilir seçenekler, sipariş notu ve güvenli alışveriş.',
  hero_cta_label VARCHAR(100) NOT NULL DEFAULT 'Urunleri Kesfet',
  hero_cta_href VARCHAR(300) NOT NULL DEFAULT '#urunler',
  hero_secondary_cta_label VARCHAR(100) NOT NULL DEFAULT 'Sepetime Git',
  hero_secondary_cta_href VARCHAR(300) NOT NULL DEFAULT '/sepet',
  feature_cards JSONB NOT NULL DEFAULT '[
    {"title":"Kisisellestirme","text":"Her urune ozel secenekler ve not alani"},
    {"title":"Guvenli Siparis","text":"Stok ve secenek kontrolu otomatik"},
    {"title":"Hizli Yonetim","text":"Admin panelden urun ve secenek yonetimi"},
    {"title":"Canli Takip","text":"Monitoring ile sistem durumu izleme"}
  ]'::jsonb,
  products_eyebrow VARCHAR(120) NOT NULL DEFAULT 'Koleksiyon',
  products_title VARCHAR(200) NOT NULL DEFAULT 'One cikan urunler',
  products_subtitle TEXT NOT NULL DEFAULT 'Varyantli urunlerde beden/renk bazli stok, kategoriler ve kisisellestirme alanlari desteklenir.',
  footer_left TEXT NOT NULL DEFAULT 'EticaretShop. Tum haklari saklidir.',
  footer_right TEXT NOT NULL DEFAULT 'Guvenli odeme ve kisisellestirme altyapisi gelistiriliyor.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO store_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
