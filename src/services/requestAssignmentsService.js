const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');
const requestAssignmentsRepository = require('../models/requestAssignmentsRepository');

async function listRequestAssignments(requestId) {
  return requestAssignmentsRepository.listByRequestId(requestId);
}

async function getRequestAssignment(id) {
  const row = await requestAssignmentsRepository.getById(id);
  if (!row) throw new AppError('Assignment not found', HttpStatus.NOT_FOUND);
  return row;
}

async function deleteRequestAssignment(id) {
  const row = await requestAssignmentsRepository.softDelete(id);
  if (!row) throw new AppError('Assignment not found', HttpStatus.NOT_FOUND);
  return row;
}

module.exports = {
  listRequestAssignments,
  getRequestAssignment,
  deleteRequestAssignment
};
