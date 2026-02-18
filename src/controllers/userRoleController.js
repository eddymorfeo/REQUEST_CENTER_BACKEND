const userRoleService = require('../services/userRoleService');
const { HttpStatus } = require('../utils/httpStatus');

const listUserRoles = async (req, res) => {
  const result = await userRoleService.getAllUserRoles(req.query);
  res.status(HttpStatus.OK).json({ success: true, ...result });
};

const getUserRole = async (req, res) => {
  const { id } = req.validated.params;
  const record = await userRoleService.getUserRoleById(id);
  res.status(HttpStatus.OK).json({ success: true, data: record });
};

const createUserRole = async (req, res) => {
  const { userId, roleId } = req.validated.body;
  const record = await userRoleService.createUserRole({ userId, roleId });
  res.status(HttpStatus.CREATED).json({ success: true, data: record });
};

const updateUserRole = async (req, res) => {
  const { id } = req.validated.params;
  const { userId, roleId } = req.validated.body;

  const record = await userRoleService.updateUserRole({ id, userId, roleId });
  res.status(HttpStatus.OK).json({ success: true, data: record });
};

const deleteUserRole = async (req, res) => {
  const { id } = req.validated.params;
  await userRoleService.deleteUserRole(id);
  res.status(HttpStatus.NO_CONTENT).send();
};

module.exports = {
  listUserRoles,
  getUserRole,
  createUserRole,
  updateUserRole,
  deleteUserRole
};
