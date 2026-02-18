const asyncHandler = require("../utils/asyncHandler");
const { HttpStatus } = require("../utils/httpStatus");

const workflowService = require("../services/requestWorkflowService");

const assignRequest = asyncHandler(async (req, res) => {
  const { assigned_to, note } = req.validated.body;
  const { requestId } = req.validated.params;

  const assignment = await workflowService.assignRequest({
    requestId,
    assignedTo: assigned_to,
    note,
    actor: req.currentUser,
  });

  return res.status(HttpStatus.OK).json({ success: true, data: assignment });
});

const changeStatus = asyncHandler(async (req, res) => {
  const { to_status_id, note } = req.validated.body;
  const { requestId } = req.validated.params;

  const updated = await workflowService.changeStatus({
    requestId,
    toStatusId: to_status_id,
    note,
    actor: req.currentUser,
  });

  return res.status(HttpStatus.OK).json({ success: true, data: updated });
});

const addComment = asyncHandler(async (req, res) => {
  const { comment } = req.validated.body;
  const { requestId } = req.validated.params;

  const created = await workflowService.addComment({
    requestId,
    comment,
    actor: req.currentUser,
  });

  return res.status(HttpStatus.CREATED).json({ success: true, data: created });
});

const addAttachment = asyncHandler(async (req, res) => {
  const { file_name, file_url, mime_type, size_bytes } = req.validated.body;
  const { requestId } = req.validated.params;

  const created = await workflowService.addAttachment({
    requestId,
    fileName: file_name,
    fileUrl: file_url,
    mimeType: mime_type,
    sizeBytes: size_bytes,
    actor: req.currentUser,
  });

  return res.status(HttpStatus.CREATED).json({ success: true, data: created });
});

module.exports = {
  assignRequest,
  changeStatus,
  addComment,
  addAttachment,
};
