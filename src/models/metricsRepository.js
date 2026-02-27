const { pool } = require('../configs/db');

async function getOverviewKpis({ dateFrom, dateTo, statusId, requestTypeId, priorityId, assigneeId }) {
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
    groupByUnit,
    intervalLiteral,
    statusId,
    requestTypeId,
    priorityId,
    assigneeId
}) {
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
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY lead_hours)::numeric, 2) AS lead_p50_h,
      ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY lead_hours)::numeric, 2) AS lead_p90_h,
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
              AND ra.is_active = true
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
          WHERE ra.request_id = r.id
            AND ra.is_active = true
            AND ra.assigned_to = $4
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
          WHERE ra.request_id = r.id
            AND ra.is_active = true
            AND ra.assigned_to = $4
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
          WHERE ra.request_id = r.id
            AND ra.is_active = true
            AND ra.assigned_to = $4
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
            WHERE ra2.request_id = r.id
              AND ra2.is_active = true
              AND ra2.assigned_to = $4
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
          WHERE ra.request_id = r.id
            AND ra.is_active = true
            AND ra.assigned_to = $6
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
          WHERE ra.request_id = r.id
            AND ra.is_active = true
            AND ra.assigned_to = $6
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
          WHERE ra.request_id = r.id
            AND ra.is_active = true
            AND ra.assigned_to = $6
        )
      )
    GROUP BY rt.id, rt.code, rt.name
    ORDER BY count DESC, rt.name ASC
  `;

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
          WHERE ra.request_id = r.id
            AND ra.is_active = true
            AND ra.assigned_to = $6
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
          WHERE ra.request_id = r.id
            AND ra.is_active = true
            AND ra.assigned_to = $6
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
          WHERE ra.request_id = r.id
            AND ra.is_active = true
            AND ra.assigned_to = $6
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
            WHERE ra2.request_id = r.id
              AND ra2.is_active = true
              AND ra2.assigned_to = $6
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
        ) AS inprog_start,
        r.closed_at AS closed_at
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
            WHERE ra.request_id = r.id
              AND ra.is_active = true
              AND ra.assigned_to = $6
          )
        )
    ),
    base2 AS (
      SELECT
        lead_h,
        cycle_h,
        CASE
          WHEN inprog_start IS NULL THEN NULL
          ELSE EXTRACT(EPOCH FROM (closed_at - inprog_start))/3600.0
        END AS inprog_h
      FROM base
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

async function getRequestTimes({ dateFrom, dateTo, statusId, requestTypeId, priorityId, assigneeId }) {
    const sql = `
    WITH base AS (
      SELECT
        r.id,
        r.title,
        r.created_at,
        r.closed_at,
        r.status_id,
        rs.code AS status_code,
        rs.name AS status_name,
        rt.name AS type_name,
        rp.name AS priority_name,
        (
          SELECT ra.assigned_to
          FROM request_assignments ra
          WHERE ra.request_id = r.id
          ORDER BY ra.assigned_at DESC
          LIMIT 1
        ) AS assignee_id
      FROM requests r
      JOIN request_status rs ON rs.id = r.status_id
      JOIN request_types rt ON rt.id = r.request_type_id
      JOIN request_priorities rp ON rp.id = r.priority_id
      WHERE
        r.is_active = true
        AND r.closed_at IS NOT NULL
        AND r.closed_at >= $1::timestamptz
        AND r.closed_at <= $2::timestamptz
        AND ($3::uuid IS NULL OR r.status_id = $3)
        AND ($4::uuid IS NULL OR r.request_type_id = $4)
        AND ($5::uuid IS NULL OR r.priority_id = $5)
        AND (
          $6::uuid IS NULL OR EXISTS (
            SELECT 1 FROM request_assignments ra2
            WHERE ra2.request_id = r.id
              AND ra2.assigned_to = $6
          )
        )
    ),
    marks AS (
      SELECT
        b.*,

        -- primer momento en que entró a ASSIGNED
        (
          SELECT MIN(h.changed_at)
          FROM request_status_history h
          WHERE h.request_id = b.id
            AND h.is_active = true
            AND h.to_status_id = (
              SELECT id FROM request_status WHERE UPPER(code) = 'ASSIGNED' LIMIT 1
            )
        ) AS first_assigned_at,

        -- primer momento en que entró a IN_PROGRESS
        (
          SELECT MIN(h.changed_at)
          FROM request_status_history h
          WHERE h.request_id = b.id
            AND h.is_active = true
            AND h.to_status_id = (
              SELECT id FROM request_status WHERE UPPER(code) = 'IN_PROGRESS' LIMIT 1
            )
        ) AS first_in_progress_at

      FROM base b
    )
    SELECT
      m.id,
      m.title,
      m.status_id,
      m.status_code,
      m.status_name,
      m.type_name,
      m.priority_name,
      u.full_name AS assignee_name,
      u.username AS assignee_username,
      m.created_at,
      m.closed_at,

      -- Sin asignar: created -> first ASSIGNED (o closed si nunca pasó)
      ROUND(EXTRACT(EPOCH FROM (COALESCE(m.first_assigned_at, m.closed_at) - m.created_at)) / 3600.0, 2) AS unassigned_h,

      -- Asignado: ASSIGNED -> IN_PROGRESS (fallbacks seguros)
      ROUND(EXTRACT(EPOCH FROM (COALESCE(m.first_in_progress_at, m.closed_at) - COALESCE(m.first_assigned_at, m.created_at))) / 3600.0, 2) AS assigned_h,

      -- En progreso: IN_PROGRESS -> closed (fallbacks seguros)
      ROUND(EXTRACT(EPOCH FROM (m.closed_at - COALESCE(m.first_in_progress_at, COALESCE(m.first_assigned_at, m.created_at)))) / 3600.0, 2) AS in_progress_h,

      -- Total: created -> closed
      ROUND(EXTRACT(EPOCH FROM (m.closed_at - m.created_at)) / 3600.0, 2) AS total_h

    FROM marks m
    LEFT JOIN users u ON u.id = m.assignee_id
    ORDER BY total_h DESC, m.closed_at DESC;
  `;

    const params = [
        dateFrom,
        dateTo,
        statusId || null,
        requestTypeId || null,
        priorityId || null,
        assigneeId || null,
    ];

    const { rows } = await pool.query(sql, params);
    return rows;
}

async function getRequestTimesLive({
    dateFrom,
    dateTo,
    statusId,
    requestTypeId,
    priorityId,
    assigneeId,
    includeClosed,
}) {
    const sql = `
    WITH base AS (
      SELECT
        r.id,
        r.title,
        r.created_at,
        r.closed_at,
        COALESCE(r.closed_at, NOW()) AS end_at,
        r.status_id,
        rs.code AS status_code,
        rs.name AS status_name,
        rt.name AS type_name,
        rp.name AS priority_name,
        (
          SELECT ra.assigned_to
          FROM request_assignments ra
          WHERE ra.request_id = r.id
          ORDER BY ra.assigned_at DESC
          LIMIT 1
        ) AS assignee_id
      FROM requests r
      JOIN request_status rs ON rs.id = r.status_id
      JOIN request_types rt ON rt.id = r.request_type_id
      JOIN request_priorities rp ON rp.id = r.priority_id
      WHERE
        r.is_active = true
        AND r.created_at >= $1::timestamptz
        AND r.created_at <= $2::timestamptz
        AND ($3::uuid IS NULL OR r.status_id = $3)
        AND ($4::uuid IS NULL OR r.request_type_id = $4)
        AND ($5::uuid IS NULL OR r.priority_id = $5)
        AND (
          $6::uuid IS NULL OR EXISTS (
            SELECT 1 FROM request_assignments ra2
            WHERE ra2.request_id = r.id
              AND ra2.assigned_to = $6
          )
        )
        AND (
          $7::boolean = true OR r.closed_at IS NULL
        )
    ),
    marks AS (
      SELECT
        b.*,

        (
          SELECT MIN(h.changed_at)
          FROM request_status_history h
          WHERE h.request_id = b.id
            AND h.is_active = true
            AND h.to_status_id = (
              SELECT id FROM request_status WHERE UPPER(code) = 'ASSIGNED' LIMIT 1
            )
        ) AS first_assigned_at,

        (
          SELECT MIN(h.changed_at)
          FROM request_status_history h
          WHERE h.request_id = b.id
            AND h.is_active = true
            AND h.to_status_id = (
              SELECT id FROM request_status WHERE UPPER(code) = 'IN_PROGRESS' LIMIT 1
            )
        ) AS first_in_progress_at,

        -- Momento en que entró al estado ACTUAL (para calcular "tiempo en estado actual")
        COALESCE((
          SELECT MAX(h.changed_at)
          FROM request_status_history h
          WHERE h.request_id = b.id
            AND h.is_active = true
            AND h.to_status_id = b.status_id
        ), b.created_at) AS current_status_entered_at

      FROM base b
    )
    SELECT
      m.id,
      m.title,
      m.status_id,
      m.status_code,
      m.status_name,
      m.type_name,
      m.priority_name,
      u.full_name AS assignee_name,
      u.username AS assignee_username,
      m.created_at,
      m.closed_at,
      m.end_at,

