const { HttpStatus } = require('../utils/httpStatus');
const boardService = require('../services/boardService');

async function listBoard(req, res) {
  const { page, pageSize, statusCode, priorityCode, typeCode } = req.validated.query;
  const result = await boardService.listBoard({ page, pageSize, statusCode, priorityCode, typeCode });

  return res.status(HttpStatus.OK).json({
    success: true,
    data: result
  });
}

async function assignRequest(req, res) {
  const { requestId } = req.validated.params;
  const { assigned_to, note } = req.validated.body;

  const result = await boardService.assignRequest(req, { requestId, assigned_to, note });

  return res.status(HttpStatus.OK).json({
    success: true,
    message: 'Request assigned',
    data: result
  });
}

async function changeStatus(req, res) {
  const { requestId } = req.validated.params;
  const { to_status_code, to_status_id, note } = req.validated.body;

  const result = await boardService.changeStatus(req, { requestId, to_status_code, to_status_id, note });

  return res.status(HttpStatus.OK).json({
    success: true,
    message: 'Status updated',
    data: result
  });
}

async function getChanges(req, res) {
  const { sinceId, requestId } = req.validated.query;
  const result = await boardService.getChanges({ sinceId, requestId });

  return res.status(HttpStatus.OK).json({
    success: true,
    data: result
  });
}

async function getMetrics(req, res) {
  const { days } = req.validated.query;
  const result = await boardService.getMetrics(req, { days });

  return res.status(HttpStatus.OK).json({
    success: true,
    data: result
  });
}


module.exports = {
  listBoard,
  assignRequest,
  changeStatus,
  getChanges,
  getMetrics
};
