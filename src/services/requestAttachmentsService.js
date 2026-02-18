const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');
const requestAttachmentsRepository = require('../models/requestAttachmentsRepository');

function resolveActorId(req) {
  return req?.auth?.id || req?.auth?.userId || req?.auth?.sub || null;
}

async function listRequestAttachments(requestId) {
  return requestAttachmentsRepository.listByRequestId(requestId);
}

async function createRequestAttachment(req, body) {
  const uploadedBy = resolveActorId(req);
  if (!uploadedBy) throw new AppError('Unauthorized: missing actor', HttpStatus.UNAUTHORIZED);

  return requestAttachmentsRepository.create({
    requestId: body.request_id,
    uploadedBy,
    fileName: body.file_name,
    fileUrl: body.file_url,
    mimeType: body.mime_type,
    sizeBytes: body.size_bytes
  });
}

async function updateRequestAttachment(id, patch) {
  const updated = await requestAttachmentsRepository.update(id, patch);
  if (!updated) throw new AppError('Attachment not found', HttpStatus.NOT_FOUND);
  return updated;
}

async function deleteRequestAttachment(id) {
  const deleted = await requestAttachmentsRepository.softDelete(id);
  if (!deleted) throw new AppError('Attachment not found', HttpStatus.NOT_FOUND);
  return deleted;
}

module.exports = {
  listRequestAttachments,
  createRequestAttachment,
  updateRequestAttachment,
  deleteRequestAttachment
};
