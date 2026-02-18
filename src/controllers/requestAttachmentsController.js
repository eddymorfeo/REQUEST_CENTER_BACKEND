const { HttpStatus } = require('../utils/httpStatus');
const requestAttachmentsService = require('../services/requestAttachmentsService');

async function listRequestAttachments(req, res) {
  const { requestId } = req.validated.query;
  const data = await requestAttachmentsService.listRequestAttachments(requestId);

  return res.status(HttpStatus.OK).json({ success: true, data });
}

async function createRequestAttachment(req, res) {
  const data = await requestAttachmentsService.createRequestAttachment(req, req.validated.body);

  return res.status(HttpStatus.CREATED).json({
    success: true,
    message: 'Attachment created',
    data
  });
}

async function updateRequestAttachment(req, res) {
  const { id } = req.validated.params;
  const data = await requestAttachmentsService.updateRequestAttachment(id, req.validated.body);

  return res.status(HttpStatus.OK).json({ success: true, message: 'Attachment updated', data });
}

async function deleteRequestAttachment(req, res) {
  const { id } = req.validated.params;
  const data = await requestAttachmentsService.deleteRequestAttachment(id);

  return res.status(HttpStatus.OK).json({ success: true, message: 'Attachment deleted', data });
}

module.exports = {
  listRequestAttachments,
  createRequestAttachment,
  updateRequestAttachment,
  deleteRequestAttachment
};
