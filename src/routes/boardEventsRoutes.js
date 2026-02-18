const express = require('express');
const boardEventsController = require('../controllers/boardEventsController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const { schemaListBoardEvents } = require('../schemas/boardEventsSchemas');

const router = express.Router();

// GET /api/board-events?page=1&pageSize=50&requestId=...
router.get('/', validate(schemaListBoardEvents), asyncHandler(boardEventsController.listBoardEvents));

module.exports = { boardEventsRouter: router };