-- Sin asignar:
-- Solo acumula si:
-- 1) llegó a ASSIGNED => hasta first_assigned_at
-- 2) NO llegó a ASSIGNED pero el estado actual ES UNASSIGNED => hasta end_at
ROUND(
  CASE
    WHEN m.first_assigned_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (m.first_assigned_at - m.created_at)) / 3600.0
    WHEN UPPER(m.status_code) = 'UNASSIGNED'
      THEN EXTRACT(EPOCH FROM (m.end_at - m.created_at)) / 3600.0
    ELSE 0
  END
, 2) AS unassigned_h,

-- Asignado:
-- Solo acumula si:
-- 1) llegó a IN_PROGRESS => (first_in_progress_at - first_assigned_at)
-- 2) NO llegó a IN_PROGRESS pero estado actual ES ASSIGNED => (end_at - first_assigned_at)
ROUND(
  CASE
    WHEN m.first_assigned_at IS NULL THEN 0
    WHEN m.first_in_progress_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (m.first_in_progress_at - m.first_assigned_at)) / 3600.0
    WHEN UPPER(m.status_code) = 'ASSIGNED'
      THEN EXTRACT(EPOCH FROM (m.end_at - m.first_assigned_at)) / 3600.0
    ELSE 0
  END
, 2) AS assigned_h,

