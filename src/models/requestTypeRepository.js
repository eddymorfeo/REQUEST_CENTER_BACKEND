const { pool } = require('../configs/db');

const REQUEST_TYPE_COLUMNS = `
  id,
  code,
  name,
  description,
  user_id,
  is_active,
  created_at,
  updated_at
`;

const findAll = async ({ limit, offset }) => {
  const query = `
    SELECT ${REQUEST_TYPE_COLUMNS}
    FROM request_types
    WHERE is_active = TRUE
    ORDER BY name ASC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [limit, offset]);
  return rows;
};

const countAll = async () => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM request_types WHERE is_active = TRUE`
  );
  return rows[0].total;
};

const findById = async (id) => {
  const query = `
    SELECT ${REQUEST_TYPE_COLUMNS}
    FROM request_types
    WHERE is_active = TRUE AND id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

const findInternalById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id FROM request_types WHERE is_active = TRUE AND id = $1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ code, name, description, userId, isActive }) => {
  const query = `
    INSERT INTO request_types (code, name, description, user_id, is_active)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ${REQUEST_TYPE_COLUMNS}
  `;
  const { rows } = await pool.query(query, [
    code,
    name,
    description,
    userId,
    isActive
  ]);
  return rows[0];
};

const update = async ({ id, code, name, description, isActive }) => {
  const query = `
    UPDATE request_types
    SET
      code = $2,
      name = $3,
      description = $4,
      is_active = $5,
      updated_at = NOW()
    WHERE id = $1
    RETURNING ${REQUEST_TYPE_COLUMNS}
  `;
  const { rows } = await pool.query(query, [
    id,
    code,
    name,
    description,
    isActive
  ]);
  return rows[0] || null;
};

const softRemove = async (id) => {
  const query = `
    UPDATE request_types
    SET is_active = FALSE, updated_at = NOW()
    WHERE id = $1
    RETURNING ${REQUEST_TYPE_COLUMNS}
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

module.exports = {
  findAll,
  countAll,
  findById,
  findInternalById,
  create,
  update,
  softRemove
};
