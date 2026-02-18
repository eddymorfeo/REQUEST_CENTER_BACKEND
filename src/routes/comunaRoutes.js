const express = require('express');
const comunaController = require('../controllers/comunaController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const {
  schemaListComunas,
  schemaGetComuna,
  schemaCreateComuna,
  schemaUpdateComuna,
  schemaDeleteComuna
} = require('../schemas/comunaSchemas');

const router = express.Router();

// GET /api/comunas?page=1&pageSize=20
router.get('/', validate(schemaListComunas), asyncHandler(comunaController.listComunas));

// GET /api/comunas/:id
router.get('/:id', validate(schemaGetComuna), asyncHandler(comunaController.getComuna));

// POST /api/comunas
router.post('/', validate(schemaCreateComuna), asyncHandler(comunaController.createComuna));

// PUT /api/comunas/:id
router.put('/:id', validate(schemaUpdateComuna), asyncHandler(comunaController.updateComuna));

// DELETE /api/comunas/:id
router.delete('/:id', validate(schemaDeleteComuna), asyncHandler(comunaController.deleteComuna));

module.exports = { comunaRouter: router };
