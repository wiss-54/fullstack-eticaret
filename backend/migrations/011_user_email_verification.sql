ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

-- Mevcut kullanicilar giris yapabilsin diye dogrulanmis say
UPDATE users SET email_verified = true WHERE email_verified = false;

CREATE INDEX IF NOT EXISTS idx_users_email_verification_token
  ON users(email_verification_token)
  WHERE email_verification_token IS NOT NULL;
