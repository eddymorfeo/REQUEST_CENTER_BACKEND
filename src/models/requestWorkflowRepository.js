const { pool } = require("../configs/db");

const getRequestById = async (client, requestId) => {
  const executor = client || pool;
  const { rows } = await executor.query(
    `
    select *
    from requests
    where id = $1 and is_active = true
    limit 1
    `,
    [requestId]
  );
  return rows[0] || null;
};

const getStatusById = async (client, statusId) => {
  const executor = client || pool;
  const { rows } = await executor.query(
    `select id, code, is_terminal from request_status where id = $1 and is_active = true limit 1`,
    [statusId]
  );
  return rows[0] || null;
};

const closeActiveAssignment = async (client, requestId) => {
  await client.query(
    `
    update request_assignments
    set unassigned_at = now(),
        is_active = false,
        updated_at = now()
    where request_id = $1
      and is_active = true
      and unassigned_at is null
    `,
    [requestId]
  );
};

const createAssignment = async (client, { requestId, assignedTo, assignedBy, note }) => {
  const { rows } = await client.query(
    `
    insert into request_assignments (request_id, assigned_to, assigned_by, note)
    values ($1, $2, $3, $4)
    returning *
    `,
    [requestId, assignedTo, assignedBy, note ?? null]
  );
  return rows[0];
};

const setFirstAssignedAtIfNull = async (client, requestId) => {
  await client.query(
    `
    update requests
    set first_assigned_at = coalesce(first_assigned_at, now()),
        updated_at = now()
    where id = $1
    `,
    [requestId]
  );
};

const updateRequestStatus = async (client, { requestId, toStatusId, isTerminal }) => {
  const { rows } = await client.query(
    `
    update requests
    set status_id = $2,
        closed_at = case when $3 = true then coalesce(closed_at, now()) else null end,
        updated_at = now()
    where id = $1
    returning *
    `,
    [requestId, toStatusId, isTerminal]
  );
  return rows[0];
};

const createStatusHistory = async (client, { requestId, fromStatusId, toStatusId, changedBy, note }) => {
  const { rows } = await client.query(
    `
    insert into request_status_history (request_id, from_status_id, to_status_id, changed_by, note)
    values ($1, $2, $3, $4, $5)
    returning *
    `,
    [requestId, fromStatusId ?? null, toStatusId, changedBy, note ?? null]
  );
  return rows[0];
};

const createComment = async (client, { requestId, authorId, comment }) => {
  const { rows } = await client.query(
    `
    insert into request_comments (request_id, author_id, comment)
    values ($1, $2, $3)
    returning *
    `,
    [requestId, authorId, comment]
  );
  return rows[0];
};

const createAttachment = async (
  client,
  { requestId, uploadedBy, fileName, fileUrl, mimeType, sizeBytes }
) => {
  const { rows } = await client.query(
    `
    insert into request_attachments (request_id, uploaded_by, file_name, file_url, mime_type, size_bytes)
    values ($1, $2, $3, $4, $5, $6)
    returning *
    `,
    [requestId, uploadedBy, fileName, fileUrl, mimeType ?? null, sizeBytes ?? null]
  );
  return rows[0];
};

const createBoardEvent = async (client, { eventType, requestId, actorId, payload }) => {
  const { rows } = await client.query(
    `
    insert into board_events (event_type, request_id, actor_id, payload)
    values ($1, $2, $3, $4)
    returning *
    `,
    [eventType, requestId ?? null, actorId ?? null, payload ?? null]
  );
  return rows[0];
};

module.exports = {
  getRequestById,
  getStatusById,
  closeActiveAssignment,
  createAssignment,
  setFirstAssignedAtIfNull,
  updateRequestStatus,
  createStatusHistory,
  createComment,
  createAttachment,
  createBoardEvent,
};
