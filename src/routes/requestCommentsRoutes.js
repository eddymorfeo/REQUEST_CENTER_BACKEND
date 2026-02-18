const express = require('express');
const requestCommentsController = require('../controllers/requestCommentsController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');

const {
  schemaListRequestComments,
  schemaCreateRequestComment,
  schemaUpdateRequestComment,
  schemaDeleteRequestComment
} = require('../schemas/requestCommentsSchemas');

const router = express.Router();

// GET /api/request-comments?requestId=...
router.get('/', validate(schemaListRequestComments), asyncHandler(requestCommentsController.listRequestComments));

// POST /api/request-comments
router.post('/', validate(schemaCreateRequestComment), asyncHandler(requestCommentsController.createRequestComment));

// PUT /api/request-comments/:id
router.put('/:id', validate(schemaUpdateRequestComment), asyncHandler(requestCommentsController.updateRequestComment));

// DELETE /api/request-comments/:id
router.delete('/:id', validate(schemaDeleteRequestComment), asyncHandler(requestCommentsController.deleteRequestComment));

module.exports = { requestCommentsRouter: router };
