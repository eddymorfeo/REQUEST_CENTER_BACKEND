const { pool } = require('../configs/db');

async function listByRequestId(requestId) {
  const sql = `
    SELECT *
    FROM request_status_history
    WHERE request_id = $1
    ORDER BY changed_at DESC
  `;
  const result = await pool.query(sql, [requestId]);
  return result.rows;
}

async function create({ requestId, fromStatusId, toStatusId, changedBy, note }) {
  const sql = `
    INSERT INTO request_status_history (request_id, from_status_id, to_status_id, changed_by, note)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const result = await pool.query(sql, [
    requestId,
    fromStatusId || null,
    toStatusId,
    changedBy,
    note || null
  ]);
  return result.rows[0];
}

module.exports = {
  listByRequestId,
  create
};
