const userRepository = require('../models/userRepository');
const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');
const { hashPassword } = require('../utils/password');

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset, limit: pageSize };
};

const getAllUsers = async (query) => {
  const { page, pageSize, offset, limit } = parsePagination(query);
  const [items, total] = await Promise.all([
    userRepository.findAll({ limit, offset }),
    userRepository.countAll()
  ]);

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('User not found', HttpStatus.NOT_FOUND);
  return user;
};

const createUser = async ({ username, fullName, password, isActive, email, roleId }) => {
  const passwordHash = await hashPassword(password);

  return userRepository.create({
    username,
    fullName,
    passwordHash,
    isActive,
    email,
    roleId
  });
};

const updateUser = async ({ id, username, fullName, password, isActive, email, roleId }) => {
  const exists = await userRepository.findInternalById(id);
  if (!exists) throw new AppError('User not found', HttpStatus.NOT_FOUND);

  const passwordHash = password ? await hashPassword(password) : null;

  const updated = await userRepository.update({
    id,
    username,
    fullName,
    passwordHash,
    isActive,
    email,
    roleId
  });

  return updated;
};

const deleteUser = async (id) => {
  const removed = await userRepository.remove(id);
  if (!removed) throw new AppError('User not found', HttpStatus.NOT_FOUND);
  return true;
};

/**
 * NUEVO: usuarios activos por rol (por code)
 */
const getActiveUsersByRoleCode = async (roleCode, query) => {
  const { page, pageSize, offset, limit } = parsePagination(query);

  const [items, total] = await Promise.all([
    userRepository.findActiveByRoleCode({ roleCode, limit, offset }),
    userRepository.countActiveByRoleCode({ roleCode })
  ]);

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getActiveUsersByRoleCode
};
