const { pool } = require('../db');
const { getProductById } = require('./products.service');
const { syncProductStockFromVariants } = require('./product-variants.service');

const ORDER_COLUMNS = `
  id,
  user_id AS "userId",
  status,
  payment_method AS "paymentMethod",
  payment_status AS "paymentStatus",
  payment_provider AS "paymentProvider",
  provider_payment_id AS "providerPaymentId",
  provider_conversation_id AS "providerConversationId",
  paid_at AS "paidAt",
  stock_reserved AS "stockReserved",
  customer_name AS "customerName",
  customer_email AS "customerEmail",
  customer_phone AS "customerPhone",
  shipping_address AS "shippingAddress",
  shipping_city AS "shippingCity",
  shipping_district AS "shippingDistrict",
  shipping_address_line AS "shippingAddressLine",
  order_note AS "orderNote",
  subtotal,
  total,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

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
    paymentStatus: row.paymentStatus ?? 'unpaid',
    paymentProvider: row.paymentProvider ?? null,
    providerPaymentId: row.providerPaymentId ?? null,
    providerConversationId: row.providerConversationId ?? null,
    paidAt: row.paidAt ?? null,
    stockReserved: Boolean(row.stockReserved),
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    shippingAddress: row.shippingAddress,
    shippingCity: row.shippingCity ?? null,
    shippingDistrict: row.shippingDistrict ?? null,
    shippingAddressLine: row.shippingAddressLine ?? null,
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

function isOnlinePaymentMethod(method) {
  return method === 'paytr';
}

function composeShippingAddress({ shippingCity, shippingDistrict, shippingAddressLine }) {
  return `${shippingAddressLine.trim()}, ${shippingDistrict.trim()} / ${shippingCity.trim()}`;
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

    const paymentMethod = payload.paymentMethod ?? 'manual';
    const online = isOnlinePaymentMethod(paymentMethod);
    const reserveNow = !online;

    if (reserveNow) {
      for (const line of builtLines) {
        await reserveStock(client, {
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
        });
      }
    }

    const subtotal = builtLines.reduce((sum, line) => sum + line.lineTotal, 0);
    const shippingCity = payload.shippingCity.trim();
    const shippingDistrict = payload.shippingDistrict.trim();
    const shippingAddressLine = payload.shippingAddressLine.trim();
    const shippingAddress = composeShippingAddress({
      shippingCity,
      shippingDistrict,
      shippingAddressLine,
    });

    const orderResult = await client.query(
      `
        INSERT INTO orders (
          user_id,
          status,
          payment_method,
          payment_status,
          stock_reserved,
          customer_name,
          customer_email,
          customer_phone,
          shipping_address,
          shipping_city,
          shipping_district,
          shipping_address_line,
          order_note,
          subtotal,
          total
        )
        VALUES ($1, 'pending', $2, 'unpaid', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING ${ORDER_COLUMNS}
      `,
      [
        user.id,
        paymentMethod,
        reserveNow,
        user.fullName,
        user.email,
        payload.customerPhone.trim(),
        shippingAddress,
        shippingCity,
        shippingDistrict,
        shippingAddressLine,
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
      SELECT ${ORDER_COLUMNS}
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
      SELECT ${ORDER_COLUMNS}
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

async function getOrderItems(orderId, client = pool) {
  const result = await client.query(
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
      SELECT ${ORDER_COLUMNS}
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
      RETURNING ${ORDER_COLUMNS}
    `,
    [status, orderId],
  );

  if (result.rows.length === 0) return null;
  const order = mapOrderRow(result.rows[0]);
  const items = await getOrderItems(order.id);
  return { ...order, items };
}

async function attachPaymentSession(orderId, session) {
  const result = await pool.query(
    `
      UPDATE orders
      SET
        payment_status = 'pending',
        payment_provider = $2,
        provider_payment_id = $3,
        provider_conversation_id = $4,
        updated_at = NOW()
      WHERE id = $1
        AND payment_method = 'paytr'
        AND payment_status IN ('unpaid', 'pending', 'failed')
      RETURNING ${ORDER_COLUMNS}
    `,
    [orderId, session.provider, session.token, session.conversationId ?? null],
  );

  if (result.rows.length === 0) return null;
  return mapOrderRow(result.rows[0]);
}

async function markOrderPaid(orderId, meta = {}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const locked = await client.query(
      `
        SELECT ${ORDER_COLUMNS}
        FROM orders
        WHERE id = $1
        FOR UPDATE
      `,
      [orderId],
    );

    if (locked.rows.length === 0) {
      throw new OrderError('Siparis bulunamadi', 404);
    }

    const current = mapOrderRow(locked.rows[0]);
    if (current.paymentStatus === 'paid') {
      await client.query('COMMIT');
      const items = await getOrderItems(orderId, client);
      return { ...current, items };
    }

    if (!isOnlinePaymentMethod(current.paymentMethod)) {
      throw new OrderError('Bu siparis online odeme icin degil', 400);
    }

    let stockReserved = current.stockReserved;
    if (!stockReserved) {
      const items = await getOrderItems(orderId, client);
      for (const item of items) {
        await reserveStock(client, {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }
      stockReserved = true;
    }

    const result = await client.query(
      `
        UPDATE orders
        SET
          payment_status = 'paid',
          status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
          stock_reserved = $2,
          provider_payment_id = COALESCE($3, provider_payment_id),
          provider_conversation_id = COALESCE($4, provider_conversation_id),
          paid_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING ${ORDER_COLUMNS}
      `,
      [
        orderId,
        stockReserved,
        meta.providerPaymentId ?? null,
        meta.providerConversationId ?? null,
      ],
    );

    await client.query('COMMIT');
    const order = mapOrderRow(result.rows[0]);
    const items = await getOrderItems(order.id);
    return { ...order, items };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function markOrderPaymentFailed(orderId, meta = {}) {
  const result = await pool.query(
    `
      UPDATE orders
      SET
        payment_status = 'failed',
        provider_payment_id = COALESCE($2, provider_payment_id),
        provider_conversation_id = COALESCE($3, provider_conversation_id),
        updated_at = NOW()
      WHERE id = $1
        AND payment_status <> 'paid'
      RETURNING ${ORDER_COLUMNS}
    `,
    [orderId, meta.providerPaymentId ?? null, meta.providerConversationId ?? null],
  );

  if (result.rows.length === 0) return null;
  const order = mapOrderRow(result.rows[0]);
  const items = await getOrderItems(order.id);
  return { ...order, items };
}

async function findOrderByProviderPaymentId(token) {
  const result = await pool.query(
    `
      SELECT ${ORDER_COLUMNS}
      FROM orders
      WHERE provider_payment_id = $1
      LIMIT 1
    `,
    [token],
  );

  if (result.rows.length === 0) return null;
  return mapOrderRow(result.rows[0]);
}

async function findOrderByProviderConversationId(conversationId) {
  const result = await pool.query(
    `
      SELECT ${ORDER_COLUMNS}
      FROM orders
      WHERE provider_conversation_id = $1
      LIMIT 1
    `,
    [conversationId],
  );

  if (result.rows.length === 0) return null;
  return mapOrderRow(result.rows[0]);
}

module.exports = {
  OrderError,
  createOrder,
  listOrdersByUserId,
  listAllOrders,
  getOrderById,
  updateOrderStatus,
  attachPaymentSession,
  markOrderPaid,
  markOrderPaymentFailed,
  findOrderByProviderPaymentId,
  findOrderByProviderConversationId,
  isOnlinePaymentMethod,
  composeShippingAddress,
};
