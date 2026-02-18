const comunaRepository = require('../models/comunaRepository');
const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset, limit: pageSize };
};

const getAllComunas = async (query) => {
  const { page, pageSize, offset, limit } = parsePagination(query);

  const [items, total] = await Promise.all([
    comunaRepository.findAll({ limit, offset }),
    comunaRepository.countAll()
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

const getComunaById = async (id) => {
  const comuna = await comunaRepository.findById(id);
  if (!comuna) throw new AppError('Comuna not found', HttpStatus.NOT_FOUND);
  return comuna;
};

const createComuna = async ({ name, isActive }) => {
  return comunaRepository.create({ name, isActive });
};

const updateComuna = async ({ id, name, isActive }) => {
  const exists = await comunaRepository.findInternalById(id);
  if (!exists) throw new AppError('Comuna not found', HttpStatus.NOT_FOUND);

  const updated = await comunaRepository.update({ id, name, isActive });
  return updated;
};

const deleteComuna = async (id) => {
  const removed = await comunaRepository.remove(id);
  if (!removed) throw new AppError('Comuna not found', HttpStatus.NOT_FOUND);
  return true;
};

module.exports = {
  getAllComunas,
  getComunaById,
  createComuna,
  updateComuna,
  deleteComuna
};
