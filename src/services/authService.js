const userRepository = require('../models/userRepository');
const { verifyPassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');
const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');
const { email } = require('zod');

const login = async ({ username, password }) => {
  const user = await userRepository.findByUsernameWithPasswordHash(username);

  if (!user || user.is_active !== true) {
    throw new AppError('Invalid credentials', HttpStatus.UNAUTHORIZED);
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new AppError('Invalid credentials', HttpStatus.UNAUTHORIZED);
  }

  if (!user.role_code) {
    throw new AppError('User has no role assigned', HttpStatus.CONFLICT);
  }
  const accessToken = signAccessToken({
    sub: user.id,
    username: user.username,
    roleCode: user.role_code
  });

  return {
    accessToken,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      roleCode: user.role_code
    }
  };
};

module.exports = { login };
