const { pool } = require('../configs/db');

async function getOverviewKpis({ dateFrom, dateTo, statusId, requestTypeId, priorityId, assigneeId }) {
    // Si no viene rango, dejamos que service ponga defaults (30 días)
    const sql = `
    SELECT
      COUNT(*) FILTER (WHERE r.closed_at IS NULL AND r.is_active = true) AS backlog_total,

      COUNT(*) FILTER (
        WHERE r.created_at >= $1::timestamptz
          AND r.created_at <= $2::timestamptz
          AND r.is_active = true
      ) AS created_in_range,

      COUNT(*) FILTER (
        WHERE r.closed_at IS NOT NULL
          AND r.closed_at >= $1::timestamptz
          AND r.closed_at <= $2::timestamptz
          AND r.is_active = true
      ) AS closed_in_range,

      COALESCE(AVG(
        EXTRACT(EPOCH FROM (r.first_assigned_at - r.created_at)) / 3600.0
      ) FILTER (
        WHERE r.first_assigned_at IS NOT NULL
          AND r.is_active = true
      ), 0) AS avg_time_to_first_assign_hours
    FROM requests r
    WHERE
      ($3::uuid is null OR r.status_id = $3)
      AND ($4::uuid is null OR r.request_type_id = $4)
      AND ($5::uuid is null OR r.priority_id = $5)
      AND (
        $6::uuid is null OR EXISTS (
          SELECT 1
          FROM request_assignments ra
          WHERE ra.request_id = r.id
            AND ra.is_active = true
            AND ra.assigned_to = $6
        )
      )
  `;

    const params = [
        dateFrom, dateTo,
        statusId || null,
        requestTypeId || null,
        priorityId || null,
        assigneeId || null
    ];

    const { rows } = await pool.query(sql, params);
    return rows[0];
}

async function getBacklogByStatus({ statusId, requestTypeId, priorityId, assigneeId }) {
    const sql = `
    SELECT
      rs.id AS status_id,
      rs.code,
      rs.name,
      COUNT(*)::int AS count
    FROM requests r
    JOIN request_status rs ON rs.id = r.status_id
    WHERE
      r.closed_at IS NULL
      AND r.is_active = true
      AND ($1::uuid is null OR r.status_id = $1)
      AND ($2::uuid is null OR r.request_type_id = $2)
      AND ($3::uuid is null OR r.priority_id = $3)
      AND (
        $4::uuid is null OR EXISTS (
          SELECT 1
          FROM request_assignments ra
          WHERE ra.request_id = r.id
            AND ra.is_active = true
            AND ra.assigned_to = $4
        )
      )
    GROUP BY rs.id, rs.code, rs.name, rs.sort_order
    ORDER BY rs.sort_order ASC, rs.id ASC
  `;

    const params = [
        statusId || null,
        requestTypeId || null,
        priorityId || null,
        assigneeId || null
    ];

    const { rows } = await pool.query(sql, params);
    return rows;
}

