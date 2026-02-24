const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const requestAttachmentsController = require('../controllers/requestAttachmentsController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');

const {
  schemaListRequestAttachments,
  schemaCreateRequestAttachment,
  schemaUpdateRequestAttachment,
  schemaDeleteRequestAttachment
} = require('../schemas/requestAttachmentsSchemas');

const router = express.Router();

/** ========= Helpers ========= */
const BASE_DIR = 'C:\\Request_Center_Documents\\requests';

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeSegment(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function resolveActorUsername(req) {
  // Ajusta según tu payload real. Tu auth usa req.auth.* (service ya lo usa):contentReference[oaicite:5]{index=5}
  return req?.auth?.username || req?.auth?.user?.username || 'unknown';
}

/** ========= Multer storage ========= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const requestId = req.body?.requestId || req.query?.requestId;
    if (!requestId) return cb(new Error('requestId is required'), null);

    const targetDir = path.join(BASE_DIR, requestId);
    ensureDirSync(targetDir);
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const requestId = req.body?.requestId || req.query?.requestId;
    const username = safeSegment(resolveActorUsername(req));
    const titleSlug = safeSegment(req.body?.title || 'request'); // opcional
    const original = safeSegment(file.originalname);

    const stamp = nowStamp();
    const finalName = `${stamp}__${username}__${titleSlug}__${original}`;
    cb(null, finalName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB (ajusta)
});


// GET /api/request-attachments?requestId=...
router.get('/', validate(schemaListRequestAttachments), asyncHandler(requestAttachmentsController.listRequestAttachments));

// POST /api/request-attachments
router.post('/', validate(schemaCreateRequestAttachment), asyncHandler(requestAttachmentsController.createRequestAttachment));

// PUT /api/request-attachments/:id
router.put('/:id', validate(schemaUpdateRequestAttachment), asyncHandler(requestAttachmentsController.updateRequestAttachment));

// DELETE /api/request-attachments/:id
router.delete('/:id', validate(schemaDeleteRequestAttachment), asyncHandler(requestAttachmentsController.deleteRequestAttachment));

// POST /api/request-attachments/upload (multipart/form-data)
router.post( '/upload',  upload.single('file'),  asyncHandler(requestAttachmentsController.uploadRequestAttachment));

// GET /api/request-attachments/download/:id
router.get('/download/:id',  asyncHandler(requestAttachmentsController.downloadRequestAttachment));

module.exports = { requestAttachmentsRouter: router };
