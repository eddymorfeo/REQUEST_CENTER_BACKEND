const requestRepository = require('../models/requestRepository');
const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset, limit: pageSize };
};

const getAllRequests = async (query) => {
  const { page, pageSize, offset, limit } = parsePagination(query);

  const filters = {
    includeInactive: String(query.includeInactive || 'false').toLowerCase() === 'true',
    statusId: query.statusId || null,
    requestTypeId: query.requestTypeId || null,
    priorityId: query.priorityId || null,
    q: query.q || null
  };

  const [items, total] = await Promise.all([
    requestRepository.findAll({ limit, offset, filters }),
    requestRepository.countAll({ filters })
  ]);

  return {
    items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  };
};

const getRequestById = async (id) => {
  const row = await requestRepository.findById(id);
  if (!row) throw new AppError('Request not found', HttpStatus.NOT_FOUND);
  return row;
};

const createRequest = async ({ title, description, statusId, requestTypeId, priorityId, createdBy }) => {
  const created = await requestRepository.create({
    title,
    description: description ?? null,
    statusId: statusId ?? null,
    requestTypeId,
    priorityId,
    createdBy
  });

  return getRequestById(created.id);
};

const updateRequest = async ({ id, title, description, statusId, requestTypeId, priorityId, isActive }) => {
  const exists = await requestRepository.findInternalById(id);
  if (!exists) throw new AppError('Request not found', HttpStatus.NOT_FOUND);

  await requestRepository.update({
    id,
    title,
    description,
    statusId,
    requestTypeId,
    priorityId,
    isActive
  });

  return getRequestById(id);
};

const deleteRequest = async (id) => {
  const removed = await requestRepository.softRemove(id);
  if (!removed) throw new AppError('Request not found', HttpStatus.NOT_FOUND);
  return true;
};

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest
};
