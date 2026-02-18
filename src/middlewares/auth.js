const { verifyAccessToken } = require('../utils/jwt');
const { HttpStatus } = require('../utils/httpStatus');

const getBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header) return null;

  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;

  return token;
};

const requireAuth = (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Missing Authorization Bearer token'
      });
    }

    const payload = verifyAccessToken(token);

    req.auth = payload;
    return next();
  } catch (error) {
    const isExpired = error?.name === 'TokenExpiredError';

    return res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: isExpired ? 'Token expired' : 'Invalid token'
    });
  }
};

module.exports = { requireAuth };
