const { pool } = require('../configs/db');

async function list({ page, pageSize, requestId }) {
  const offset = (page - 1) * pageSize;

  const values = [];
  let idx = 1;

  let whereSql = '';
  if (requestId) {
    whereSql = `WHERE request_id = $${idx++}`;
    values.push(requestId);
  }

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM board_events
    ${whereSql}
  `;

  const dataSql = `
    SELECT *
    FROM board_events
    ${whereSql}
    ORDER BY id DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const countResult = await pool.query(countSql, values);
  const dataResult = await pool.query(dataSql, [...values, pageSize, offset]);

  return {
    total: countResult.rows[0]?.total ?? 0,
    page,
    pageSize,
    items: dataResult.rows
  };
}

module.exports = { list };
