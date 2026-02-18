const { pool } = require('../configs/db');

async function listByRequestId(requestId) {
  const sql = `
    SELECT *
    FROM request_comments
    WHERE request_id = $1
    ORDER BY created_at DESC
  `;
  const result = await pool.query(sql, [requestId]);
  return result.rows;
}

async function create({ requestId, authorId, comment }) {
  const sql = `
    INSERT INTO request_comments (request_id, author_id, comment)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await pool.query(sql, [requestId, authorId, comment]);
  return result.rows[0];
}

async function update(id, patch) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (patch.comment !== undefined) {
    fields.push(`comment = $${idx++}`);
    values.push(patch.comment);
  }
  if (patch.is_active !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(patch.is_active);
  }

  fields.push(`updated_at = now()`);

  const sql = `
    UPDATE request_comments
    SET ${fields.join(', ')}
    WHERE id = $${idx++}
    RETURNING *
  `;
  values.push(id);

  const result = await pool.query(sql, values);
  return result.rows[0] || null;
}

async function softDelete(id) {
  const sql = `
    UPDATE request_comments
    SET is_active = false, updated_at = now()
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query(sql, [id]);
  return result.rows[0] || null;
}

module.exports = {
  listByRequestId,
  create,
  update,
  softDelete
};
