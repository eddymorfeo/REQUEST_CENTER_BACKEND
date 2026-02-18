const { pool } = require('../configs/db');
const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');
const boardRepository = require('../models/boardRepository');

function resolveActorId(req) {
  // ✅ Tu JWT usa: { sub: user.id, username: ... }
  return req?.auth?.sub || req?.auth?.id || req?.auth?.userId || null;
}

async function ensureAdmin(actorId) {
  const isAdmin = await boardRepository.isUserAdmin(actorId);
  if (!isAdmin) {
    throw new AppError('Forbidden: admin role required', HttpStatus.FORBIDDEN);
  }
}

async function listBoard(params) {
  return boardRepository.listBoard(params);
}

async function assignRequest(req, { requestId, assigned_to, note }) {
  const actorId = resolveActorId(req);
  if (!actorId) throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);

  // ✅ Regla: asignaciones/reasignaciones SOLO ADMIN
  await ensureAdmin(actorId);

  const request = await boardRepository.getRequestById(requestId);
  if (!request || request.is_active === false) {
    throw new AppError('Request not found', HttpStatus.NOT_FOUND);
  }

  const assignedStatus = await boardRepository.getStatusByCode('ASSIGNED');
  if (!assignedStatus) {
    throw new AppError('Missing request_status code ASSIGNED', HttpStatus.CONFLICT);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cierra asignación activa previa (reasignación)
    await boardRepository.closeActiveAssignments(client, requestId);

    const assignment = await boardRepository.createAssignment(client, {
      requestId,
      assignedTo: assigned_to,
      assignedBy: actorId,
      note
    });

    // Actualiza request a ASSIGNED + first_assigned_at si corresponde
    const updatedRequest = await boardRepository.updateRequestStatus(client, {
      requestId,
      statusId: assignedStatus.id,
      setFirstAssignedAt: true,
      setClosedAt: false
    });

    // Historial de estado
    await boardRepository.insertStatusHistory(client, {
      requestId,
      fromStatusId: request.status_id,
      toStatusId: assignedStatus.id,
      changedBy: actorId,
      note: note || 'Assigned'
    });

    // Evento tablero
    await boardRepository.insertBoardEvent(client, {
      eventType: 'ASSIGNED',
      requestId,
      actorId,
      payload: {
        to_status: 'ASSIGNED',
        assigned_to,
        assignment_id: assignment.id
      }
    });

    await client.query('COMMIT');
    return { assignment, request: updatedRequest };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function changeStatus(req, { requestId, to_status_code, to_status_id, note }) {
  const actorId = resolveActorId(req);
  if (!actorId) throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);

  const request = await boardRepository.getRequestById(requestId);
  if (!request || request.is_active === false) {
    throw new AppError('Request not found', HttpStatus.NOT_FOUND);
  }

  const targetStatus = to_status_id
    ? await boardRepository.getStatusById(to_status_id)
    : await boardRepository.getStatusByCode(to_status_code);

  if (!targetStatus) {
    throw new AppError('Target status not found', HttpStatus.NOT_FOUND);
  }

  const isAdmin = await boardRepository.isUserAdmin(actorId);

  // ✅ Regla: cambio de estado solo ADMIN o el asignado activo
  // - Si NO es admin: debe existir asignación activa y assigned_to debe ser actor
  const activeAssignment = await boardRepository.getActiveAssignment(pool, requestId); // pool también tiene .query
  if (!isAdmin) {
    if (!activeAssignment) {
      throw new AppError('Cannot change status: request has no active assignment', HttpStatus.CONFLICT);
    }
    if (activeAssignment.assigned_to !== actorId) {
      throw new AppError('Forbidden: only assignee can change this request', HttpStatus.FORBIDDEN);
    }
    // Recomendación: un usuario NO admin no debería poder “desasignar” volviendo a UNASSIGNED
    if (targetStatus.code === 'UNASSIGNED') {
      throw new AppError('Forbidden: only admin can set UNASSIGNED', HttpStatus.FORBIDDEN);
    }
  }

  // Si el actual es terminal, no permitimos cambiar (evita inconsistencias)
  const currentStatus = await boardRepository.getStatusById(request.status_id);
  if (currentStatus?.is_terminal) {
    throw new AppError('Cannot change status from a terminal state', HttpStatus.CONFLICT);
  }

  const setClosedAt = targetStatus.code === 'DONE';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updatedRequest = await boardRepository.updateRequestStatus(client, {
      requestId,
      statusId: targetStatus.id,
      setFirstAssignedAt: false,
      setClosedAt
    });

    await boardRepository.insertStatusHistory(client, {
      requestId,
      fromStatusId: request.status_id,
      toStatusId: targetStatus.id,
      changedBy: actorId,
      note: note || `Status changed to ${targetStatus.code}`
    });

    await boardRepository.insertBoardEvent(client, {
      eventType: 'STATUS_CHANGED',
      requestId,
      actorId,
      payload: {
        from_status_id: request.status_id,
        to_status_id: targetStatus.id,
        to_status_code: targetStatus.code
      }
    });

    await client.query('COMMIT');
    return { request: updatedRequest };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getChanges(params) {
  return boardRepository.getChanges(params);
}

async function getMetrics(req, params) {
  const actorId = resolveActorId(req);
  if (!actorId) throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);

  // ✅ Recomendado: métricas solo ADMIN
  await ensureAdmin(actorId);

  return boardRepository.getMetrics(params);
}

module.exports = {
  listBoard,
  assignRequest,
  changeStatus,
  getChanges,
  getMetrics
};
