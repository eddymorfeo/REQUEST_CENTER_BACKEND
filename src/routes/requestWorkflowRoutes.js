const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");

const {
  attachCurrentUser,
  requireAdmin,
  requireAdminOrAssignee,
} = require("../middlewares/permissions");

const controller = require("../controllers/requestWorkflowController");

const {
  assignRequestSchema,
  changeStatusSchema,
  createCommentSchema,
  createAttachmentSchema,
} = require("../schemas/requestWorkflowSchemas");

/**
 * Todas estas rutas requieren auth.
 * attachCurrentUser carga roleCode desde DB para aplicar reglas.
 */

router.post(
  "/requests/:requestId/assign",
  requireAuth,
  attachCurrentUser,
  requireAdmin,
  validate(assignRequestSchema),
  controller.assignRequest
);

router.post(
  "/requests/:requestId/status",
  requireAuth,
  attachCurrentUser,
  requireAdminOrAssignee,
  validate(changeStatusSchema),
  controller.changeStatus
);

router.post(
  "/requests/:requestId/comments",
  requireAuth,
  attachCurrentUser,
  requireAdminOrAssignee,
  validate(createCommentSchema),
  controller.addComment
);

router.post(
  "/requests/:requestId/attachments",
  requireAuth,
  attachCurrentUser,
  requireAdminOrAssignee,
  validate(createAttachmentSchema),
  controller.addAttachment
);

module.exports = router;
