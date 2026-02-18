const { HttpStatus } = require('../utils/httpStatus');
const requestCommentsService = require('../services/requestCommentsService');

async function listRequestComments(req, res) {
  const { requestId } = req.validated.query;
  const data = await requestCommentsService.listRequestComments(requestId);

  return res.status(HttpStatus.OK).json({ success: true, data });
}

async function createRequestComment(req, res) {
  const data = await requestCommentsService.createRequestComment(req, req.validated.body);
  return res.status(HttpStatus.CREATED).json({ success: true, message: 'Comment created', data });
}

async function updateRequestComment(req, res) {
  const { id } = req.validated.params;
  const data = await requestCommentsService.updateRequestComment(id, req.validated.body);

  return res.status(HttpStatus.OK).json({ success: true, message: 'Comment updated', data });
}

async function deleteRequestComment(req, res) {
  const { id } = req.validated.params;
  const data = await requestCommentsService.deleteRequestComment(id);

  return res.status(HttpStatus.OK).json({ success: true, message: 'Comment deleted', data });
}

module.exports = {
  listRequestComments,
  createRequestComment,
  updateRequestComment,
  deleteRequestComment
};
