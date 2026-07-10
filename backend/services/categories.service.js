const { pool } = require('../db');

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

function mapCategoryRow(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
  };
}

async function listCategories() {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        slug,
        parent_id AS "parentId",
        sort_order AS "sortOrder",
        created_at AS "createdAt"
      FROM categories
      ORDER BY sort_order ASC, name ASC
    `,
  );

  return result.rows.map(mapCategoryRow);
}

async function getCategoryById(id) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        slug,
        parent_id AS "parentId",
        sort_order AS "sortOrder",
        created_at AS "createdAt"
      FROM categories
      WHERE id = $1
    `,
    [id],
  );

  if (result.rows.length === 0) return null;
  return mapCategoryRow(result.rows[0]);
}

async function createCategory({ name, slug, parentId, sortOrder }) {
  const finalSlug = slug?.trim() || slugify(name);
  const result = await pool.query(
    `
      INSERT INTO categories (name, slug, parent_id, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        name,
        slug,
        parent_id AS "parentId",
        sort_order AS "sortOrder",
        created_at AS "createdAt"
    `,
    [name, finalSlug, parentId ?? null, sortOrder ?? 0],
  );

  return mapCategoryRow(result.rows[0]);
}

async function updateCategory(id, { name, slug, parentId, sortOrder }) {
  const result = await pool.query(
    `
      UPDATE categories
      SET
        name = $1,
        slug = COALESCE($2, slug),
        parent_id = $3,
        sort_order = $4
      WHERE id = $5
      RETURNING
        id,
        name,
        slug,
        parent_id AS "parentId",
        sort_order AS "sortOrder",
        created_at AS "createdAt"
    `,
    [name, slug?.trim() || null, parentId ?? null, sortOrder ?? 0, id],
  );

  if (result.rows.length === 0) return null;
  return mapCategoryRow(result.rows[0]);
}

async function deleteCategory(id) {
  const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  slugify,
};
