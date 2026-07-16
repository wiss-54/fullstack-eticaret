ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS text_styles JSONB NOT NULL DEFAULT '{}'::jsonb;
