const express = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const authController = require('../controllers/authController');
const { schemaLogin } = require('../schemas/authSchemas');

const router = express.Router();

router.post('/login', validate(schemaLogin), asyncHandler(authController.login));

module.exports = { authRouter: router };
