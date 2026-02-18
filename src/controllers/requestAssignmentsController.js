const { HttpStatus } = require('../utils/httpStatus');
const requestAssignmentsService = require('../services/requestAssignmentsService');

async function listRequestAssignments(req, res) {
  const { requestId } = req.validated.query;
  const data = await requestAssignmentsService.listRequestAssignments(requestId);

  return res.status(HttpStatus.OK).json({ success: true, data });
}

async function getRequestAssignment(req, res) {
  const { id } = req.validated.params;
  const data = await requestAssignmentsService.getRequestAssignment(id);

  return res.status(HttpStatus.OK).json({ success: true, data });
}

async function deleteRequestAssignment(req, res) {
  const { id } = req.validated.params;
  const data = await requestAssignmentsService.deleteRequestAssignment(id);

  return res.status(HttpStatus.OK).json({ success: true, message: 'Assignment deleted', data });
}

module.exports = {
  listRequestAssignments,
  getRequestAssignment,
  deleteRequestAssignment
};
