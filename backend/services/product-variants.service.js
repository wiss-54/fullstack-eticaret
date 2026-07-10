const { pool } = require('../db');

function buildOptionKey(valueIds) {
  return [...valueIds].sort((a, b) => a - b).join('-');
}

function cartesianCombinations(valueGroups) {
  if (valueGroups.length === 0) return [[]];
  return valueGroups.reduce(
    (acc, group) => acc.flatMap((prefix) => group.map((value) => [...prefix, value])),
    [[]],
  );
}

function mapVariantRow(row, selections) {
  return {
    id: row.id,
    productId: row.productId,
    optionKey: row.optionKey,
    sku: row.sku,
    price: row.price === null ? null : Number(row.price),
    stock: row.stock,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    selections,
  };
}

async function syncProductStockFromVariants(productId, client = pool) {
  const result = await client.query(
    `
      SELECT COALESCE(SUM(stock), 0)::int AS total
      FROM product_variants
      WHERE product_id = $1 AND is_active = true
    `,
    [productId],
  );

  const total = result.rows[0].total;
  await client.query(
    `
      UPDATE products
      SET stock = $1, updated_at = NOW()
      WHERE id = $2
    `,
    [total, productId],
  );

  return total;
}

async function listVariantsByProductId(productId) {
  const axes = await listVariantAxesByProductId(productId);
  if (axes.length === 0) return { axes: [], variants: [] };

  const variantsResult = await pool.query(
    `
      SELECT
        id,
        product_id AS "productId",
        option_key AS "optionKey",
        sku,
        price,
        stock,
        is_active AS "isActive",
        sort_order AS "sortOrder"
      FROM product_variants
      WHERE product_id = $1
      ORDER BY sort_order ASC, id ASC
    `,
    [productId],
  );

  if (variantsResult.rows.length === 0) {
    return { axes, variants: [] };
  }

  const variantIds = variantsResult.rows.map((row) => row.id);
  const selectionsResult = await pool.query(
    `
      SELECT
        pvs.variant_id AS "variantId",
        pvs.axis_id AS "axisId",
        pvs.axis_value_id AS "axisValueId",
        pva.label AS "label",
        pva.color_hex AS "colorHex"
      FROM product_variant_selections pvs
      JOIN product_variant_axis_values pva ON pva.id = pvs.axis_value_id
      WHERE pvs.variant_id = ANY($1::int[])
      ORDER BY pvs.axis_id ASC
    `,
    [variantIds],
  );

  const selectionsByVariant = new Map();
  for (const row of selectionsResult.rows) {
    const list = selectionsByVariant.get(row.variantId) ?? [];
    list.push({
      axisId: row.axisId,
      axisValueId: row.axisValueId,
      label: row.label,
      colorHex: row.colorHex,
    });
    selectionsByVariant.set(row.variantId, list);
  }

  const variants = variantsResult.rows.map((row) =>
    mapVariantRow(row, selectionsByVariant.get(row.id) ?? []),
  );

  return { axes, variants };
}

async function listVariantAxesByProductId(productId) {
  const axesResult = await pool.query(
    `
      SELECT
        id,
        product_id AS "productId",
        name,
        display_style AS "displayStyle",
        sort_order AS "sortOrder"
      FROM product_variant_axes
      WHERE product_id = $1
      ORDER BY sort_order ASC, id ASC
    `,
    [productId],
  );

  if (axesResult.rows.length === 0) return [];

  const axisIds = axesResult.rows.map((row) => row.id);
  const valuesResult = await pool.query(
    `
      SELECT
        id,
        axis_id AS "axisId",
        label,
        color_hex AS "colorHex",
        sort_order AS "sortOrder"
      FROM product_variant_axis_values
      WHERE axis_id = ANY($1::int[])
      ORDER BY sort_order ASC, id ASC
    `,
    [axisIds],
  );

  const valuesByAxis = new Map();
  for (const value of valuesResult.rows) {
    const list = valuesByAxis.get(value.axisId) ?? [];
    list.push({
      id: value.id,
      label: value.label,
      colorHex: value.colorHex,
      sortOrder: value.sortOrder,
    });
    valuesByAxis.set(value.axisId, list);
  }

  return axesResult.rows.map((axis) => ({
    id: axis.id,
    name: axis.name,
    displayStyle: axis.displayStyle,
    sortOrder: axis.sortOrder,
    values: valuesByAxis.get(axis.id) ?? [],
  }));
}

