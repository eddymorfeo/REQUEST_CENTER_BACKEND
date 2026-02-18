const { pool } = require('../configs/db');

async function listBoard({ page, pageSize, statusCode, priorityCode, typeCode }) {
  const offset = (page - 1) * pageSize;

  const filters = [];
  const values = [];
  let idx = 1;

  if (statusCode) {
    filters.push(`rs.code = $${idx++}`);
    values.push(statusCode);
  }
  if (priorityCode) {
    filters.push(`rp.code = $${idx++}`);
    values.push(priorityCode);
  }
  if (typeCode) {
    filters.push(`rt.code = $${idx++}`);
    values.push(typeCode);
  }

  const whereSql = filters.length ? `AND ${filters.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM requests r
    JOIN request_status rs ON rs.id = r.status_id
    JOIN request_priorities rp ON rp.id = r.priority_id
    JOIN request_types rt ON rt.id = r.request_type_id
    WHERE r.is_active = true
    ${whereSql}
  `;

  const dataSql = `
    SELECT
      r.id,
      r.title,
      r.description,
      r.is_active,
      r.created_by,
      r.created_at,
      r.updated_at,
      r.first_assigned_at,
      r.closed_at,

      rs.id AS status_id,
      rs.code AS status_code,
      rs.name AS status_name,
      rs.is_terminal AS status_is_terminal,

      rt.id AS request_type_id,
      rt.code AS request_type_code,
      rt.name AS request_type_name,

      rp.id AS priority_id,
      rp.code AS priority_code,
      rp.name AS priority_name,

      a.id AS active_assignment_id,
      a.assigned_to AS active_assigned_to,
      a.assigned_by AS active_assigned_by,
      a.assigned_at AS active_assigned_at,
      a.note AS active_assignment_note

    FROM requests r
    JOIN request_status rs ON rs.id = r.status_id
    JOIN request_types rt ON rt.id = r.request_type_id
    JOIN request_priorities rp ON rp.id = r.priority_id

    LEFT JOIN LATERAL (
      SELECT ra.*
      FROM request_assignments ra
      WHERE ra.request_id = r.id
        AND ra.is_active = true
        AND ra.unassigned_at IS NULL
      ORDER BY ra.assigned_at DESC
      LIMIT 1
    ) a ON true

    WHERE r.is_active = true
    ${whereSql}

    ORDER BY r.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const countResult = await pool.query(countSql, values);
  const dataResult = await pool.query(dataSql, [...values, pageSize, offset]);

  return {
    total: countResult.rows[0]?.total ?? 0,
    page,
    pageSize,
    items: dataResult.rows
  };
}

async function isUserAdmin(userId) {
  const sql = `
    SELECT 1
    FROM user_role ur
    JOIN role r ON r.id = ur.role_id
    WHERE ur.user_id = $1
      AND r.code = 'ADMIN'
      AND r.is_active = true
    LIMIT 1
  `;
  const result = await pool.query(sql, [userId]);
  return result.rowCount > 0;
}

async function getStatusByCode(code) {
  const sql = `SELECT * FROM request_status WHERE code = $1 LIMIT 1`;
  const result = await pool.query(sql, [code]);
  return result.rows[0] || null;
}

async function getStatusById(id) {
  const sql = `SELECT * FROM request_status WHERE id = $1 LIMIT 1`;
  const result = await pool.query(sql, [id]);
  return result.rows[0] || null;
}

async function getRequestById(requestId) {
  const sql = `SELECT * FROM requests WHERE id = $1 LIMIT 1`;
  const result = await pool.query(sql, [requestId]);
  return result.rows[0] || null;
}

async function closeActiveAssignments(client, requestId) {
  const sql = `
    UPDATE request_assignments
    SET unassigned_at = now(), is_active = false, updated_at = now()
    WHERE request_id = $1 AND is_active = true AND unassigned_at IS NULL
  `;
  await client.query(sql, [requestId]);
}

async function createAssignment(client, { requestId, assignedTo, assignedBy, note }) {
  const sql = `
    INSERT INTO request_assignments (request_id, assigned_to, assigned_by, note)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await client.query(sql, [requestId, assignedTo, assignedBy, note || null]);
  return result.rows[0];
}

async function getActiveAssignment(clientOrPool, requestId) {
  const sql = `
    SELECT *
    FROM request_assignments
    WHERE request_id = $1 AND is_active = true AND unassigned_at IS NULL
    ORDER BY assigned_at DESC
    LIMIT 1
  `;
  const result = await clientOrPool.query(sql, [requestId]);
  return result.rows[0] || null;
}

