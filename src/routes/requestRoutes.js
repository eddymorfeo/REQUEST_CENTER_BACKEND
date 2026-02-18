const express = require('express');
const requestController = require('../controllers/requestController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const {
  schemaListRequests,
  schemaGetRequest,
  schemaCreateRequest,
  schemaUpdateRequest,
  schemaDeleteRequest
} = require('../schemas/requestSchemas');

const router = express.Router();

router.get('/', validate(schemaListRequests), asyncHandler(requestController.listRequests));
router.get('/:id', validate(schemaGetRequest), asyncHandler(requestController.getRequest));
router.post('/', validate(schemaCreateRequest), asyncHandler(requestController.createRequest));
router.put('/:id', validate(schemaUpdateRequest), asyncHandler(requestController.updateRequest));
router.delete('/:id', validate(schemaDeleteRequest), asyncHandler(requestController.deleteRequest));

module.exports = { requestRouter: router };
