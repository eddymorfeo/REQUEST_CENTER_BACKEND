const { pool } = require('../configs/db');

const ROLE_COLUMNS = `
  id,
  code,
  name,
  is_active
`;

const findAll = async ({ limit, offset }) => {
  const query = `
    SELECT ${ROLE_COLUMNS}
    FROM role
    ORDER BY code ASC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [limit, offset]);
  return rows;
};

const countAll = async () => {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM role`);
  return rows[0].total;
};

const findById = async (id) => {
  const query = `
    SELECT ${ROLE_COLUMNS}
    FROM role
    WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

const findInternalById = async (id) => {
  const { rows } = await pool.query(`SELECT id FROM role WHERE id = $1`, [id]);
  return rows[0] || null;
};

const create = async ({ code, name, isActive }) => {
  const query = `
    INSERT INTO role (code, name, is_active)
    VALUES ($1, $2, $3)
    RETURNING ${ROLE_COLUMNS}
  `;
  const { rows } = await pool.query(query, [code, name, isActive]);
  return rows[0];
};

const update = async ({ id, code, name, isActive }) => {
  const query = `
    UPDATE role
    SET
      code = $2,
      name = $3,
      is_active = $4
    WHERE id = $1
    RETURNING ${ROLE_COLUMNS}
  `;
  const { rows } = await pool.query(query, [id, code, name, isActive]);
  return rows[0] || null;
};

const remove = async (id) => {
  const result = await pool.query(`DELETE FROM role WHERE id = $1`, [id]);
  return result.rowCount > 0;
};

module.exports = {
  findAll,
  countAll,
  findById,
  findInternalById,
  create,
  update,
  remove
};
