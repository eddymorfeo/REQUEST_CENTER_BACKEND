const path = require('path');
const fs = require('fs');
const { HttpStatus } = require('../utils/httpStatus');
const requestAttachmentsService = require('../services/requestAttachmentsService');
const requestAttachmentsRepository = require("../models/requestAttachmentsRepository");

async function listRequestAttachments(req, res) {
  const { requestId } = req.validated.query;
  const data = await requestAttachmentsService.listRequestAttachments(requestId);

  return res.status(HttpStatus.OK).json({ success: true, data });
}

async function createRequestAttachment(req, res) {
  const data = await requestAttachmentsService.createRequestAttachment(req, req.validated.body);

  return res.status(HttpStatus.CREATED).json({
    success: true,
    message: 'Attachment created',
    data
  });
}


/** ========= NEW: upload ========= */
async function updateRequestAttachment(req, res) {
  const { id } = req.validated.params;
  const data = await requestAttachmentsService.updateRequestAttachment(id, req.validated.body);

  return res.status(HttpStatus.OK).json({ success: true, message: 'Attachment updated', data });
}

async function deleteRequestAttachment(req, res) {
  const { id } = req.validated.params;
  const data = await requestAttachmentsService.deleteRequestAttachment(id);

  return res.status(HttpStatus.OK).json({ success: true, message: 'Attachment deleted', data });
}

async function uploadRequestAttachment(req, res) {
  const requestId = req.body?.requestId;
  if (!requestId) {
    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Validation error',
      errors: [{ field: 'requestId', message: 'requestId is required' }]
    });
  }

  if (!req.file) {
    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Validation error',
      errors: [{ field: 'file', message: 'file is required' }]
    });
  }

  // guardamos un file_url “lógico” para luego descargar
  // Opción A (recomendada): descargar SIEMPRE por endpoint download/:id
  // Igual guardamos el path real en DB para resolver.
  const body = {
    request_id: requestId,
    file_name: req.file.originalname,
    file_url: req.file.path,        // path absoluto (Windows)
    mime_type: req.file.mimetype,
    size_bytes: req.file.size
  };

  const data = await requestAttachmentsService.createRequestAttachment(req, body);

  return res.status(HttpStatus.CREATED).json({
    success: true,
    message: 'Attachment uploaded',
    data
  });
}

/** ========= NEW: download ========= */
async function downloadRequestAttachment(req, res) {
  const { id } = req.params;

  // Necesitamos getById. Te dejo abajo la función en repository.
  const attachment = await requestAttachmentsRepository.getById(id);

  if (!attachment || attachment.is_active === false) {
    return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Attachment not found' });
  }

  const filePath = attachment.file_url;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'File missing on disk' });
  }

  // nombre bonito al descargar
  const downloadName = attachment.file_name || path.basename(filePath);
  return res.download(filePath, downloadName);
}

module.exports = {
  listRequestAttachments,
  createRequestAttachment,
  updateRequestAttachment,
  deleteRequestAttachment,
  uploadRequestAttachment,
  downloadRequestAttachment
};