async function updateRequestStatus(client, { requestId, statusId, setFirstAssignedAt, setClosedAt }) {
  const sql = `
    UPDATE requests
    SET
      status_id = $2,
      updated_at = now(),
      first_assigned_at = CASE
        WHEN $3::boolean = true AND first_assigned_at IS NULL THEN now()
        ELSE first_assigned_at
      END,
      closed_at = CASE
        WHEN $4::boolean = true THEN now()
        ELSE closed_at
      END
    WHERE id = $1
    RETURNING *
  `;
  const result = await client.query(sql, [requestId, statusId, !!setFirstAssignedAt, !!setClosedAt]);
  return result.rows[0] || null;
}

async function insertStatusHistory(client, { requestId, fromStatusId, toStatusId, changedBy, note }) {
  const sql = `
    INSERT INTO request_status_history (request_id, from_status_id, to_status_id, changed_by, note)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const result = await client.query(sql, [
    requestId,
    fromStatusId || null,
    toStatusId,
    changedBy,
    note || null
  ]);
  return result.rows[0];
}

async function insertBoardEvent(client, { eventType, requestId, actorId, payload }) {
  const sql = `
    INSERT INTO board_events (event_type, request_id, actor_id, payload)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await client.query(sql, [
    eventType,
    requestId || null,
    actorId || null,
    payload || null
  ]);
  return result.rows[0];
}

async function getChanges({ sinceId, requestId }) {
  const values = [sinceId];
  let sql = `SELECT MAX(id)::bigint AS latest_id, COUNT(*)::int AS new_count FROM board_events WHERE id > $1`;

  if (requestId) {
    values.push(requestId);
    sql += ` AND request_id = $2`;
  }

  const result = await pool.query(sql, values);
  const row = result.rows[0] || { latest_id: null, new_count: 0 };

  return {
    sinceId,
    latestId: row.latest_id ? Number(row.latest_id) : null,
    newCount: row.new_count || 0
  };
}

async function getMetrics({ days }) {
  const values = [days];

  const byStatusSql = `
    SELECT rs.code AS status_code, rs.name AS status_name, COUNT(*)::int AS total
    FROM requests r
    JOIN request_status rs ON rs.id = r.status_id
    WHERE r.is_active = true
      AND r.created_at >= now() - ($1::int || ' days')::interval
    GROUP BY rs.code, rs.name
    ORDER BY total DESC
  `;

  const workloadSql = `
    SELECT ra.assigned_to, COUNT(*)::int AS active_assigned
    FROM request_assignments ra
    WHERE ra.is_active = true AND ra.unassigned_at IS NULL
      AND ra.assigned_at >= now() - ($1::int || ' days')::interval
    GROUP BY ra.assigned_to
    ORDER BY active_assigned DESC
  `;

  const cycleTimeSql = `
    SELECT
      AVG(EXTRACT(EPOCH FROM (r.closed_at - r.first_assigned_at)) / 3600.0) AS avg_cycle_hours,
      AVG(EXTRACT(EPOCH FROM (r.first_assigned_at - r.created_at)) / 3600.0) AS avg_to_first_assignment_hours
    FROM requests r
    WHERE r.closed_at IS NOT NULL
      AND r.first_assigned_at IS NOT NULL
      AND r.created_at >= now() - ($1::int || ' days')::interval
  `;

  const [byStatus, workload, cycleTime] = await Promise.all([
    pool.query(byStatusSql, values),
    pool.query(workloadSql, values),
    pool.query(cycleTimeSql, values)
  ]);

  const cycleRow = cycleTime.rows[0] || {};
  return {
    windowDays: days,
    byStatus: byStatus.rows,
    workload: workload.rows,
    avgCycleHours: cycleRow.avg_cycle_hours ? Number(cycleRow.avg_cycle_hours) : null,
    avgToFirstAssignmentHours: cycleRow.avg_to_first_assignment_hours
      ? Number(cycleRow.avg_to_first_assignment_hours)
      : null
  };
}

module.exports = {
  listBoard,
  isUserAdmin,
  getStatusByCode,
  getStatusById,
  getRequestById,
  closeActiveAssignments,
  createAssignment,
  getActiveAssignment,
  updateRequestStatus,
  insertStatusHistory,
  insertBoardEvent,
  getChanges,
  getMetrics
};
