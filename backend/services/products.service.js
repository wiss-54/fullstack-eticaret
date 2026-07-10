const { pool } = require('../db');

const mapProductRow = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  stock: row.stock,
  imageUrl: row.imageUrl,
  categoryId: row.categoryId ?? null,
  categoryName: row.categoryName ?? null,
  productType: row.productType ?? 'simple',
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const productSelect = `
  p.id,
  p.name,
  p.description,
  p.price,
  p.stock,
  p.image_url AS "imageUrl",
  p.category_id AS "categoryId",
  c.name AS "categoryName",
  p.product_type AS "productType",
  p.created_at AS "createdAt",
  p.updated_at AS "updatedAt"
`;

async function listProducts(limit = 20, offset = 0, categoryId = null) {
  const params = [limit, offset];
  let whereClause = '';

  if (categoryId) {
    params.push(categoryId);
    whereClause = `WHERE p.category_id = $3`;
  }

  const result = await pool.query(
    `
      SELECT ${productSelect}
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereClause}
      ORDER BY p.id DESC
      LIMIT $1 OFFSET $2
    `,
    params,
  );

  return result.rows.map(mapProductRow);
}

async function getProductById(id) {
  const result = await pool.query(
    `
      SELECT ${productSelect}
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1
    `,
    [id],
  );

  if (result.rows.length === 0) return null;
  return mapProductRow(result.rows[0]);
}

async function createProduct({ name, description, price, stock, imageUrl, categoryId, productType }) {
  const result = await pool.query(
    `
      INSERT INTO products (name, description, price, stock, image_url, category_id, product_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        name,
        description,
        price,
        stock,
        image_url AS "imageUrl",
        category_id AS "categoryId",
        product_type AS "productType",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      name,
      description,
      price,
      stock,
      imageUrl ?? null,
      categoryId ?? null,
      productType ?? 'simple',
    ],
  );

  const product = mapProductRow({ ...result.rows[0], categoryName: null });
  if (product.categoryId) {
    const withCategory = await getProductById(product.id);
    return withCategory ?? product;
  }
  return product;
}

async function updateProduct(
  id,
  { name, description, price, stock, imageUrl, categoryId, productType },
) {
  const result = await pool.query(
    `
      UPDATE products
      SET
        name = $1,
        description = $2,
        price = $3,
        stock = $4,
        image_url = $5,
        category_id = $6,
        product_type = COALESCE($7, product_type),
        updated_at = NOW()
      WHERE id = $8
      RETURNING id
    `,
    [
      name,
      description,
      price,
      stock,
      imageUrl ?? null,
      categoryId ?? null,
      productType ?? null,
      id,
    ],
  );

  if (result.rows.length === 0) return null;
  return getProductById(id);
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
