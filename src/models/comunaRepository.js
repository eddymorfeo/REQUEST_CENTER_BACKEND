const { pool } = require('../configs/db');

const COMUNA_COLUMNS = `
  id,
  name,
  is_active
`;

const findAll = async ({ limit, offset }) => {
  const query = `
    SELECT ${COMUNA_COLUMNS}
    FROM comuna
    WHERE is_active = TRUE
    ORDER BY name ASC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [limit, offset]);
  return rows;
};

const countAll = async () => {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM comuna`);
  return rows[0].total;
};

const findById = async (id) => {
  const query = `
    SELECT ${COMUNA_COLUMNS}
    FROM comuna
    WHERE is_active = TRUE and id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

const findInternalById = async (id) => {
  const { rows } = await pool.query(`SELECT id FROM comuna WHERE is_active = TRUE and id = $1`, [id]);
  return rows[0] || null;
};

const create = async ({ name, isActive }) => {
  const query = `
    INSERT INTO comuna (name, is_active)
    VALUES ($1, $2)
    RETURNING ${COMUNA_COLUMNS}
  `;
  const { rows } = await pool.query(query, [name, isActive]);
  return rows[0];
};

const update = async ({ id, name, isActive }) => {
  const query = `
    UPDATE comuna
    SET
      name = $2,
      is_active = $3
    WHERE id = $1
    RETURNING ${COMUNA_COLUMNS}
  `;
  const { rows } = await pool.query(query, [id, name, isActive]);
  return rows[0] || null;
};

const remove = async (id) => {
  const result = await pool.query(`DELETE FROM comuna WHERE id = $1`, [id]);
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
