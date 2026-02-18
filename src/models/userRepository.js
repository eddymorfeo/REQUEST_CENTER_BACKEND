const { pool } = require("../configs/db");

const USER_PUBLIC_COLUMNS = `
  u.id,
  u.username,
  u.full_name,
  u.email,
  u.role_id,
  u.is_active,
  u.created_at,
  u.updated_at
`;

const USER_PUBLIC_RETURNING = `
  id,
  username,
  full_name,
  email,
  role_id,
  is_active,
  created_at,
  updated_at
`;

const findAll = async ({ limit, offset }) => {
  const query = `
    SELECT ${USER_PUBLIC_COLUMNS}
    FROM users u
    ORDER BY u.created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const values = [limit, offset];
  const { rows } = await pool.query(query, values);
  return rows;
};

const countAll = async () => {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM users`);
  return rows[0].total;
};

const findById = async (id) => {
  const query = `
    SELECT ${USER_PUBLIC_COLUMNS}
    FROM users u
    WHERE u.id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

const findInternalById = async (id) => {
  const query = `SELECT id FROM users WHERE id = $1`;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

const create = async ({ username, fullName, passwordHash, isActive, email, roleId }) => {
  const query = `
    INSERT INTO users (username, full_name, password_hash, is_active, email, role_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING ${USER_PUBLIC_RETURNING}
  `;
  const values = [username, fullName, passwordHash, isActive, email || null, roleId || null];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const update = async ({ id, username, fullName, passwordHash, isActive, email, roleId }) => {
  const query = `
    UPDATE users
    SET
      username = $2,
      full_name = $3,
      password_hash = COALESCE($4, password_hash),
      email = COALESCE($5, email),
      role_id = COALESCE($6, role_id),
      is_active = $7,
      updated_at = now()
    WHERE id = $1
    RETURNING ${USER_PUBLIC_RETURNING}
  `;
  const values = [id, username, fullName, passwordHash, email ?? null, roleId ?? null, isActive];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
};

const remove = async (id) => {
  const query = `DELETE FROM users WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
};

// ✅ CLAVE: login necesita role_code para firmar JWT (roleCode)
const findByUsernameWithPasswordHash = async (username) => {
  const query = `
    SELECT
      u.id,
      u.username,
      u.full_name,
      u.email,
      u.role_id,
      r.code AS role_code,
      u.password_hash,
      u.is_active
    FROM users u
    JOIN role r ON r.id = u.role_id
    WHERE u.username = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [username]);
  return rows[0] || null;
};

const findActiveByRoleCode = async ({ roleCode, limit, offset }) => {
  const query = `
    SELECT ${USER_PUBLIC_COLUMNS}
    FROM users u
    INNER JOIN role r ON r.id = u.role_id
    WHERE u.is_active = TRUE
      AND r.is_active = TRUE
      AND r.code = $1
    ORDER BY u.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const values = [roleCode, limit, offset];
  const { rows } = await pool.query(query, values);
  return rows;
};

const countActiveByRoleCode = async ({ roleCode }) => {
  const query = `
    SELECT COUNT(*)::int AS total
    FROM users u
    INNER JOIN role r ON r.id = u.role_id
    WHERE u.is_active = TRUE
      AND r.is_active = TRUE
      AND r.code = $1
  `;
  const { rows } = await pool.query(query, [roleCode]);
  return rows[0].total;
};

module.exports = {
  findAll,
  countAll,
  findById,
  findInternalById,
  create,
  update,
  remove,
  findByUsernameWithPasswordHash,
  findActiveByRoleCode,
  countActiveByRoleCode,
};