async function replaceProductVariants(productId, payload) {
  const { axes, variants } = payload;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM product_variant_axes WHERE product_id = $1', [productId]);

    if (!axes || axes.length === 0) {
      await client.query(
        `UPDATE products SET product_type = 'simple', updated_at = NOW() WHERE id = $1`,
        [productId],
      );
      await client.query('COMMIT');
      return listVariantsByProductId(productId);
    }

    const axisMeta = [];
    for (const [axisIndex, axis] of axes.entries()) {
      const insertedAxis = await client.query(
        `
          INSERT INTO product_variant_axes (product_id, name, display_style, sort_order)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `,
        [productId, axis.name, axis.displayStyle ?? 'button', axis.sortOrder ?? axisIndex],
      );

      const axisId = insertedAxis.rows[0].id;
      const valueMeta = [];

      for (const [valueIndex, value] of (axis.values ?? []).entries()) {
        const insertedValue = await client.query(
          `
            INSERT INTO product_variant_axis_values (axis_id, label, color_hex, sort_order)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `,
          [axisId, value.label, value.colorHex ?? null, value.sortOrder ?? valueIndex],
        );
        valueMeta.push({ axisId, valueId: insertedValue.rows[0].id, label: value.label });
      }

      axisMeta.push({ axisId, values: valueMeta });
    }

    const variantPayloadByKey = new Map();
    for (const variant of variants ?? []) {
      const labels = (variant.valueLabels ?? []).map((label) => label.trim().toLowerCase());
      variantPayloadByKey.set(labels.join('|'), variant);
    }

    const valueGroups = axisMeta.map((axis) =>
      axis.values.map((value) => ({ axisId: axis.axisId, valueId: value.valueId, label: value.label })),
    );
    const combinations = cartesianCombinations(valueGroups);

    for (const [index, combo] of combinations.entries()) {
      const axisValueIds = combo.map((item) => item.valueId);
      const optionKey = buildOptionKey(axisValueIds);
      const labelKey = combo.map((item) => item.label.trim().toLowerCase()).join('|');
      const variantInput = variantPayloadByKey.get(labelKey) ?? {};

      const insertedVariant = await client.query(
        `
          INSERT INTO product_variants (
            product_id,
            option_key,
            sku,
            price,
            stock,
            is_active,
            sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `,
        [
          productId,
          optionKey,
          variantInput.sku ?? null,
          variantInput.price ?? null,
          variantInput.stock ?? 0,
          variantInput.isActive ?? true,
          variantInput.sortOrder ?? index,
        ],
      );

      const variantId = insertedVariant.rows[0].id;
      for (const item of combo) {
        await client.query(
          `
            INSERT INTO product_variant_selections (variant_id, axis_id, axis_value_id)
            VALUES ($1, $2, $3)
          `,
          [variantId, item.axisId, item.valueId],
        );
      }
    }

    await client.query(
      `UPDATE products SET product_type = 'variant', updated_at = NOW() WHERE id = $1`,
      [productId],
    );
    await syncProductStockFromVariants(productId, client);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return listVariantsByProductId(productId);
}

function findVariantBySelection(variants, selectedValueIds) {
  const key = buildOptionKey(selectedValueIds);
  return variants.find((variant) => variant.optionKey === key && variant.isActive) ?? null;
}

function getAvailableValueIdsForAxis(variants, axisId, selectedByAxis) {
  return variants
    .filter((variant) => {
      if (!variant.isActive || variant.stock < 1) return false;
      return variant.selections.every((selection) => {
        if (selection.axisId === axisId) return true;
        const selected = selectedByAxis.get(selection.axisId);
        return selected === undefined || selected === selection.axisValueId;
      });
    })
    .flatMap((variant) =>
      variant.selections
        .filter((selection) => selection.axisId === axisId)
        .map((selection) => selection.axisValueId),
    );
}

module.exports = {
  buildOptionKey,
  cartesianCombinations,
  listVariantsByProductId,
  listVariantAxesByProductId,
  replaceProductVariants,
  findVariantBySelection,
  getAvailableValueIdsForAxis,
  syncProductStockFromVariants,
};
