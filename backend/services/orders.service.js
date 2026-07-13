const { pool } = require('../db');
const { getProductById } = require('./products.service');
const { syncProductStockFromVariants } = require('./product-variants.service');

class OrderError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'OrderError';
    this.statusCode = statusCode;
  }
}

function mapOrderRow(row) {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    paymentMethod: row.paymentMethod,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    shippingAddress: row.shippingAddress,
    orderNote: row.orderNote,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapOrderItemRow(row) {
  return {
    id: row.id,
    orderId: row.orderId,
    productId: row.productId,
    variantId: row.variantId,
    productName: row.productName,
    variantLabel: row.variantLabel,
    unitPrice: Number(row.unitPrice),
    quantity: row.quantity,
    lineTotal: Number(row.lineTotal),
    selectedOptions: row.selectedOptions ?? [],
    customerNote: row.customerNote,
    sortOrder: row.sortOrder,
  };
}

async function getVariantSnapshot(client, variantId, productId) {
  const result = await client.query(
    `
      SELECT
        pv.id,
        pv.product_id AS "productId",
        pv.price,
        pv.stock,
        pv.is_active AS "isActive",
        COALESCE(
          string_agg(pva.label, ' / ' ORDER BY pva.sort_order, pva.id),
          ''
        ) AS "variantLabel"
      FROM product_variants pv
      LEFT JOIN product_variant_selections pvs ON pvs.variant_id = pv.id
      LEFT JOIN product_variant_axis_values pva ON pva.id = pvs.axis_value_id
      WHERE pv.id = $1 AND pv.product_id = $2
      GROUP BY pv.id
    `,
    [variantId, productId],
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

async function reserveStock(client, { productId, variantId, quantity }) {
  if (variantId) {
    const result = await client.query(
      `
        UPDATE product_variants
        SET stock = stock - $1
        WHERE id = $2
          AND product_id = $3
          AND is_active = true
          AND stock >= $1
        RETURNING id
      `,
      [quantity, variantId, productId],
    );

    if (result.rowCount === 0) {
      throw new OrderError('Secilen varyant icin yeterli stok yok', 409);
    }

    await syncProductStockFromVariants(productId, client);
    return;
  }

  const result = await client.query(
    `
      UPDATE products
      SET stock = stock - $1, updated_at = NOW()
      WHERE id = $2 AND stock >= $1
      RETURNING id
    `,
    [quantity, productId],
  );

  if (result.rowCount === 0) {
    throw new OrderError('Urun icin yeterli stok yok', 409);
  }
}

async function buildOrderLine(client, item) {
  const product = await getProductById(item.productId);
  if (!product) {
    throw new OrderError(`Urun bulunamadi: ${item.productId}`, 404);
  }

  let unitPrice = product.price;
  let variantLabel = null;
  let variantId = item.variantId ?? null;

  if (variantId) {
    const variant = await getVariantSnapshot(client, variantId, product.id);
    if (!variant || !variant.isActive) {
      throw new OrderError(`Gecersiz varyant: ${product.name}`, 400);
    }
    if (variant.stock < item.quantity) {
      throw new OrderError(`${product.name} (${variant.variantLabel}) icin yeterli stok yok`, 409);
    }
    unitPrice = variant.price ?? product.price;
    variantLabel = variant.variantLabel || null;
  } else if (product.productType === 'variant') {
    throw new OrderError(`${product.name} icin varyant secimi zorunlu`, 400);
  } else if (product.stock < item.quantity) {
    throw new OrderError(`${product.name} icin yeterli stok yok`, 409);
  }

  const optionDelta = (item.selectedOptions ?? []).reduce(
    (sum, option) => sum + Number(option.priceDelta ?? 0),
    0,
  );
  unitPrice += optionDelta;

  return {
    productId: product.id,
    variantId,
    productName: product.name,
    variantLabel,
    unitPrice,
    quantity: item.quantity,
    lineTotal: unitPrice * item.quantity,
    selectedOptions: item.selectedOptions ?? [],
    customerNote: item.customerNote?.trim() || null,
  };
}

async function createOrder(user, payload) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const builtLines = [];
    for (const item of payload.items) {
      builtLines.push(await buildOrderLine(client, item));
    }

    for (const line of builtLines) {
      await reserveStock(client, {
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
      });
    }

    const subtotal = builtLines.reduce((sum, line) => sum + line.lineTotal, 0);
    const paymentMethod = payload.paymentMethod ?? 'manual';

    const orderResult = await client.query(
      `
        INSERT INTO orders (
          user_id,
          status,
          payment_method,
          customer_name,
          customer_email,
          customer_phone,
          shipping_address,
          order_note,
          subtotal,
          total
        )
        VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
          id,
          user_id AS "userId",
          status,
          payment_method AS "paymentMethod",
          customer_name AS "customerName",
          customer_email AS "customerEmail",
          customer_phone AS "customerPhone",
          shipping_address AS "shippingAddress",
          order_note AS "orderNote",
          subtotal,
          total,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        user.id,
        paymentMethod,
        user.fullName,
        user.email,
        payload.customerPhone.trim(),
        payload.shippingAddress.trim(),
        payload.orderNote?.trim() || null,
        subtotal,
        subtotal,
      ],
    );

    const order = mapOrderRow(orderResult.rows[0]);
    const items = [];

    for (const [index, line] of builtLines.entries()) {
      const itemResult = await client.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            variant_id,
            product_name,
            variant_label,
            unit_price,
            quantity,
            line_total,
            selected_options,
            customer_note,
            sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
          RETURNING
            id,
            order_id AS "orderId",
            product_id AS "productId",
            variant_id AS "variantId",
            product_name AS "productName",
            variant_label AS "variantLabel",
            unit_price AS "unitPrice",
            quantity,
            line_total AS "lineTotal",
            selected_options AS "selectedOptions",
            customer_note AS "customerNote",
            sort_order AS "sortOrder"
        `,
        [
          order.id,
          line.productId,
          line.variantId,
          line.productName,
          line.variantLabel,
          line.unitPrice,
          line.quantity,
          line.lineTotal,
          JSON.stringify(line.selectedOptions),
          line.customerNote,
          index,
        ],
      );
      items.push(mapOrderItemRow(itemResult.rows[0]));
    }

    await client.query('COMMIT');
    return { ...order, items };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listOrdersByUserId(userId) {
  const result = await pool.query(
    `
      SELECT
        id,
        user_id AS "userId",
        status,
        payment_method AS "paymentMethod",
        customer_name AS "customerName",
        customer_email AS "customerEmail",
        customer_phone AS "customerPhone",
        shipping_address AS "shippingAddress",
        order_note AS "orderNote",
        subtotal,
        total,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  );

  return result.rows.map(mapOrderRow);
}

async function listAllOrders() {
  const result = await pool.query(
    `
      SELECT
        id,
        user_id AS "userId",
        status,
        payment_method AS "paymentMethod",
        customer_name AS "customerName",
        customer_email AS "customerEmail",
        customer_phone AS "customerPhone",
        shipping_address AS "shippingAddress",
        order_note AS "orderNote",
        subtotal,
        total,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM orders
      ORDER BY created_at DESC
    `,
  );

  const orders = result.rows.map(mapOrderRow);
  return Promise.all(
    orders.map(async (order) => ({
      ...order,
      items: await getOrderItems(order.id),
    })),
  );
}

async function getOrderItems(orderId) {
  const result = await pool.query(
    `
      SELECT
        id,
        order_id AS "orderId",
        product_id AS "productId",
        variant_id AS "variantId",
        product_name AS "productName",
        variant_label AS "variantLabel",
        unit_price AS "unitPrice",
        quantity,
        line_total AS "lineTotal",
        selected_options AS "selectedOptions",
        customer_note AS "customerNote",
        sort_order AS "sortOrder"
      FROM order_items
      WHERE order_id = $1
      ORDER BY sort_order ASC, id ASC
    `,
    [orderId],
  );

  return result.rows.map(mapOrderItemRow);
}

async function getOrderById(orderId) {
  const result = await pool.query(
    `
      SELECT
        id,
        user_id AS "userId",
        status,
        payment_method AS "paymentMethod",
        customer_name AS "customerName",
        customer_email AS "customerEmail",
        customer_phone AS "customerPhone",
        shipping_address AS "shippingAddress",
        order_note AS "orderNote",
        subtotal,
        total,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM orders
      WHERE id = $1
      LIMIT 1
    `,
    [orderId],
  );

  if (result.rows.length === 0) return null;
  const order = mapOrderRow(result.rows[0]);
  const items = await getOrderItems(order.id);
  return { ...order, items };
}

async function updateOrderStatus(orderId, status) {
  const result = await pool.query(
    `
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING
        id,
        user_id AS "userId",
        status,
        payment_method AS "paymentMethod",
        customer_name AS "customerName",
        customer_email AS "customerEmail",
        customer_phone AS "customerPhone",
        shipping_address AS "shippingAddress",
        order_note AS "orderNote",
        subtotal,
        total,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [status, orderId],
  );

  if (result.rows.length === 0) return null;
  const order = mapOrderRow(result.rows[0]);
  const items = await getOrderItems(order.id);
  return { ...order, items };
}

module.exports = {
  OrderError,
  createOrder,
  listOrdersByUserId,
  listAllOrders,
  getOrderById,
  updateOrderStatus,
};
