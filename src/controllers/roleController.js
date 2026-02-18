const roleService = require('../services/roleService');
const { HttpStatus } = require('../utils/httpStatus');

const listRoles = async (req, res) => {
  const result = await roleService.getAllRoles(req.query);
  res.status(HttpStatus.OK).json({ success: true, ...result });
};

const getRole = async (req, res) => {
  const { id } = req.validated.params;
  const role = await roleService.getRoleById(id);
  res.status(HttpStatus.OK).json({ success: true, data: role });
};

const createRole = async (req, res) => {
  const { code, name, isActive } = req.validated.body;
  const role = await roleService.createRole({ code, name, isActive });
  res.status(HttpStatus.CREATED).json({ success: true, data: role });
};

const updateRole = async (req, res) => {
  const { id } = req.validated.params;
  const { code, name, isActive } = req.validated.body;

  const role = await roleService.updateRole({ id, code, name, isActive });
  res.status(HttpStatus.OK).json({ success: true, data: role });
};

const deleteRole = async (req, res) => {
  const { id } = req.validated.params;
  await roleService.deleteRole(id);
  res.status(HttpStatus.NO_CONTENT).send();
};

module.exports = {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
};
