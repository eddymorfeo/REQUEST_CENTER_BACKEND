const jwt = require('jsonwebtoken');
const { AppError } = require('./appError');
const { HttpStatus } = require('./httpStatus');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '2h';

function ensureSecret() {
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in .env');
  }
}

const signAccessToken = (payload) => {
  ensureSecret();

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

const verifyAccessToken = (token) => {
  ensureSecret();

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, {
      code: error?.name,
      message: error?.message
    });
  }
};

module.exports = { signAccessToken, verifyAccessToken };
