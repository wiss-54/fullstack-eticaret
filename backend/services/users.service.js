const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { scheduleEmailVerificationEmail } = require('./email.service');

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function mapUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone,
    emailVerified: row.emailVerified,
    shippingCity: row.shippingCity ?? null,
    shippingDistrict: row.shippingDistrict ?? null,
    shippingAddressLine: row.shippingAddressLine ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function getUserByEmail(email) {
  const result = await pool.query(
    `
      SELECT
        id,
        email,
        password_hash AS "passwordHash",
        full_name AS "fullName",
        phone,
        email_verified AS "emailVerified",
        email_verification_token AS "emailVerificationToken",
        email_verification_expires_at AS "emailVerificationExpiresAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email.toLowerCase().trim()],
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

async function getUserById(id) {
  const result = await pool.query(
    `
      SELECT
        id,
        email,
        full_name AS "fullName",
        phone,
        email_verified AS "emailVerified",
        shipping_city AS "shippingCity",
        shipping_district AS "shippingDistrict",
        shipping_address_line AS "shippingAddressLine",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  if (result.rows.length === 0) return null;
  return mapUserRow(result.rows[0]);
}

async function updateUserShippingAddress(userId, payload) {
  const result = await pool.query(
    `
      UPDATE users
      SET
        phone = COALESCE($2, phone),
        shipping_city = $3,
        shipping_district = $4,
        shipping_address_line = $5,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        email,
        full_name AS "fullName",
        phone,
        email_verified AS "emailVerified",
        shipping_city AS "shippingCity",
        shipping_district AS "shippingDistrict",
        shipping_address_line AS "shippingAddressLine",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      userId,
      payload.phone?.trim() || null,
      payload.shippingCity.trim(),
      payload.shippingDistrict.trim(),
      payload.shippingAddressLine.trim(),
    ],
  );

  if (result.rows.length === 0) return null;
  return mapUserRow(result.rows[0]);
}

async function createUser({ email, password, fullName, phone }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = createVerificationToken();
  const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

  const result = await pool.query(
    `
      INSERT INTO users (
        email,
        password_hash,
        full_name,
        phone,
        email_verified,
        email_verification_token,
        email_verification_expires_at
      )
      VALUES ($1, $2, $3, $4, false, $5, $6)
      RETURNING
        id,
        email,
        full_name AS "fullName",
        phone,
        email_verified AS "emailVerified",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      email.toLowerCase().trim(),
      passwordHash,
      fullName.trim(),
      phone?.trim() || null,
      verificationToken,
      verificationExpiresAt,
    ],
  );

  const user = mapUserRow(result.rows[0]);
  scheduleEmailVerificationEmail({ ...user, verificationToken });
  return user;
}

async function verifyUserCredentials(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return { status: 'invalid' };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { status: 'invalid' };

  if (!user.emailVerified) {
    return { status: 'unverified', user: mapUserRow(user) };
  }

  return { status: 'ok', user: mapUserRow(user) };
}

async function verifyEmailByToken(token) {
  const normalized = token?.trim();
  if (!normalized) return null;

  const result = await pool.query(
    `
      UPDATE users
      SET
        email_verified = true,
        email_verification_token = NULL,
        email_verification_expires_at = NULL,
        updated_at = NOW()
      WHERE email_verification_token = $1
        AND email_verification_expires_at > NOW()
        AND email_verified = false
      RETURNING
        id,
        email,
        full_name AS "fullName",
        phone,
        email_verified AS "emailVerified",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [normalized],
  );

  if (result.rows.length === 0) return null;
  return mapUserRow(result.rows[0]);
}

async function resendVerificationEmail(email) {
  const user = await getUserByEmail(email);
  if (!user || user.emailVerified) {
    return { sent: false };
  }

  const verificationToken = createVerificationToken();
  const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

  await pool.query(
    `
      UPDATE users
      SET
        email_verification_token = $2,
        email_verification_expires_at = $3,
        updated_at = NOW()
      WHERE id = $1
        AND email_verified = false
    `,
    [user.id, verificationToken, verificationExpiresAt],
  );

  scheduleEmailVerificationEmail({
    ...mapUserRow(user),
    verificationToken,
  });

  return { sent: true };
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  verifyUserCredentials,
  verifyEmailByToken,
  resendVerificationEmail,
  updateUserShippingAddress,
};
