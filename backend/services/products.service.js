const { pool } = require('../db');

function normalizeImageUrls(imageUrls, imageUrl) {
  const fromArray = Array.isArray(imageUrls)
    ? imageUrls.filter((url) => typeof url === 'string' && url.trim())
    : [];
  if (fromArray.length > 0) {
    return [...new Set(fromArray.map((url) => url.trim()))];
  }
  if (typeof imageUrl === 'string' && imageUrl.trim()) {
    return [imageUrl.trim()];
  }
  return [];
}

const mapProductRow = (row) => {
  const imageUrls = normalizeImageUrls(row.imageUrls, row.imageUrl);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    stock: row.stock,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    categoryId: row.categoryId ?? null,
    categoryName: row.categoryName ?? null,
    productType: row.productType ?? 'simple',
    sortOrder: row.sortOrder ?? row.id ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const productSelect = `
  p.id,
  p.name,
  p.description,
  p.price,
  p.stock,
  p.image_url AS "imageUrl",
  COALESCE(p.image_urls, '[]'::jsonb) AS "imageUrls",
  p.category_id AS "categoryId",
  c.name AS "categoryName",
  p.product_type AS "productType",
  COALESCE(p.sort_order, p.id) AS "sortOrder",
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
      ORDER BY COALESCE(p.sort_order, p.id) ASC, p.id DESC
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

async function createProduct({
  name,
  description,
  price,
  stock,
  imageUrl,
  imageUrls,
  categoryId,
  productType,
  sortOrder,
}) {
  const urls = normalizeImageUrls(imageUrls, imageUrl);
  const result = await pool.query(
    `
      INSERT INTO products (
        name,
        description,
        price,
        stock,
        image_url,
        image_urls,
        category_id,
        product_type,
        sort_order
      )
      VALUES (
        $1, $2, $3, $4, $5, $6::jsonb, $7, $8,
        COALESCE($9, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM products))
      )
      RETURNING
        id,
        name,
        description,
        price,
        stock,
        image_url AS "imageUrl",
        image_urls AS "imageUrls",
        category_id AS "categoryId",
        product_type AS "productType",
        sort_order AS "sortOrder",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      name,
      description,
      price,
      stock,
      urls[0] ?? null,
      JSON.stringify(urls),
      categoryId ?? null,
      productType ?? 'simple',
      sortOrder ?? null,
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
  { name, description, price, stock, imageUrl, imageUrls, categoryId, productType, sortOrder },
) {
  const urls = normalizeImageUrls(imageUrls, imageUrl);
  const result = await pool.query(
    `
      UPDATE products
      SET
        name = $1,
        description = $2,
        price = $3,
        stock = $4,
        image_url = $5,
        image_urls = $6::jsonb,
        category_id = $7,
        product_type = COALESCE($8, product_type),
        sort_order = COALESCE($9, sort_order),
        updated_at = NOW()
      WHERE id = $10
      RETURNING id
    `,
    [
      name,
      description,
      price,
      stock,
      urls[0] ?? null,
      JSON.stringify(urls),
      categoryId ?? null,
      productType ?? null,
      sortOrder ?? null,
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

async function reorderProducts(orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return listProducts(500, 0, null);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let index = 0; index < orderedIds.length; index += 1) {
      const id = Number(orderedIds[index]);
      if (!Number.isInteger(id) || id < 1) continue;
      await client.query(
        `
          UPDATE products
          SET sort_order = $1, updated_at = NOW()
          WHERE id = $2
        `,
        [index + 1, id],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return listProducts(500, 0, null);
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
};
