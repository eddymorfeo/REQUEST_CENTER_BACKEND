const express = require('express');
const requestStatusHistoryController = require('../controllers/requestStatusHistoryController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');

const {
  schemaListRequestStatusHistory,
  schemaCreateRequestStatusHistory
} = require('../schemas/requestStatusHistorySchemas');

const router = express.Router();

// GET /api/request-status-history?requestId=...
router.get('/', validate(schemaListRequestStatusHistory), asyncHandler(requestStatusHistoryController.listRequestStatusHistory));

// POST /api/request-status-history
router.post('/', validate(schemaCreateRequestStatusHistory), asyncHandler(requestStatusHistoryController.createRequestStatusHistory));

module.exports = { requestStatusHistoryRouter: router };
