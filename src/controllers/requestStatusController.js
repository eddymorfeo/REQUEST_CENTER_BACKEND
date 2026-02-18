const requestStatusService = require('../services/requestStatusService');
const { HttpStatus } = require('../utils/httpStatus');
const { AppError } = require('../utils/appError');

const getAuthUserId = (req) => req?.auth?.id || req?.auth?.userId || req?.auth?.sub || null;

const listRequestStatus = async (req, res) => {
  const result = await requestStatusService.getAllRequestStatus(req.query);
  res.status(HttpStatus.OK).json({ success: true, ...result });
};

const getRequestStatus = async (req, res) => {
  const { id } = req.validated.params;
  const row = await requestStatusService.getRequestStatusById(id);
  res.status(HttpStatus.OK).json({ success: true, data: row });
};

const createRequestStatus = async (req, res) => {
  const { code, name, sortOrder, isTerminal, isActive } = req.validated.body;

  const userId = getAuthUserId(req);
  if (!userId) throw new AppError('Missing auth user id', HttpStatus.UNAUTHORIZED);

  const created = await requestStatusService.createRequestStatus({
    code,
    name,
    sortOrder,
    isTerminal,
    isActive,
    userId
  });

  res.status(HttpStatus.CREATED).json({ success: true, data: created });
};

const updateRequestStatus = async (req, res) => {
  const { id } = req.validated.params;
  const { code, name, sortOrder, isTerminal, isActive } = req.validated.body;

  const updated = await requestStatusService.updateRequestStatus({
    id,
    code,
    name,
    sortOrder,
    isTerminal,
    isActive
  });

  res.status(HttpStatus.OK).json({ success: true, data: updated });
};

const deleteRequestStatus = async (req, res) => {
  const { id } = req.validated.params;
  await requestStatusService.deleteRequestStatus(id);
  res.status(HttpStatus.NO_CONTENT).send();
};

module.exports = {
  listRequestStatus,
  getRequestStatus,
  createRequestStatus,
  updateRequestStatus,
  deleteRequestStatus
};
