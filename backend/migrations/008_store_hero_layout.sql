ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS hero_text_items_order JSONB NOT NULL DEFAULT '["eyebrow","title","subtitle","ctas"]'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_cta_buttons_order JSONB NOT NULL DEFAULT '["primary","secondary"]'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_feature_side VARCHAR(10) NOT NULL DEFAULT 'right';

UPDATE store_settings
SET
  hero_text_items_order = COALESCE(hero_text_items_order, '["eyebrow","title","subtitle","ctas"]'::jsonb),
  hero_cta_buttons_order = COALESCE(hero_cta_buttons_order, '["primary","secondary"]'::jsonb),
  hero_feature_side = COALESCE(hero_feature_side, 'right')
WHERE id = 1;
