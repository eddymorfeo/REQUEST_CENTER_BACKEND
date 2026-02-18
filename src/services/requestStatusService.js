const requestStatusRepository = require('../models/requestStatusRepository');
const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset, limit: pageSize };
};

const getAllRequestStatus = async (query) => {
  const { page, pageSize, offset, limit } = parsePagination(query);

  const [items, total] = await Promise.all([
    requestStatusRepository.findAll({ limit, offset }),
    requestStatusRepository.countAll()
  ]);

  return {
    items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  };
};

const getRequestStatusById = async (id) => {
  const row = await requestStatusRepository.findById(id);
  if (!row) throw new AppError('Request status not found', HttpStatus.NOT_FOUND);
  return row;
};

const createRequestStatus = async ({ code, name, sortOrder, isTerminal, isActive, userId }) => {
  return requestStatusRepository.create({
    code,
    name,
    sortOrder,
    isTerminal,
    isActive,
    userId
  });
};

const updateRequestStatus = async ({ id, code, name, sortOrder, isTerminal, isActive }) => {
  const exists = await requestStatusRepository.findInternalById(id);
  if (!exists) throw new AppError('Request status not found', HttpStatus.NOT_FOUND);

  return requestStatusRepository.update({
    id,
    code,
    name,
    sortOrder,
    isTerminal,
    isActive
  });
};

const deleteRequestStatus = async (id) => {
  const removed = await requestStatusRepository.softRemove(id);
  if (!removed) throw new AppError('Request status not found', HttpStatus.NOT_FOUND);
  return true;
};

module.exports = {
  getAllRequestStatus,
  getRequestStatusById,
  createRequestStatus,
  updateRequestStatus,
  deleteRequestStatus
};
