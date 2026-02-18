const express = require('express');
const userRoleController = require('../controllers/userRoleController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const {
  schemaListUserRoles,
  schemaGetUserRole,
  schemaCreateUserRole,
  schemaUpdateUserRole,
  schemaDeleteUserRole
} = require('../schemas/userRoleSchemas');

const router = express.Router();

router.get('/', validate(schemaListUserRoles), asyncHandler(userRoleController.listUserRoles));
router.get('/:id', validate(schemaGetUserRole), asyncHandler(userRoleController.getUserRole));
router.post('/', validate(schemaCreateUserRole), asyncHandler(userRoleController.createUserRole));
router.put('/:id', validate(schemaUpdateUserRole), asyncHandler(userRoleController.updateUserRole));
router.delete('/:id', validate(schemaDeleteUserRole), asyncHandler(userRoleController.deleteUserRole));

module.exports = { userRoleRouter: router };
