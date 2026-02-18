const userRoleRepository = require('../models/userRoleRepository');
const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset, limit: pageSize };
};

const getAllUserRoles = async (query) => {
  const { page, pageSize, offset, limit } = parsePagination(query);

  const [items, total] = await Promise.all([
    userRoleRepository.findAll({ limit, offset }),
    userRoleRepository.countAll()
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

const getUserRoleById = async (id) => {
  const record = await userRoleRepository.findById(id);
  if (!record) throw new AppError('User role not found', HttpStatus.NOT_FOUND);
  return record;
};

const createUserRole = async ({ userId, roleId }) => {
  return userRoleRepository.create({ userId, roleId });
};

const updateUserRole = async ({ id, userId, roleId }) => {
  const exists = await userRoleRepository.findInternalById(id);
  if (!exists) throw new AppError('User role not found', HttpStatus.NOT_FOUND);

  const updated = await userRoleRepository.update({ id, userId, roleId });
  return updated;
};

const deleteUserRole = async (id) => {
  const removed = await userRoleRepository.remove(id);
  if (!removed) throw new AppError('User role not found', HttpStatus.NOT_FOUND);
  return true;
};

module.exports = {
  getAllUserRoles,
  getUserRoleById,
  createUserRole,
  updateUserRole,
  deleteUserRole
};
