const express = require('express');
const requestAttachmentsController = require('../controllers/requestAttachmentsController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');

const {
  schemaListRequestAttachments,
  schemaCreateRequestAttachment,
  schemaUpdateRequestAttachment,
  schemaDeleteRequestAttachment
} = require('../schemas/requestAttachmentsSchemas');

const router = express.Router();

// GET /api/request-attachments?requestId=...
router.get('/', validate(schemaListRequestAttachments), asyncHandler(requestAttachmentsController.listRequestAttachments));

// POST /api/request-attachments
router.post('/', validate(schemaCreateRequestAttachment), asyncHandler(requestAttachmentsController.createRequestAttachment));

// PUT /api/request-attachments/:id
router.put('/:id', validate(schemaUpdateRequestAttachment), asyncHandler(requestAttachmentsController.updateRequestAttachment));

// DELETE /api/request-attachments/:id
router.delete('/:id', validate(schemaDeleteRequestAttachment), asyncHandler(requestAttachmentsController.deleteRequestAttachment));

module.exports = { requestAttachmentsRouter: router };
