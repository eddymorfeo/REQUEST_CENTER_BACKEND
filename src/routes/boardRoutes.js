const express = require('express');
const boardController = require('../controllers/boardController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');

const {
  schemaBoardList,
  schemaBoardAssign,
  schemaBoardChangeStatus,
  schemaBoardChanges,
  schemaBoardMetrics
} = require('../schemas/boardSchemas');

const router = express.Router();

// ✅ Protege TODO el tablero con JWT
router.use(requireAuth);

// GET /api/board
router.get('/', validate(schemaBoardList), asyncHandler(boardController.listBoard));

// POST /api/board/:requestId/assign (solo ADMIN, validado en service)
router.post('/:requestId/assign', validate(schemaBoardAssign), asyncHandler(boardController.assignRequest));

// POST /api/board/:requestId/status (ADMIN o asignado, validado en service)
router.post('/:requestId/status', validate(schemaBoardChangeStatus), asyncHandler(boardController.changeStatus));

// GET /api/board/changes?sinceId=123
router.get('/changes', validate(schemaBoardChanges), asyncHandler(boardController.getChanges));

// GET /api/board/metrics?days=30 (recomendado: solo ADMIN, validado en service)
router.get('/metrics', validate(schemaBoardMetrics), asyncHandler(boardController.getMetrics));

module.exports = { boardRouter: router };
