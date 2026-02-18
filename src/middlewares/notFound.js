const { HttpStatus } = require('../utils/httpStatus');

const notFound = (req, res) => {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = { notFound };
