const express = require('express');
const roleController = require('../controllers/roleController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const {
  schemaListRoles,
  schemaGetRole,
  schemaCreateRole,
  schemaUpdateRole,
  schemaDeleteRole
} = require('../schemas/roleSchemas');

const router = express.Router();

// GET /api/roles?page=1&pageSize=20
router.get('/', validate(schemaListRoles), asyncHandler(roleController.listRoles));

// GET /api/roles/:id
router.get('/:id', validate(schemaGetRole), asyncHandler(roleController.getRole));

// POST /api/roles
router.post('/', validate(schemaCreateRole), asyncHandler(roleController.createRole));

// PUT /api/roles/:id
router.put('/:id', validate(schemaUpdateRole), asyncHandler(roleController.updateRole));

// DELETE /api/roles/:id
router.delete('/:id', validate(schemaDeleteRole), asyncHandler(roleController.deleteRole));

module.exports = { roleRouter: router };
