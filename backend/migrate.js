/* eslint-disable security/detect-non-literal-fs-filename */
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  await ensureMigrationsTable();

  for (const file of files) {
    const alreadyApplied = await pool.query(
      'SELECT 1 FROM migrations WHERE name = $1 LIMIT 1',
      [file],
    );
    if (alreadyApplied.rows.length > 0) continue;

    const sqlPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO migrations(name) VALUES ($1)', [file]);
      await pool.query('COMMIT');
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  }
}

module.exports = {
  runMigrations,
};

