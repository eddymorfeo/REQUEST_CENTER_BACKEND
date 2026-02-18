const express = require('express');
const requestTypeController = require('../controllers/requestTypeController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const {
  schemaListRequestTypes,
  schemaGetRequestType,
  schemaCreateRequestType,
  schemaUpdateRequestType,
  schemaDeleteRequestType
} = require('../schemas/requestTypeSchemas');

const router = express.Router();

router.get('/', validate(schemaListRequestTypes), asyncHandler(requestTypeController.listRequestTypes));
router.get('/:id', validate(schemaGetRequestType), asyncHandler(requestTypeController.getRequestType));
router.post('/', validate(schemaCreateRequestType), asyncHandler(requestTypeController.createRequestType));
router.put('/:id', validate(schemaUpdateRequestType), asyncHandler(requestTypeController.updateRequestType));
router.delete('/:id', validate(schemaDeleteRequestType), asyncHandler(requestTypeController.deleteRequestType));

module.exports = { requestTypeRouter: router };
