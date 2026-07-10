const { pool } = require('../db');

function mapChoiceRow(row) {
  return {
    id: row.id,
    label: row.label,
    priceDelta: Number(row.priceDelta),
    sortOrder: row.sortOrder,
  };
}

function mapOptionRow(row, choices) {
  return {
    id: row.id,
    productId: row.productId,
    label: row.label,
    optionType: row.optionType,
    required: row.required,
    sortOrder: row.sortOrder,
    choices,
  };
}

async function listOptionsByProductId(productId) {
  const optionsResult = await pool.query(
    `
      SELECT
        id,
        product_id AS "productId",
        label,
        option_type AS "optionType",
        required,
        sort_order AS "sortOrder"
      FROM product_options
      WHERE product_id = $1
      ORDER BY sort_order ASC, id ASC
    `,
    [productId],
  );

  if (optionsResult.rows.length === 0) return [];

  const optionIds = optionsResult.rows.map((row) => row.id);
  const choicesResult = await pool.query(
    `
      SELECT
        id,
        option_id AS "optionId",
        label,
        price_delta AS "priceDelta",
        sort_order AS "sortOrder"
      FROM product_option_choices
      WHERE option_id = ANY($1::int[])
      ORDER BY sort_order ASC, id ASC
    `,
    [optionIds],
  );

  const choicesByOption = new Map();
  for (const choice of choicesResult.rows) {
    const list = choicesByOption.get(choice.optionId) ?? [];
    list.push(mapChoiceRow(choice));
    choicesByOption.set(choice.optionId, list);
  }

  return optionsResult.rows.map((row) =>
    mapOptionRow(row, choicesByOption.get(row.id) ?? []),
  );
}

async function replaceProductOptions(productId, options) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM product_options WHERE product_id = $1', [productId]);

    for (const [index, option] of options.entries()) {
      const inserted = await client.query(
        `
          INSERT INTO product_options (product_id, label, option_type, required, sort_order)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `,
        [productId, option.label, option.optionType, option.required, option.sortOrder ?? index],
      );

      const optionId = inserted.rows[0].id;

      if (option.optionType === 'select' && Array.isArray(option.choices)) {
        for (const [choiceIndex, choice] of option.choices.entries()) {
          await client.query(
            `
              INSERT INTO product_option_choices (option_id, label, price_delta, sort_order)
              VALUES ($1, $2, $3, $4)
            `,
            [optionId, choice.label, choice.priceDelta ?? 0, choice.sortOrder ?? choiceIndex],
          );
        }
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return listOptionsByProductId(productId);
}

module.exports = {
  listOptionsByProductId,
  replaceProductOptions,
};
