const roleRepository = require('../models/roleRepository');
const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset, limit: pageSize };
};

const getAllRoles = async (query) => {
  const { page, pageSize, offset, limit } = parsePagination(query);

  const [items, total] = await Promise.all([
    roleRepository.findAll({ limit, offset }),
    roleRepository.countAll()
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

const getRoleById = async (id) => {
  const role = await roleRepository.findById(id);
  if (!role) throw new AppError('Role not found', HttpStatus.NOT_FOUND);
  return role;
};

const createRole = async ({ code, name, isActive }) => {
  return roleRepository.create({ code, name, isActive });
};

const updateRole = async ({ id, code, name, isActive }) => {
  const exists = await roleRepository.findInternalById(id);
  if (!exists) throw new AppError('Role not found', HttpStatus.NOT_FOUND);

  const updated = await roleRepository.update({ id, code, name, isActive });
  return updated;
};

const deleteRole = async (id) => {
  const removed = await roleRepository.remove(id);
  if (!removed) throw new AppError('Role not found', HttpStatus.NOT_FOUND);
  return true;
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};
