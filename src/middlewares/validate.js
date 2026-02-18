const { HttpStatus } = require('../utils/httpStatus');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!result.success) {
    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Validation error',
      errors: result.error.flatten()
    });
  }

  req.validated = result.data;
  next();
};

module.exports = { validate };
