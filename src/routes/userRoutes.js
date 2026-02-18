const express = require('express');
const userController = require('../controllers/userController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const {
  schemaListUsers,
  schemaGetUser,
  schemaCreateUser,
  schemaUpdateUser,
  schemaDeleteUser
} = require('../schemas/userSchemas');

const router = express.Router();

// NUEVOS ENDPOINTS (van antes de /:id para que no colisionen)
router.get('/analysts', validate(schemaListUsers), asyncHandler(userController.listAnalystUsers));
router.get('/fiscals', validate(schemaListUsers), asyncHandler(userController.listFiscalUsers));

// GET /api/users?page=1&pageSize=20
router.get('/', validate(schemaListUsers), asyncHandler(userController.listUsers));

// GET /api/users/:id
router.get('/:id', validate(schemaGetUser), asyncHandler(userController.getUser));

// POST /api/users
router.post('/', validate(schemaCreateUser), asyncHandler(userController.createUser));

// PUT /api/users/:id
router.put('/:id', validate(schemaUpdateUser), asyncHandler(userController.updateUser));

// DELETE /api/users/:id
router.delete('/:id', validate(schemaDeleteUser), asyncHandler(userController.deleteUser));

module.exports = { userRouter: router };
