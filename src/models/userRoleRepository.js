const { pool } = require('../configs/db');

const USER_ROLE_COLUMNS = `
  id,
  user_id,
  role_id,
  created_at
`;

const findAll = async ({ limit, offset }) => {
  const query = `
    SELECT ${USER_ROLE_COLUMNS}
    FROM user_role
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [limit, offset]);
  return rows;
};

const countAll = async () => {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM user_role`);
  return rows[0].total;
};

const findById = async (id) => {
  const query = `
    SELECT ${USER_ROLE_COLUMNS}
    FROM user_role
    WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

const findInternalById = async (id) => {
  const { rows } = await pool.query(`SELECT id FROM user_role WHERE id = $1`, [id]);
  return rows[0] || null;
};

const create = async ({ userId, roleId }) => {
  const query = `
    INSERT INTO user_role (user_id, role_id)
    VALUES ($1, $2)
    RETURNING ${USER_ROLE_COLUMNS}
  `;
  const { rows } = await pool.query(query, [userId, roleId]);
  return rows[0];
};

const update = async ({ id, userId, roleId }) => {
  const query = `
    UPDATE user_role
    SET
      user_id = $2,
      role_id = $3
    WHERE id = $1
    RETURNING ${USER_ROLE_COLUMNS}
  `;
  const { rows } = await pool.query(query, [id, userId, roleId]);
  return rows[0] || null;
};

const remove = async (id) => {
  const result = await pool.query(`DELETE FROM user_role WHERE id = $1`, [id]);
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
