const requestTypeService = require('../services/requestTypeService');
const { HttpStatus } = require('../utils/httpStatus');
const { AppError } = require('../utils/appError');

const getAuthUserId = (req) => req?.auth?.id || req?.auth?.userId || req?.auth?.sub || null;

const listRequestTypes = async (req, res) => {
  const result = await requestTypeService.getAllRequestTypes(req.query);
  res.status(HttpStatus.OK).json({ success: true, ...result });
};

const getRequestType = async (req, res) => {
  const { id } = req.validated.params;
  const row = await requestTypeService.getRequestTypeById(id);
  res.status(HttpStatus.OK).json({ success: true, data: row });
};

const createRequestType = async (req, res) => {
  const { code, name, description, isActive } = req.validated.body;

  const userId = getAuthUserId(req);
  if (!userId) throw new AppError('Missing auth user id', HttpStatus.UNAUTHORIZED);

  const created = await requestTypeService.createRequestType({
    code,
    name,
    description,
    isActive,
    userId
  });

  res.status(HttpStatus.CREATED).json({ success: true, data: created });
};

const updateRequestType = async (req, res) => {
  const { id } = req.validated.params;
  const { code, name, description, isActive } = req.validated.body;

  const updated = await requestTypeService.updateRequestType({
    id,
    code,
    name,
    description,
    isActive
  });

  res.status(HttpStatus.OK).json({ success: true, data: updated });
};

const deleteRequestType = async (req, res) => {
  const { id } = req.validated.params;
  await requestTypeService.deleteRequestType(id);
  res.status(HttpStatus.NO_CONTENT).send();
};

module.exports = {
  listRequestTypes,
  getRequestType,
  createRequestType,
  updateRequestType,
  deleteRequestType
};
