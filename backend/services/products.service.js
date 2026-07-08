const { pool } = require('../db');

const mapProductRow = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  stock: row.stock,
  imageUrl: row.imageUrl,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

async function listProducts(limit = 20, offset = 0) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        description,
        price,
        stock,
        image_url AS "imageUrl",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM products
      ORDER BY id DESC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );

  return result.rows.map(mapProductRow);
}

async function getProductById(id) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        description,
        price,
        stock,
        image_url AS "imageUrl",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM products
      WHERE id = $1
    `,
    [id],
  );

  if (result.rows.length === 0) return null;
  return mapProductRow(result.rows[0]);
}

async function createProduct({ name, description, price, stock, imageUrl }) {
  const result = await pool.query(
    `
      INSERT INTO products (name, description, price, stock, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        name,
        description,
        price,
        stock,
        image_url AS "imageUrl",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [name, description, price, stock, imageUrl ?? null],
  );

  return mapProductRow(result.rows[0]);
}

async function updateProduct(id, { name, description, price, stock, imageUrl }) {
  const result = await pool.query(
    `
      UPDATE products
      SET
        name = $1,
        description = $2,
        price = $3,
        stock = $4,
        image_url = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING
        id,
        name,
        description,
        price,
        stock,
        image_url AS "imageUrl",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [name, description, price, stock, imageUrl ?? null, id],
  );

  if (result.rows.length === 0) return null;
  return mapProductRow(result.rows[0]);
}

async function deleteProduct(id) {
  const result = await pool.query(
    `
      DELETE FROM products
      WHERE id = $1
      RETURNING id
    `,
    [id],
  );

  return result.rowCount > 0;
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

