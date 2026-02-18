const requestPriorityService = require('../services/requestPriorityService');
const { HttpStatus } = require('../utils/httpStatus');
const { AppError } = require('../utils/appError');

const getAuthUserId = (req) => req?.auth?.id || req?.auth?.userId || req?.auth?.sub || null;

const listRequestPriorities = async (req, res) => {
  const result = await requestPriorityService.getAllRequestPriorities(req.query);
  res.status(HttpStatus.OK).json({ success: true, ...result });
};

const getRequestPriority = async (req, res) => {
  const { id } = req.validated.params;
  const row = await requestPriorityService.getRequestPriorityById(id);
  res.status(HttpStatus.OK).json({ success: true, data: row });
};

const createRequestPriority = async (req, res) => {
  const { code, name, sortOrder, isActive } = req.validated.body;

  const userId = getAuthUserId(req);
  if (!userId) throw new AppError('Missing auth user id', HttpStatus.UNAUTHORIZED);

  const created = await requestPriorityService.createRequestPriority({
    code,
    name,
    sortOrder,
    isActive,
    userId
  });

  res.status(HttpStatus.CREATED).json({ success: true, data: created });
};

const updateRequestPriority = async (req, res) => {
  const { id } = req.validated.params;
  const { code, name, sortOrder, isActive } = req.validated.body;

  const updated = await requestPriorityService.updateRequestPriority({
    id,
    code,
    name,
    sortOrder,
    isActive
  });

  res.status(HttpStatus.OK).json({ success: true, data: updated });
};

const deleteRequestPriority = async (req, res) => {
  const { id } = req.validated.params;
  await requestPriorityService.deleteRequestPriority(id);
  res.status(HttpStatus.NO_CONTENT).send();
};

module.exports = {
  listRequestPriorities,
  getRequestPriority,
  createRequestPriority,
  updateRequestPriority,
  deleteRequestPriority
};
