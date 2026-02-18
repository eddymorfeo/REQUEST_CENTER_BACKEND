const userService = require('../services/userService');
const { HttpStatus } = require('../utils/httpStatus');

const listUsers = async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  res.status(HttpStatus.OK).json({ success: true, ...result });
};

const listAnalystUsers = async (req, res) => {
  const result = await userService.getActiveUsersByRoleCode('ANALYST', req.query);
  res.status(HttpStatus.OK).json({ success: true, ...result });
};

const listFiscalUsers = async (req, res) => {
  const result = await userService.getActiveUsersByRoleCode('FISCAL', req.query);
  res.status(HttpStatus.OK).json({ success: true, ...result });
};

const getUser = async (req, res) => {
  const { id } = req.validated.params;
  const user = await userService.getUserById(id);
  res.status(HttpStatus.OK).json({ success: true, data: user });
};

const createUser = async (req, res) => {
  const { username, fullName, password, isActive, email, roleId } = req.validated.body;

  const user = await userService.createUser({
    username,
    fullName,
    password,
    isActive,
    email,
    roleId
  });

  res.status(HttpStatus.CREATED).json({ success: true, data: user });
};

const updateUser = async (req, res) => {
  const { id } = req.validated.params;
  const { username, fullName, password, isActive, email, roleId } = req.validated.body;

  const user = await userService.updateUser({
    id,
    username,
    fullName,
    password,
    isActive,
    email,
    roleId
  });

  res.status(HttpStatus.OK).json({ success: true, data: user });
};

const deleteUser = async (req, res) => {
  const { id } = req.validated.params;
  await userService.deleteUser(id);
  res.status(HttpStatus.NO_CONTENT).send();
};

module.exports = {
  listUsers,
  listAnalystUsers,
  listFiscalUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};
