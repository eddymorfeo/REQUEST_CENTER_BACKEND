const { pool } = require('../configs/db');

async function listByRequestId(requestId) {
  const sql = `
    SELECT *
    FROM request_assignments
    WHERE request_id = $1
    ORDER BY assigned_at DESC
  `;
  const result = await pool.query(sql, [requestId]);
  return result.rows;
}

async function getById(id) {
  const sql = `SELECT * FROM request_assignments WHERE id = $1 LIMIT 1`;
  const result = await pool.query(sql, [id]);
  return result.rows[0] || null;
}

async function softDelete(id) {
  const sql = `
    UPDATE request_assignments
    SET is_active = false, updated_at = now()
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query(sql, [id]);
  return result.rows[0] || null;
}

module.exports = {
  listByRequestId,
  getById,
  softDelete
};
