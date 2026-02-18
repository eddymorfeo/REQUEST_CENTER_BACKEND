const comunaService = require('../services/comunaService');
const { HttpStatus } = require('../utils/httpStatus');

const listComunas = async (req, res) => {
  const result = await comunaService.getAllComunas(req.query);
  res.status(HttpStatus.OK).json({ success: true, ...result });
};

const getComuna = async (req, res) => {
  const { id } = req.validated.params;
  const comuna = await comunaService.getComunaById(id);
  res.status(HttpStatus.OK).json({ success: true, data: comuna });
};

const createComuna = async (req, res) => {
  const { name, isActive } = req.validated.body;
  const comuna = await comunaService.createComuna({ name, isActive });
  res.status(HttpStatus.CREATED).json({ success: true, data: comuna });
};

const updateComuna = async (req, res) => {
  const { id } = req.validated.params;
  const { name, isActive } = req.validated.body;

  const comuna = await comunaService.updateComuna({ id, name, isActive });
  res.status(HttpStatus.OK).json({ success: true, data: comuna });
};

const deleteComuna = async (req, res) => {
  const { id } = req.validated.params;
  await comunaService.deleteComuna(id);
  res.status(HttpStatus.NO_CONTENT).send();
};

module.exports = {
  listComunas,
  getComuna,
  createComuna,
  updateComuna,
  deleteComuna
};
