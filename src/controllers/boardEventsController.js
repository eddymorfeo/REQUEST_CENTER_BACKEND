const { HttpStatus } = require('../utils/httpStatus');
const boardEventsService = require('../services/boardEventsService');

async function listBoardEvents(req, res) {
  const { page, pageSize, requestId } = req.validated.query;
  const data = await boardEventsService.listBoardEvents({ page, pageSize, requestId });

  return res.status(HttpStatus.OK).json({ success: true, data });
}

module.exports = { listBoardEvents };