async function getThroughput({
    dateFrom,
    dateTo,
    groupByUnit,      // 'day' | 'week' | 'month' (whitelist desde service)
    intervalLiteral,  // '1 day' | '1 week' | '1 month'
    statusId,
    requestTypeId,
    priorityId,
    assigneeId
}) {
    // groupByUnit e intervalLiteral vienen sanitizados desde service (whitelist).
    const sql = `
    WITH
    series AS (
      SELECT generate_series(
        date_trunc('${groupByUnit}', $1::timestamptz),
        date_trunc('${groupByUnit}', $2::timestamptz),
        interval '${intervalLiteral}'
      ) AS bucket
    ),
    created_agg AS (
      SELECT
        date_trunc('${groupByUnit}', r.created_at) AS bucket,
        COUNT(*)::int AS created
      FROM requests r
      WHERE
        r.is_active = true
        AND r.created_at >= $1::timestamptz
        AND r.created_at <= $2::timestamptz
        AND ($3::uuid is null OR r.status_id = $3)
        AND ($4::uuid is null OR r.request_type_id = $4)
        AND ($5::uuid is null OR r.priority_id = $5)
        AND (
          $6::uuid is null OR EXISTS (
            SELECT 1
            FROM request_assignments ra
            WHERE ra.request_id = r.id
              AND ra.is_active = true
              AND ra.assigned_to = $6
          )
        )
      GROUP BY 1
    ),
    closed_agg AS (
      SELECT
        date_trunc('${groupByUnit}', r.closed_at) AS bucket,
        COUNT(*)::int AS closed
      FROM requests r
      WHERE
        r.is_active = true
        AND r.closed_at IS NOT NULL
        AND r.closed_at >= $1::timestamptz
        AND r.closed_at <= $2::timestamptz
        AND ($3::uuid is null OR r.status_id = $3)
        AND ($4::uuid is null OR r.request_type_id = $4)
        AND ($5::uuid is null OR r.priority_id = $5)
        AND (
          $6::uuid is null OR EXISTS (
            SELECT 1
            FROM request_assignments ra
            WHERE ra.request_id = r.id
              AND ra.is_active = true
              AND ra.assigned_to = $6
          )
        )
      GROUP BY 1
    )
    SELECT
      (s.bucket::date)::text AS bucket,
      COALESCE(c.created, 0)::int AS created,
      COALESCE(cl.closed, 0)::int AS closed
    FROM series s
    LEFT JOIN created_agg c ON c.bucket = s.bucket
    LEFT JOIN closed_agg cl ON cl.bucket = s.bucket
    ORDER BY s.bucket ASC
  `;

    const params = [
        dateFrom,
        dateTo,
        statusId || null,
        requestTypeId || null,
        priorityId || null,
        assigneeId || null
    ];

    const { rows } = await pool.query(sql, params);
    return rows;
}

async function getTimeStats({ dateFrom, dateTo, statusId, requestTypeId, priorityId, assigneeId }) {
    const sql = `
    WITH base AS (
      SELECT
        EXTRACT(EPOCH FROM (r.closed_at - r.created_at)) / 3600.0 AS lead_hours,
        EXTRACT(EPOCH FROM (r.closed_at - r.first_assigned_at)) / 3600.0 AS cycle_hours
      FROM requests r
      WHERE
        r.is_active = true
        AND r.closed_at IS NOT NULL
        AND r.closed_at >= $1::timestamptz
        AND r.closed_at <= $2::timestamptz
        AND ($3::uuid is null OR r.status_id = $3)
        AND ($4::uuid is null OR r.request_type_id = $4)
        AND ($5::uuid is null OR r.priority_id = $5)
        AND (
          $6::uuid is null OR EXISTS (
            SELECT 1
            FROM request_assignments ra
            WHERE ra.request_id = r.id
              AND ra.is_active = true
              AND ra.assigned_to = $6
          )
        )
    )
    SELECT
      COUNT(*)::int AS total_closed,

      -- Lead time percentiles (created -> closed)
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY lead_hours)::numeric, 2) AS lead_p50_h,
      ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY lead_hours)::numeric, 2) AS lead_p90_h,

      -- Cycle time percentiles (first_assigned -> closed) (solo donde first_assigned exista)
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cycle_hours)::numeric, 2) AS cycle_p50_h,
      ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY cycle_hours)::numeric, 2) AS cycle_p90_h
    FROM base
    WHERE lead_hours IS NOT NULL
  `;

    const params = [
        dateFrom,
        dateTo,
        statusId || null,
        requestTypeId || null,
        priorityId || null,
        assigneeId || null
    ];

    const { rows } = await pool.query(sql, params);
    return rows[0];
}

