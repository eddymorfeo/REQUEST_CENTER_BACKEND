const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');

const mapPgError = (error) => {
  // 23505 = unique_violation
  // 22P02 = invalid_text_representation (ej: UUID inválido)
  if (error?.code === '23505') {
    return new AppError('Conflict: duplicated value', HttpStatus.CONFLICT, {
      constraint: error.constraint,
      detail: error.detail
    });
  }

  if (error?.code === '22P02') {
    return new AppError('Invalid input format', HttpStatus.BAD_REQUEST, {
      detail: error.message
    });
  }

  return null;
};

const errorHandler = (error, req, res, next) => {
  const mapped = mapPgError(error);
  const finalError = mapped || error;

  const statusCode =
    finalError instanceof AppError
      ? finalError.statusCode
      : HttpStatus.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message: finalError.message || 'Unexpected error',
    details: finalError.details || null
  });
};

module.exports = { errorHandler };
