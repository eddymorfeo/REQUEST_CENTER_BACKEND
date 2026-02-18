const authService = require('../services/authService');
const { HttpStatus } = require('../utils/httpStatus');

const login = async (req, res) => {
  const { username, password } = req.validated.body;
  const result = await authService.login({ username, password });

  res.status(HttpStatus.OK).json({
    success: true,
    data: result
  });
};

module.exports = { login };
