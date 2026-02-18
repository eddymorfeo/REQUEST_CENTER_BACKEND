const requestTypeRepository = require('../models/requestTypeRepository');
const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset, limit: pageSize };
};

const getAllRequestTypes = async (query) => {
  const { page, pageSize, offset, limit } = parsePagination(query);

  const [items, total] = await Promise.all([
    requestTypeRepository.findAll({ limit, offset }),
    requestTypeRepository.countAll()
  ]);

  return {
    items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  };
};

const getRequestTypeById = async (id) => {
  const row = await requestTypeRepository.findById(id);
  if (!row) throw new AppError('Request type not found', HttpStatus.NOT_FOUND);
  return row;
};

const createRequestType = async ({ code, name, description, isActive, userId }) => {
  return requestTypeRepository.create({
    code,
    name,
    description: description ?? null,
    isActive,
    userId
  });
};

const updateRequestType = async ({ id, code, name, description, isActive }) => {
  const exists = await requestTypeRepository.findInternalById(id);
  if (!exists) throw new AppError('Request type not found', HttpStatus.NOT_FOUND);

  return requestTypeRepository.update({
    id,
    code,
    name,
    description: description ?? null,
    isActive
  });
};

const deleteRequestType = async (id) => {
  const removed = await requestTypeRepository.softRemove(id);
  if (!removed) throw new AppError('Request type not found', HttpStatus.NOT_FOUND);
  return true;
};

module.exports = {
  getAllRequestTypes,
  getRequestTypeById,
  createRequestType,
  updateRequestType,
  deleteRequestType
};
