const requestService = require('../services/requestService');
const { HttpStatus } = require('../utils/httpStatus');
const { AppError } = require('../utils/appError');

const getAuthUserId = (req) => req?.auth?.id || req?.auth?.userId || req?.auth?.sub || null;

const listRequests = async (req, res) => {
  const result = await requestService.getAllRequests(req.query);
  res.status(HttpStatus.OK).json({ success: true, ...result });
};

const getRequest = async (req, res) => {
  const { id } = req.validated.params;
  const row = await requestService.getRequestById(id);
  res.status(HttpStatus.OK).json({ success: true, data: row });
};

const createRequest = async (req, res) => {
  const { title, description, statusId, requestTypeId, priorityId } = req.validated.body;

  const createdBy = getAuthUserId(req);
  if (!createdBy) throw new AppError('Missing auth user id', HttpStatus.UNAUTHORIZED);

  const created = await requestService.createRequest({
    title,
    description,
    statusId,
    requestTypeId,
    priorityId,
    createdBy
  });

  res.status(HttpStatus.CREATED).json({ success: true, data: created });
};

const updateRequest = async (req, res) => {
  const { id } = req.validated.params;
  const { title, description, statusId, requestTypeId, priorityId, isActive } = req.validated.body;

  const updated = await requestService.updateRequest({
    id,
    title,
    description,
    statusId,
    requestTypeId,
    priorityId,
    isActive
  });

  res.status(HttpStatus.OK).json({ success: true, data: updated });
};

const deleteRequest = async (req, res) => {
  const { id } = req.validated.params;
  await requestService.deleteRequest(id);
  res.status(HttpStatus.NO_CONTENT).send();
};

module.exports = {
  listRequests,
  getRequest,
  createRequest,
  updateRequest,
  deleteRequest
};
