const requestPriorityRepository = require('../models/requestPriorityRepository');
const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset, limit: pageSize };
};

const getAllRequestPriorities = async (query) => {
  const { page, pageSize, offset, limit } = parsePagination(query);

  const [items, total] = await Promise.all([
    requestPriorityRepository.findAll({ limit, offset }),
    requestPriorityRepository.countAll()
  ]);

  return {
    items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  };
};

const getRequestPriorityById = async (id) => {
  const row = await requestPriorityRepository.findById(id);
  if (!row) throw new AppError('Request priority not found', HttpStatus.NOT_FOUND);
  return row;
};

const createRequestPriority = async ({ code, name, sortOrder, isActive, userId }) => {
  return requestPriorityRepository.create({
    code,
    name,
    sortOrder,
    isActive,
    userId
  });
};

const updateRequestPriority = async ({ id, code, name, sortOrder, isActive }) => {
  const exists = await requestPriorityRepository.findInternalById(id);
  if (!exists) throw new AppError('Request priority not found', HttpStatus.NOT_FOUND);

  return requestPriorityRepository.update({
    id,
    code,
    name,
    sortOrder,
    isActive
  });
};

const deleteRequestPriority = async (id) => {
  const removed = await requestPriorityRepository.softRemove(id);
  if (!removed) throw new AppError('Request priority not found', HttpStatus.NOT_FOUND);
  return true;
};

module.exports = {
  getAllRequestPriorities,
  getRequestPriorityById,
  createRequestPriority,
  updateRequestPriority,
  deleteRequestPriority
};