async function getStatusTime({ dateFrom, dateTo, statusId, requestTypeId, priorityId, assigneeId }) {
  const sql = `
    WITH filtered_requests AS (
      SELECT r.id, r.closed_at
      FROM requests r
      WHERE
        r.is_active = true
        AND ($1::uuid is null OR r.request_type_id = $1)
        AND ($2::uuid is null OR r.priority_id = $2)
        AND (
          $3::uuid is null OR EXISTS (
            SELECT 1
            FROM request_assignments ra
            WHERE ra.request_id = r.id
              AND ra.assigned_to = $3
          )
        )
    ),
    history AS (
      SELECT
        h.request_id,
        h.to_status_id AS status_id,
        h.changed_at,
        LEAD(h.changed_at) OVER (PARTITION BY h.request_id ORDER BY h.changed_at) AS next_changed_at
      FROM request_status_history h
      JOIN filtered_requests fr ON fr.id = h.request_id
      WHERE
        h.is_active = true
        AND h.to_status_id IS NOT NULL
        AND h.changed_at >= $4::timestamptz
        AND h.changed_at <= $5::timestamptz
    ),
    durations AS (
      SELECT
        h.request_id,
        h.status_id,
        EXTRACT(EPOCH FROM (COALESCE(h.next_changed_at, fr.closed_at, NOW()) - h.changed_at)) / 3600.0 AS hours_in_status
      FROM history h
      JOIN filtered_requests fr ON fr.id = h.request_id
      WHERE COALESCE(h.next_changed_at, fr.closed_at, NOW()) >= h.changed_at
    )
    SELECT
      rs.id AS status_id,
      rs.code,
      rs.name,
      COUNT(*)::int AS count_transitions,

      ROUND(MIN(d.hours_in_status)::numeric, 2) AS min_h,
      ROUND(MAX(d.hours_in_status)::numeric, 2) AS max_h,
      ROUND(AVG(d.hours_in_status)::numeric, 2) AS avg_h,

      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY d.hours_in_status)::numeric, 2) AS p50_h,
      ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY d.hours_in_status)::numeric, 2) AS p90_h
    FROM durations d
    JOIN request_status rs ON rs.id = d.status_id
    WHERE ($6::uuid is null OR d.status_id = $6)
    GROUP BY rs.id, rs.code, rs.name, rs.sort_order
    ORDER BY rs.sort_order ASC, rs.id ASC
  `;

  const params = [
    requestTypeId || null,
    priorityId || null,
    assigneeId || null,
    dateFrom,
    dateTo,
    statusId || null
  ];

  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getWorkloadBacklogByAssignee({ statusId, requestTypeId, priorityId }) {
    // “Backlog por analista” se define por la asignación activa (request_assignments.is_active=true)
    // y requests abiertas (closed_at is null).
    const sql = `
    SELECT
      u.id AS assignee_id,
      u.username,
      u.full_name,
      COUNT(*)::int AS open_assigned
    FROM request_assignments ra
    JOIN requests r ON r.id = ra.request_id
    JOIN users u ON u.id = ra.assigned_to
    WHERE
      ra.is_active = true
      AND r.is_active = true
      AND r.closed_at IS NULL
      AND ($1::uuid is null OR r.status_id = $1)
      AND ($2::uuid is null OR r.request_type_id = $2)
      AND ($3::uuid is null OR r.priority_id = $3)
    GROUP BY u.id, u.username, u.full_name
    ORDER BY open_assigned DESC, u.full_name ASC
  `;

    const params = [
        statusId || null,
        requestTypeId || null,
        priorityId || null
    ];

    const { rows } = await pool.query(sql, params);
    return rows;
}

async function getWorkloadActivityByAssignee({ dateFrom, dateTo, statusId, requestTypeId, priorityId }) {
    // “Actividad en rango”:
    // - created: requests creadas en rango, agrupadas por created_by (actor)
    // - closed: requests cerradas en rango, atribuida al “assignee actual” (si existe) o null
    // - reassignments: cantidad de veces que hubo reasignación en rango (asignaciones nuevas)
    //
    // Para closed: como no tienes "closed_by" en requests, lo más consistente es atribuirlo al assigned_to activo
    // (si el request está cerrado, idealmente debería seguir existiendo una última asignación activa o al menos la última asignación).
    // Si en tu data al cerrar desactivas la asignación, podríamos usar "última asignación" en vez de is_active.

    const sql = `
    WITH
    created AS (
      SELECT
        r.created_by AS user_id,
        COUNT(*)::int AS created_count
      FROM requests r
      WHERE
        r.is_active = true
        AND r.created_at >= $1::timestamptz
        AND r.created_at <= $2::timestamptz
        AND ($3::uuid is null OR r.status_id = $3)
        AND ($4::uuid is null OR r.request_type_id = $4)
        AND ($5::uuid is null OR r.priority_id = $5)
      GROUP BY r.created_by
    ),
    closed AS (
      SELECT
        COALESCE(ra_last.assigned_to, NULL) AS user_id,
        COUNT(*)::int AS closed_count
      FROM requests r
      LEFT JOIN LATERAL (
        SELECT ra.assigned_to
        FROM request_assignments ra
        WHERE ra.request_id = r.id
        ORDER BY ra.assigned_at DESC
        LIMIT 1
      ) ra_last ON true
      WHERE
        r.is_active = true
        AND r.closed_at IS NOT NULL
        AND r.closed_at >= $1::timestamptz
        AND r.closed_at <= $2::timestamptz
        AND ($3::uuid is null OR r.status_id = $3)
        AND ($4::uuid is null OR r.request_type_id = $4)
        AND ($5::uuid is null OR r.priority_id = $5)
      GROUP BY COALESCE(ra_last.assigned_to, NULL)
    ),
    reassignments AS (
      SELECT
        ra.assigned_to AS user_id,
        COUNT(*)::int AS reassigned_count
      FROM request_assignments ra
      JOIN requests r ON r.id = ra.request_id
      WHERE
        ra.is_active = true
        AND r.is_active = true
        AND ra.assigned_at >= $1::timestamptz
        AND ra.assigned_at <= $2::timestamptz
        AND ($3::uuid is null OR r.status_id = $3)
        AND ($4::uuid is null OR r.request_type_id = $4)
        AND ($5::uuid is null OR r.priority_id = $5)
      GROUP BY ra.assigned_to
    )
    SELECT
      u.id AS user_id,
      u.username,
      u.full_name,
      COALESCE(c.created_count, 0)::int AS created_in_range,
      COALESCE(cl.closed_count, 0)::int AS closed_in_range,
      COALESCE(ras.reassigned_count, 0)::int AS assignments_in_range
    FROM users u
    LEFT JOIN created c ON c.user_id = u.id
    LEFT JOIN closed cl ON cl.user_id = u.id
    LEFT JOIN reassignments ras ON ras.user_id = u.id
    WHERE u.is_active = true
      AND (
        COALESCE(c.created_count, 0)
        + COALESCE(cl.closed_count, 0)
        + COALESCE(ras.reassigned_count, 0)
      ) > 0
    ORDER BY assignments_in_range DESC, closed_in_range DESC, created_in_range DESC, u.full_name ASC
  `;

    const params = [
        dateFrom,
        dateTo,
        statusId || null,
        requestTypeId || null,
        priorityId || null
    ];

    const { rows } = await pool.query(sql, params);
    return rows;
}

async function getDistributionOpen({ dateFrom, dateTo, statusId, requestTypeId, priorityId, assigneeId }) {
  // Abiertas = closed_at IS NULL
  // assignee: si no tiene asignación activa, cae en "Sin asignar"
  const paramsBase = [
    statusId || null,
    requestTypeId || null,
    priorityId || null,
    assigneeId || null
  ];

  const statusSql = `
    SELECT rs.id, rs.code, rs.name, COUNT(*)::int AS count
    FROM requests r
    JOIN request_status rs ON rs.id = r.status_id
    WHERE r.is_active = true
      AND r.closed_at IS NULL
      AND ($1::uuid is null OR r.status_id = $1)
      AND ($2::uuid is null OR r.request_type_id = $2)
      AND ($3::uuid is null OR r.priority_id = $3)
      AND (
        $4::uuid is null OR EXISTS (
          SELECT 1 FROM request_assignments ra
          WHERE ra.request_id = r.id AND ra.assigned_to = $4
        )
      )
    GROUP BY rs.id, rs.code, rs.name, rs.sort_order
    ORDER BY rs.sort_order ASC, rs.id ASC
  `;

  const prioritySql = `
    SELECT rp.id, rp.code, rp.name, COUNT(*)::int AS count
    FROM requests r
    JOIN request_priorities rp ON rp.id = r.priority_id
    WHERE r.is_active = true
      AND r.closed_at IS NULL
      AND ($1::uuid is null OR r.status_id = $1)
      AND ($2::uuid is null OR r.request_type_id = $2)
      AND ($3::uuid is null OR r.priority_id = $3)
      AND (
        $4::uuid is null OR EXISTS (
          SELECT 1 FROM request_assignments ra
          WHERE ra.request_id = r.id AND ra.assigned_to = $4
        )
      )
    GROUP BY rp.id, rp.code, rp.name, rp.sort_order
    ORDER BY rp.sort_order ASC, rp.id ASC
  `;

  const typeSql = `
    SELECT rt.id, rt.code, rt.name, COUNT(*)::int AS count
    FROM requests r
    JOIN request_types rt ON rt.id = r.request_type_id
    WHERE r.is_active = true
      AND r.closed_at IS NULL
      AND ($1::uuid is null OR r.status_id = $1)
      AND ($2::uuid is null OR r.request_type_id = $2)
      AND ($3::uuid is null OR r.priority_id = $3)
      AND (
        $4::uuid is null OR EXISTS (
          SELECT 1 FROM request_assignments ra
          WHERE ra.request_id = r.id AND ra.assigned_to = $4
        )
      )
    GROUP BY rt.id, rt.code, rt.name
    ORDER BY count DESC, rt.name ASC
  `;

  const assigneeSql = `
    WITH base AS (
      SELECT
        r.id,
        (
          SELECT ra.assigned_to
          FROM request_assignments ra
          WHERE ra.request_id = r.id AND ra.is_active = true
          ORDER BY ra.assigned_at DESC
          LIMIT 1
        ) AS assignee_id
      FROM requests r
      WHERE r.is_active = true
        AND r.closed_at IS NULL
        AND ($1::uuid is null OR r.status_id = $1)
        AND ($2::uuid is null OR r.request_type_id = $2)
        AND ($3::uuid is null OR r.priority_id = $3)
        AND (
          $4::uuid is null OR EXISTS (
            SELECT 1 FROM request_assignments ra2
            WHERE ra2.request_id = r.id AND ra2.assigned_to = $4
          )
        )
    )
    SELECT
      b.assignee_id AS id,
      COALESCE(u.username, 'SIN_ASIGNAR') AS username,
      COALESCE(u.full_name, 'Sin asignar') AS full_name,
      COUNT(*)::int AS count
    FROM base b
    LEFT JOIN users u ON u.id = b.assignee_id
    GROUP BY b.assignee_id, u.username, u.full_name
    ORDER BY count DESC, full_name ASC
  `;

  const [statusRes, priorityRes, typeRes, assigneeRes] = await Promise.all([
    pool.query(statusSql, paramsBase),
    pool.query(prioritySql, paramsBase),
    pool.query(typeSql, paramsBase),
    pool.query(assigneeSql, paramsBase)
  ]);

  return {
    status: statusRes.rows,
    priority: priorityRes.rows,
    type: typeRes.rows,
    assignee: assigneeRes.rows
  };
}

async function getDistributionCreated({ dateFrom, dateTo, statusId, requestTypeId, priorityId, assigneeId }) {
  // Creadas en período = created_at rango
  const paramsBase = [
    dateFrom,
    dateTo,
    statusId || null,
    requestTypeId || null,
    priorityId || null,
    assigneeId || null
  ];

  const statusSql = `
    SELECT rs.id, rs.code, rs.name, COUNT(*)::int AS count
    FROM requests r
    JOIN request_status rs ON rs.id = r.status_id
    WHERE r.is_active = true
      AND r.created_at >= $1::timestamptz AND r.created_at <= $2::timestamptz
      AND ($3::uuid is null OR r.status_id = $3)
      AND ($4::uuid is null OR r.request_type_id = $4)
      AND ($5::uuid is null OR r.priority_id = $5)
      AND (
        $6::uuid is null OR EXISTS (
          SELECT 1 FROM request_assignments ra
          WHERE ra.request_id = r.id AND ra.assigned_to = $6
        )
      )
    GROUP BY rs.id, rs.code, rs.name, rs.sort_order
    ORDER BY rs.sort_order ASC, rs.id ASC
  `;

  const prioritySql = `
    SELECT rp.id, rp.code, rp.name, COUNT(*)::int AS count
    FROM requests r
    JOIN request_priorities rp ON rp.id = r.priority_id
    WHERE r.is_active = true
      AND r.created_at >= $1::timestamptz AND r.created_at <= $2::timestamptz
      AND ($3::uuid is null OR r.status_id = $3)
      AND ($4::uuid is null OR r.request_type_id = $4)
      AND ($5::uuid is null OR r.priority_id = $5)
      AND (
        $6::uuid is null OR EXISTS (
          SELECT 1 FROM request_assignments ra
          WHERE ra.request_id = r.id AND ra.assigned_to = $6
        )
      )
    GROUP BY rp.id, rp.code, rp.name, rp.sort_order
    ORDER BY rp.sort_order ASC, rp.id ASC
  `;

  const typeSql = `
    SELECT rt.id, rt.code, rt.name, COUNT(*)::int AS count
    FROM requests r
    JOIN request_types rt ON rt.id = r.request_type_id
    WHERE r.is_active = true
      AND r.created_at >= $1::timestamptz AND r.created_at <= $2::timestamptz
      AND ($3::uuid is null OR r.status_id = $3)
      AND ($4::uuid is null OR r.request_type_id = $4)
      AND ($5::uuid is null OR r.priority_id = $5)
      AND (
        $6::uuid is null OR EXISTS (
          SELECT 1 FROM request_assignments ra
          WHERE ra.request_id = r.id AND ra.assigned_to = $6
        )
      )
    GROUP BY rt.id, rt.code, rt.name
    ORDER BY count DESC, rt.name ASC
  `;

  // creadas por analista = created_by
  const assigneeSql = `
    SELECT
      u.id,
      u.username,
      u.full_name,
      COUNT(*)::int AS count
    FROM requests r
    JOIN users u ON u.id = r.created_by
    WHERE r.is_active = true
      AND r.created_at >= $1::timestamptz AND r.created_at <= $2::timestamptz
      AND ($3::uuid is null OR r.status_id = $3)
      AND ($4::uuid is null OR r.request_type_id = $4)
      AND ($5::uuid is null OR r.priority_id = $5)
      AND ($6::uuid is null OR u.id = $6)
    GROUP BY u.id, u.username, u.full_name
    ORDER BY count DESC, u.full_name ASC
  `;

  const [statusRes, priorityRes, typeRes, assigneeRes] = await Promise.all([
    pool.query(statusSql, paramsBase),
    pool.query(prioritySql, paramsBase),
    pool.query(typeSql, paramsBase),
    pool.query(assigneeSql, paramsBase)
  ]);

  return {
    status: statusRes.rows,
    priority: priorityRes.rows,
    type: typeRes.rows,
    assignee: assigneeRes.rows
  };
}

async function getDistributionClosed({ dateFrom, dateTo, statusId, requestTypeId, priorityId, assigneeId }) {
  // Terminadas en período = closed_at rango
  // cerradas por analista: atribuimos al "último asignado" (última asignación por fecha)
  const paramsBase = [
    dateFrom,
    dateTo,
    statusId || null,
    requestTypeId || null,
    priorityId || null,
    assigneeId || null
  ];

  const statusSql = `
    SELECT rs.id, rs.code, rs.name, COUNT(*)::int AS count
    FROM requests r
    JOIN request_status rs ON rs.id = r.status_id
    WHERE r.is_active = true
      AND r.closed_at IS NOT NULL
      AND r.closed_at >= $1::timestamptz AND r.closed_at <= $2::timestamptz
      AND ($3::uuid is null OR r.status_id = $3)
      AND ($4::uuid is null OR r.request_type_id = $4)
      AND ($5::uuid is null OR r.priority_id = $5)
      AND (
        $6::uuid is null OR EXISTS (
          SELECT 1 FROM request_assignments ra
          WHERE ra.request_id = r.id AND ra.assigned_to = $6
        )
      )
    GROUP BY rs.id, rs.code, rs.name, rs.sort_order
    ORDER BY rs.sort_order ASC, rs.id ASC
  `;

  const prioritySql = `
    SELECT rp.id, rp.code, rp.name, COUNT(*)::int AS count
    FROM requests r
    JOIN request_priorities rp ON rp.id = r.priority_id
    WHERE r.is_active = true
      AND r.closed_at IS NOT NULL
      AND r.closed_at >= $1::timestamptz AND r.closed_at <= $2::timestamptz
      AND ($3::uuid is null OR r.status_id = $3)
      AND ($4::uuid is null OR r.request_type_id = $4)
      AND ($5::uuid is null OR r.priority_id = $5)
      AND (
        $6::uuid is null OR EXISTS (
          SELECT 1 FROM request_assignments ra
          WHERE ra.request_id = r.id AND ra.assigned_to = $6
        )
      )
    GROUP BY rp.id, rp.code, rp.name, rp.sort_order
    ORDER BY rp.sort_order ASC, rp.id ASC
  `;

  const typeSql = `
    SELECT rt.id, rt.code, rt.name, COUNT(*)::int AS count
    FROM requests r
    JOIN request_types rt ON rt.id = r.request_type_id
    WHERE r.is_active = true
      AND r.closed_at IS NOT NULL
      AND r.closed_at >= $1::timestamptz AND r.closed_at <= $2::timestamptz
      AND ($3::uuid is null OR r.status_id = $3)
      AND ($4::uuid is null OR r.request_type_id = $4)
      AND ($5::uuid is null OR r.priority_id = $5)
      AND (
        $6::uuid is null OR EXISTS (
          SELECT 1 FROM request_assignments ra
          WHERE ra.request_id = r.id AND ra.assigned_to = $6
        )
      )
    GROUP BY rt.id, rt.code, rt.name
    ORDER BY count DESC, rt.name ASC
  `;

  const assigneeSql = `
    WITH last_assignee AS (
      SELECT
        r.id AS request_id,
        (
          SELECT ra.assigned_to
          FROM request_assignments ra
          WHERE ra.request_id = r.id
          ORDER BY ra.assigned_at DESC
          LIMIT 1
        ) AS user_id
      FROM requests r
      WHERE r.is_active = true
        AND r.closed_at IS NOT NULL
        AND r.closed_at >= $1::timestamptz AND r.closed_at <= $2::timestamptz
        AND ($3::uuid is null OR r.status_id = $3)
        AND ($4::uuid is null OR r.request_type_id = $4)
        AND ($5::uuid is null OR r.priority_id = $5)
        AND (
          $6::uuid is null OR EXISTS (
            SELECT 1 FROM request_assignments ra2
            WHERE ra2.request_id = r.id AND ra2.assigned_to = $6
          )
        )
    )
    SELECT
      COALESCE(u.id::text, 'SIN_ASIGNAR') AS id,
      COALESCE(u.username, 'SIN_ASIGNAR') AS username,
      COALESCE(u.full_name, 'Sin asignar') AS full_name,
      COUNT(*)::int AS count
    FROM last_assignee la
    LEFT JOIN users u ON u.id = la.user_id
    GROUP BY u.id, u.username, u.full_name
    ORDER BY count DESC, full_name ASC
  `;

  const [statusRes, priorityRes, typeRes, assigneeRes] = await Promise.all([
    pool.query(statusSql, paramsBase),
    pool.query(prioritySql, paramsBase),
    pool.query(typeSql, paramsBase),
    pool.query(assigneeSql, paramsBase)
  ]);

  return {
    status: statusRes.rows,
    priority: priorityRes.rows,
    type: typeRes.rows,
    assignee: assigneeRes.rows
  };
}

async function getProcessTimeStats({
  dateFrom,
  dateTo,
  statusId,
  requestTypeId,
  priorityId,
  assigneeId,
  inProgressStatusCode
}) {
  const sql = `
    WITH inprog AS (
      SELECT id
      FROM request_status
      WHERE UPPER(code) = UPPER($7)
      LIMIT 1
    ),
    base AS (
      SELECT
        r.id,
        EXTRACT(EPOCH FROM (r.closed_at - r.created_at))/3600.0 AS lead_h,
        EXTRACT(EPOCH FROM (r.closed_at - r.first_assigned_at))/3600.0 AS cycle_h,
        (
          SELECT MIN(h.changed_at)
          FROM request_status_history h
          JOIN inprog ip ON ip.id = h.to_status_id
          WHERE h.request_id = r.id
            AND h.is_active = true
        ) AS inprog_start
      FROM requests r
      WHERE r.is_active = true
        AND r.closed_at IS NOT NULL
        AND r.closed_at >= $1::timestamptz
        AND r.closed_at <= $2::timestamptz
        AND ($3::uuid is null OR r.status_id = $3)
        AND ($4::uuid is null OR r.request_type_id = $4)
        AND ($5::uuid is null OR r.priority_id = $5)
        AND (
          $6::uuid is null OR EXISTS (
            SELECT 1 FROM request_assignments ra
            WHERE ra.request_id = r.id AND ra.assigned_to = $6
          )
        )
    ),
    base2 AS (
      SELECT
        lead_h,
        cycle_h,
        EXTRACT(EPOCH FROM ( (SELECT (closed_at) FROM requests rr WHERE rr.id = b.id) - b.inprog_start))/3600.0 AS inprog_h
      FROM base b
    )
    SELECT
      COUNT(*)::int AS total_closed,

      ROUND(MIN(lead_h)::numeric, 2) AS lead_min_h,
      ROUND(MAX(lead_h)::numeric, 2) AS lead_max_h,
      ROUND(AVG(lead_h)::numeric, 2) AS lead_avg_h,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY lead_h)::numeric, 2) AS lead_p50_h,
      ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY lead_h)::numeric, 2) AS lead_p90_h,

      ROUND(MIN(cycle_h)::numeric, 2) AS cycle_min_h,
      ROUND(MAX(cycle_h)::numeric, 2) AS cycle_max_h,
      ROUND(AVG(cycle_h)::numeric, 2) AS cycle_avg_h,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cycle_h)::numeric, 2) AS cycle_p50_h,
      ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY cycle_h)::numeric, 2) AS cycle_p90_h,

      ROUND(MIN(inprog_h)::numeric, 2) AS inprog_min_h,
      ROUND(MAX(inprog_h)::numeric, 2) AS inprog_max_h,
      ROUND(AVG(inprog_h)::numeric, 2) AS inprog_avg_h,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY inprog_h)::numeric, 2) AS inprog_p50_h,
      ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY inprog_h)::numeric, 2) AS inprog_p90_h
    FROM base2
    WHERE lead_h IS NOT NULL
  `;

  const params = [
    dateFrom,
    dateTo,
    statusId || null,
    requestTypeId || null,
    priorityId || null,
    assigneeId || null,
    inProgressStatusCode
  ];

  const { rows } = await pool.query(sql, params);
  return rows[0];
}

// module.exports = {
//     getOverviewKpis,
//     getBacklogByStatus,
//     getThroughput,
//     getTimeStats,
//     getStatusTime,
//     getWorkloadBacklogByAssignee,
//     getWorkloadActivityByAssignee
// };

module.exports = {
  getOverviewKpis,
  getBacklogByStatus,
  getThroughput,
  getTimeStats,
  getStatusTime,
//   getWorkload,
  getDistributionOpen,
  getDistributionCreated,
  getDistributionClosed,
  getProcessTimeStats
};