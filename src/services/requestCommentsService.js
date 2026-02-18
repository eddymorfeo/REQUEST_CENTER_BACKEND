const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');
const requestCommentsRepository = require('../models/requestCommentsRepository');

function resolveActorId(req) {
  return req?.auth?.id || req?.auth?.userId || req?.auth?.sub || null;
}

async function listRequestComments(requestId) {
  return requestCommentsRepository.listByRequestId(requestId);
}

async function createRequestComment(req, { request_id, comment }) {
  const authorId = resolveActorId(req);
  if (!authorId) {
    throw new AppError('Unauthorized: missing actor', HttpStatus.UNAUTHORIZED);
  }

  return requestCommentsRepository.create({
    requestId: request_id,
    authorId,
    comment
  });
}

async function updateRequestComment(id, patch) {
  const updated = await requestCommentsRepository.update(id, patch);
  if (!updated) throw new AppError('Comment not found', HttpStatus.NOT_FOUND);
  return updated;
}

async function deleteRequestComment(id) {
  const deleted = await requestCommentsRepository.softDelete(id);
  if (!deleted) throw new AppError('Comment not found', HttpStatus.NOT_FOUND);
  return deleted;
}

module.exports = {
  listRequestComments,
  createRequestComment,
  updateRequestComment,
  deleteRequestComment
};
