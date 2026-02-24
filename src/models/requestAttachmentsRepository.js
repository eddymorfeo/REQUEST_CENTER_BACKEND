const { pool } = require('../configs/db');

async function listByRequestId(requestId) {
  const sql = `
    SELECT *
    FROM request_attachments
    WHERE request_id = $1
    ORDER BY created_at DESC
  `;
  const result = await pool.query(sql, [requestId]);
  return result.rows;
}

async function create({ requestId, uploadedBy, fileName, fileUrl, mimeType, sizeBytes }) {
  const sql = `
    INSERT INTO request_attachments (request_id, uploaded_by, file_name, file_url, mime_type, size_bytes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await pool.query(sql, [
    requestId,
    uploadedBy,
    fileName,
    fileUrl,
    mimeType || null,
    sizeBytes ?? null
  ]);
  return result.rows[0];
}

async function update(id, patch) {
  const fields = [];
  const values = [];
  let idx = 1;

  const map = {
    file_name: 'file_name',
    file_url: 'file_url',
    mime_type: 'mime_type',
    size_bytes: 'size_bytes',
    is_active: 'is_active'
  };

  for (const key of Object.keys(map)) {
    if (patch[key] !== undefined) {
      fields.push(`${map[key]} = $${idx++}`);
      values.push(patch[key]);
    }
  }

  fields.push(`updated_at = now()`);

  const sql = `
    UPDATE request_attachments
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
    UPDATE request_attachments
    SET is_active = false, updated_at = now()
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query(sql, [id]);
  return result.rows[0] || null;
}

async function getById(id) {
  const sql = `SELECT * FROM request_attachments WHERE id = $1 LIMIT 1`;
  const result = await pool.query(sql, [id]);
  return result.rows[0] || null;
}

module.exports = {
  listByRequestId,
  getById,
  create,
  update,
  softDelete
};
