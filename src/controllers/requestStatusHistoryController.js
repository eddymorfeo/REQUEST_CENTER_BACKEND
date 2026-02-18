const { HttpStatus } = require('../utils/httpStatus');
const requestStatusHistoryService = require('../services/requestStatusHistoryService');

async function listRequestStatusHistory(req, res) {
  const { requestId } = req.validated.query;
  const data = await requestStatusHistoryService.listRequestStatusHistory(requestId);

  return res.status(HttpStatus.OK).json({ success: true, data });
}

async function createRequestStatusHistory(req, res) {
  const data = await requestStatusHistoryService.createRequestStatusHistory(req, req.validated.body);

  return res.status(HttpStatus.CREATED).json({
    success: true,
    message: 'Status history created',
    data
  });
}

module.exports = {
  listRequestStatusHistory,
  createRequestStatusHistory
};