-- En progreso:
-- Solo acumula si estado actual ES IN_PROGRESS (no se reparte a futuros estados)
ROUND(
  CASE
    WHEN m.first_in_progress_at IS NULL THEN 0
    WHEN UPPER(m.status_code) = 'IN_PROGRESS'
      THEN EXTRACT(EPOCH FROM (m.end_at - m.first_in_progress_at)) / 3600.0
    ELSE 0
  END
, 2) AS in_progress_h,

      ROUND(EXTRACT(EPOCH FROM (m.end_at - m.created_at)) / 3600.0, 2) AS total_h,

      ROUND(EXTRACT(EPOCH FROM (m.end_at - m.current_status_entered_at)) / 3600.0, 2) AS current_status_h

    FROM marks m
    LEFT JOIN users u ON u.id = m.assignee_id
    ORDER BY current_status_h DESC, total_h DESC, m.created_at ASC;
  `;

    const params = [
        dateFrom,
        dateTo,
        statusId || null,
        requestTypeId || null,
        priorityId || null,
        assigneeId || null,
        includeClosed === true, // boolean
    ];

    const { rows } = await pool.query(sql, params);
    return rows;
}

async function getRequestTimesLiveStats({ dateFrom, dateTo, statusId, requestTypeId, priorityId, assigneeId }) {
  const sql = `
    WITH base AS (
      SELECT
        r.id,
        EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 3600.0 AS total_h
      FROM requests r
      WHERE
        r.is_active = true
        AND r.closed_at IS NULL
        AND r.created_at >= $1::timestamptz
        AND r.created_at <= $2::timestamptz
        AND ($3::uuid IS NULL OR r.status_id = $3)
        AND ($4::uuid IS NULL OR r.request_type_id = $4)
        AND ($5::uuid IS NULL OR r.priority_id = $5)
        AND (
          $6::uuid IS NULL OR EXISTS (
            SELECT 1
            FROM request_assignments ra
            WHERE ra.request_id = r.id
              AND ra.is_active = true
              AND ra.assigned_to = $6
          )
        )
    )
    SELECT
      ROUND(MIN(total_h)::numeric, 2) AS min_h,
      ROUND(MAX(total_h)::numeric, 2) AS max_h,
      ROUND(AVG(total_h)::numeric, 2) AS avg_h
    FROM base
    WHERE total_h IS NOT NULL
  `;

  const params = [
    dateFrom,
    dateTo,
    statusId || null,
    requestTypeId || null,
    priorityId || null,
    assigneeId || null,
  ];

  const { rows } = await pool.query(sql, params);
  return rows[0];
}

module.exports = {
    getOverviewKpis,
    getBacklogByStatus,
    getThroughput,
    getTimeStats,
    getStatusTime,
    getWorkloadBacklogByAssignee,
    getWorkloadActivityByAssignee,
    getDistributionOpen,
    getDistributionCreated,
    getDistributionClosed,
    getProcessTimeStats,
    getRequestTimes,
    getRequestTimesLive,
    getRequestTimesLiveStats
};