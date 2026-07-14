ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS theme_id VARCHAR(50) NOT NULL DEFAULT 'classic-amber',
  ADD COLUMN IF NOT EXISTS surface_style VARCHAR(30) NOT NULL DEFAULT 'warm',
  ADD COLUMN IF NOT EXISTS radius_style VARCHAR(30) NOT NULL DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS button_style VARCHAR(30) NOT NULL DEFAULT 'pill',
  ADD COLUMN IF NOT EXISTS hero_layout VARCHAR(30) NOT NULL DEFAULT 'split',
  ADD COLUMN IF NOT EXISTS font_style VARCHAR(30) NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '[
    {"id":"hero","type":"hero","enabled":true},
    {"id":"features","type":"features","enabled":true},
    {"id":"products","type":"products","enabled":true}
  ]'::jsonb;

UPDATE store_settings
SET
  theme_id = COALESCE(theme_id, 'classic-amber'),
  sections = COALESCE(
    sections,
    '[
      {"id":"hero","type":"hero","enabled":true},
      {"id":"features","type":"features","enabled":true},
      {"id":"products","type":"products","enabled":true}
    ]'::jsonb
  )
WHERE id = 1;
