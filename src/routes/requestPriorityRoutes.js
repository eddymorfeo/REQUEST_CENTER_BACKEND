const express = require('express');
const requestPriorityController = require('../controllers/requestPriorityController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const {
  schemaListRequestPriorities,
  schemaGetRequestPriority,
  schemaCreateRequestPriority,
  schemaUpdateRequestPriority,
  schemaDeleteRequestPriority
} = require('../schemas/requestPrioritySchemas');

const router = express.Router();

router.get('/', validate(schemaListRequestPriorities), asyncHandler(requestPriorityController.listRequestPriorities));
router.get('/:id', validate(schemaGetRequestPriority), asyncHandler(requestPriorityController.getRequestPriority));
router.post('/', validate(schemaCreateRequestPriority), asyncHandler(requestPriorityController.createRequestPriority));
router.put('/:id', validate(schemaUpdateRequestPriority), asyncHandler(requestPriorityController.updateRequestPriority));
router.delete('/:id', validate(schemaDeleteRequestPriority), asyncHandler(requestPriorityController.deleteRequestPriority));

module.exports = { requestPriorityRouter: router };
