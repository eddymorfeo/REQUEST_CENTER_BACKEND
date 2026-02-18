const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');
const requestStatusHistoryRepository = require('../models/requestStatusHistoryRepository');

function resolveActorId(req) {
  return req?.auth?.id || req?.auth?.userId || req?.auth?.sub || null;
}

async function listRequestStatusHistory(requestId) {
  return requestStatusHistoryRepository.listByRequestId(requestId);
}

async function createRequestStatusHistory(req, body) {
  const changedBy = resolveActorId(req);
  if (!changedBy) throw new AppError('Unauthorized: missing actor', HttpStatus.UNAUTHORIZED);

  return requestStatusHistoryRepository.create({
    requestId: body.request_id,
    fromStatusId: body.from_status_id,
    toStatusId: body.to_status_id,
    changedBy,
    note: body.note
  });
}

module.exports = {
  listRequestStatusHistory,
  createRequestStatusHistory
};
