const { pool } = require('../configs/db');

const REQUEST_COLUMNS = `
  r.id,
  r.title,
  r.description,
  r.status_id,
  r.request_type_id,
  r.priority_id,
  r.is_active,
  r.created_by,
  r.created_at,
  r.updated_at,
  r.first_assigned_at,
  r.closed_at
`;

const findAll = async ({ limit, offset, filters }) => {
  const { statusId, requestTypeId, priorityId, q, includeInactive } = filters;

  const query = `
    SELECT
      ${REQUEST_COLUMNS},
      rs.code as status_code, rs.name as status_name, rs.sort_order as status_sort_order, rs.is_terminal,
      rt.code as type_code, rt.name as type_name,
      rp.code as priority_code, rp.name as priority_name
    FROM requests r
    JOIN request_status rs ON rs.id = r.status_id
    JOIN request_types rt ON rt.id = r.request_type_id
    JOIN request_priorities rp ON rp.id = r.priority_id
    WHERE
      ($1::boolean = true OR r.is_active = true)
      AND ($2::uuid is null OR r.status_id = $2)
      AND ($3::uuid is null OR r.request_type_id = $3)
      AND ($4::uuid is null OR r.priority_id = $4)
      AND (
        $5::text is null
        OR r.title ILIKE ('%' || $5 || '%')
        OR COALESCE(r.description, '') ILIKE ('%' || $5 || '%')
      )
    ORDER BY rs.sort_order ASC, r.created_at DESC
    LIMIT $6 OFFSET $7
  `;

  const params = [
    includeInactive === true,
    statusId || null,
    requestTypeId || null,
    priorityId || null,
    q || null,
    limit,
    offset
  ];

  const { rows } = await pool.query(query, params);
  return rows;
};

const countAll = async ({ filters }) => {
  const { statusId, requestTypeId, priorityId, q, includeInactive } = filters;

  const query = `
    SELECT COUNT(*)::int AS total
    FROM requests r
    WHERE
      ($1::boolean = true OR r.is_active = true)
      AND ($2::uuid is null OR r.status_id = $2)
      AND ($3::uuid is null OR r.request_type_id = $3)
      AND ($4::uuid is null OR r.priority_id = $4)
      AND (
        $5::text is null
        OR r.title ILIKE ('%' || $5 || '%')
        OR COALESCE(r.description, '') ILIKE ('%' || $5 || '%')
      )
  `;

  const { rows } = await pool.query(query, [
    includeInactive === true,
    statusId || null,
    requestTypeId || null,
    priorityId || null,
    q || null
  ]);

  return rows[0].total;
};

const findById = async (id) => {
  const query = `
    SELECT
      ${REQUEST_COLUMNS},
      rs.code as status_code, rs.name as status_name, rs.sort_order as status_sort_order, rs.is_terminal,
      rt.code as type_code, rt.name as type_name,
      rp.code as priority_code, rp.name as priority_name
    FROM requests r
    JOIN request_status rs ON rs.id = r.status_id
    JOIN request_types rt ON rt.id = r.request_type_id
    JOIN request_priorities rp ON rp.id = r.priority_id
    WHERE r.id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

const findInternalById = async (id) => {
  const { rows } = await pool.query(`SELECT id FROM requests WHERE id = $1`, [id]);
  return rows[0] || null;
};

const create = async ({ title, description, statusId, requestTypeId, priorityId, createdBy }) => {
  if (statusId) {
    const query = `
      INSERT INTO requests (title, description, status_id, request_type_id, priority_id, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const { rows } = await pool.query(query, [
      title,
      description,
      statusId,
      requestTypeId,
      priorityId,
      createdBy
    ]);
    return rows[0];
  }

  // usa DEFAULT de la tabla para status_id
  const query = `
    INSERT INTO requests (title, description, request_type_id, priority_id, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;
  const { rows } = await pool.query(query, [
    title,
    description,
    requestTypeId,
    priorityId,
    createdBy
  ]);
  return rows[0];
};

const update = async ({ id, title, description, statusId, requestTypeId, priorityId, isActive }) => {
  const query = `
    UPDATE requests
    SET
      title = COALESCE($2, title),
      description = COALESCE($3, description),
      status_id = COALESCE($4::uuid, status_id),
      request_type_id = COALESCE($5::uuid, request_type_id),
      priority_id = COALESCE($6::uuid, priority_id),
      is_active = COALESCE($7::boolean, is_active),
      updated_at = NOW()
    WHERE id = $1
    RETURNING id
  `;

  const { rows } = await pool.query(query, [
    id,
    title ?? null,
    description ?? null,
    statusId ?? null,
    requestTypeId ?? null,
    priorityId ?? null,
    typeof isActive === 'boolean' ? isActive : null
  ]);

  return rows[0] || null;
};

const softRemove = async (id) => {
  const query = `
    UPDATE requests
    SET is_active = FALSE, updated_at = NOW()
    WHERE id = $1
    RETURNING id
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
