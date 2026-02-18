const express = require('express');
const requestAssignmentsController = require('../controllers/requestAssignmentsController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');

const {
  schemaListRequestAssignments,
  schemaGetRequestAssignment,
  schemaSoftDeleteRequestAssignment
} = require('../schemas/requestAssignmentsSchemas');

const router = express.Router();

// GET /api/request-assignments?requestId=...
router.get('/', validate(schemaListRequestAssignments), asyncHandler(requestAssignmentsController.listRequestAssignments));

// GET /api/request-assignments/:id
router.get('/:id', validate(schemaGetRequestAssignment), asyncHandler(requestAssignmentsController.getRequestAssignment));

// DELETE /api/request-assignments/:id
router.delete('/:id', validate(schemaSoftDeleteRequestAssignment), asyncHandler(requestAssignmentsController.deleteRequestAssignment));

module.exports = { requestAssignmentsRouter: router };
