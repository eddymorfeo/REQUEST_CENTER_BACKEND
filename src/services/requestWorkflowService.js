const { pool } = require("../configs/db");
const { AppError } = require("../utils/appError");
const { HttpStatus } = require("../utils/httpStatus");

const repo = require("../models/requestWorkflowRepository");

const assignRequest = async ({ requestId, assignedTo, note, actor }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const request = await repo.getRequestById(client, requestId);
    if (!request) {
      throw new AppError("Request not found", HttpStatus.NOT_FOUND);
    }

    // Cierra asignación activa anterior (si existe)
    await repo.closeActiveAssignment(client, requestId);

    // Crea asignación nueva
    const assignment = await repo.createAssignment(client, {
      requestId,
      assignedTo,
      assignedBy: actor.id,
      note,
    });

    // Marca first_assigned_at si corresponde
    await repo.setFirstAssignedAtIfNull(client, requestId);

    // Evento tablero
    await repo.createBoardEvent(client, {
      eventType: "ASSIGNED",
      requestId,
      actorId: actor.id,
      payload: { assigned_to: assignedTo },
    });

    await client.query("COMMIT");
    return assignment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const changeStatus = async ({ requestId, toStatusId, note, actor }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const request = await repo.getRequestById(client, requestId);
    if (!request) {
      throw new AppError("Request not found", HttpStatus.NOT_FOUND);
    }

    const status = await repo.getStatusById(client, toStatusId);
    if (!status) {
      throw new AppError("Status not found", HttpStatus.BAD_REQUEST);
    }

    await repo.createStatusHistory(client, {
      requestId,
      fromStatusId: request.status_id,
      toStatusId,
      changedBy: actor.id,
      note,
    });

    const updated = await repo.updateRequestStatus(client, {
      requestId,
      toStatusId,
      isTerminal: status.is_terminal,
    });

    await repo.createBoardEvent(client, {
      eventType: "STATUS_CHANGED",
      requestId,
      actorId: actor.id,
      payload: { from_status_id: request.status_id, to_status_id: toStatusId },
    });

    await client.query("COMMIT");
    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const addComment = async ({ requestId, comment, actor }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const request = await repo.getRequestById(client, requestId);
    if (!request) {
      throw new AppError("Request not found", HttpStatus.NOT_FOUND);
    }

    const created = await repo.createComment(client, {
      requestId,
      authorId: actor.id,
      comment,
    });

    await repo.createBoardEvent(client, {
      eventType: "COMMENT_ADDED",
      requestId,
      actorId: actor.id,
      payload: { comment_id: created.id },
    });

    await client.query("COMMIT");
    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const addAttachment = async (
  { requestId, fileName, fileUrl, mimeType, sizeBytes, actor }
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const request = await repo.getRequestById(client, requestId);
    if (!request) {
      throw new AppError("Request not found", HttpStatus.NOT_FOUND);
    }

    const created = await repo.createAttachment(client, {
      requestId,
      uploadedBy: actor.id,
      fileName,
      fileUrl,
      mimeType,
      sizeBytes,
    });

    await repo.createBoardEvent(client, {
      eventType: "ATTACHMENT_ADDED",
      requestId,
      actorId: actor.id,
      payload: { attachment_id: created.id },
    });

    await client.query("COMMIT");
    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  assignRequest,
  changeStatus,
  addComment,
  addAttachment,
};
