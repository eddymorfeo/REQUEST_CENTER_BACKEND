const { pool } = require('../configs/db');

const STATUS_COLUMNS = `
  id,
  code,
  name,
  sort_order,
  is_terminal,
  user_id,
  is_active,
  created_at,
  updated_at
`;

const findAll = async ({ limit, offset }) => {
  const query = `
    SELECT ${STATUS_COLUMNS}
    FROM request_status
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, name ASC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [limit, offset]);
  return rows;
};

const countAll = async () => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM request_status WHERE is_active = TRUE`
  );
  return rows[0].total;
};

const findById = async (id) => {
  const query = `
    SELECT ${STATUS_COLUMNS}
    FROM request_status
    WHERE is_active = TRUE AND id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

const findInternalById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id FROM request_status WHERE is_active = TRUE AND id = $1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ code, name, sortOrder, isTerminal, userId, isActive }) => {
  const query = `
    INSERT INTO request_status (code, name, sort_order, is_terminal, user_id, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING ${STATUS_COLUMNS}
  `;
  const { rows } = await pool.query(query, [
    code,
    name,
    sortOrder,
    isTerminal,
    userId,
    isActive
  ]);
  return rows[0];
};

const update = async ({ id, code, name, sortOrder, isTerminal, isActive }) => {
  const query = `
    UPDATE request_status
    SET
      code = $2,
      name = $3,
      sort_order = $4,
      is_terminal = $5,
      is_active = $6,
      updated_at = NOW()
    WHERE id = $1
    RETURNING ${STATUS_COLUMNS}
  `;
  const { rows } = await pool.query(query, [
    id,
    code,
    name,
    sortOrder,
    isTerminal,
    isActive
  ]);
  return rows[0] || null;
};

const softRemove = async (id) => {
  const query = `
    UPDATE request_status
    SET is_active = FALSE, updated_at = NOW()
    WHERE id = $1
    RETURNING ${STATUS_COLUMNS}
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
