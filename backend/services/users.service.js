const bcrypt = require('bcryptjs');
const { pool } = require('../db');

function mapUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
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

async function createUser({ email, password, fullName, phone }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `
      INSERT INTO users (email, password_hash, full_name, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        email,
        full_name AS "fullName",
        phone,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [email.toLowerCase().trim(), passwordHash, fullName.trim(), phone?.trim() || null],
  );

  return mapUserRow(result.rows[0]);
}

async function verifyUserCredentials(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return mapUserRow(user);
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  verifyUserCredentials,
};
