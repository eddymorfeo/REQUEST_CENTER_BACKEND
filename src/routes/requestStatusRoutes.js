const express = require('express');
const requestStatusController = require('../controllers/requestStatusController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const {
  schemaListRequestStatus,
  schemaGetRequestStatus,
  schemaCreateRequestStatus,
  schemaUpdateRequestStatus,
  schemaDeleteRequestStatus
} = require('../schemas/requestStatusSchemas');

const router = express.Router();

router.get('/', validate(schemaListRequestStatus), asyncHandler(requestStatusController.listRequestStatus));
router.get('/:id', validate(schemaGetRequestStatus), asyncHandler(requestStatusController.getRequestStatus));
router.post('/', validate(schemaCreateRequestStatus), asyncHandler(requestStatusController.createRequestStatus));
router.put('/:id', validate(schemaUpdateRequestStatus), asyncHandler(requestStatusController.updateRequestStatus));
router.delete('/:id', validate(schemaDeleteRequestStatus), asyncHandler(requestStatusController.deleteRequestStatus));

module.exports = { requestStatusRouter: router };
