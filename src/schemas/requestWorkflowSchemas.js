const { z } = require("zod");

const uuidSchema = z.string().uuid();

const assignRequestSchema = z.object({
  body: z.object({
    assigned_to: uuidSchema,
    note: z.string().trim().min(1).max(500).optional(),
  }),
  params: z.object({
    requestId: uuidSchema,
  }),
});

const changeStatusSchema = z.object({
  body: z.object({
    to_status_id: uuidSchema,
    note: z.string().trim().min(1).max(500).optional(),
  }),
  params: z.object({
    requestId: uuidSchema,
  }),
});

const createCommentSchema = z.object({
  body: z.object({
    comment: z.string().trim().min(1).max(5000),
  }),
  params: z.object({
    requestId: uuidSchema,
  }),
});

const createAttachmentSchema = z.object({
  body: z.object({
    file_name: z.string().trim().min(1).max(255),
    file_url: z.string().trim().min(1).max(2048),
    mime_type: z.string().trim().max(200).optional(),
    size_bytes: z.number().int().nonnegative().optional(),
  }),
  params: z.object({
    requestId: uuidSchema,
  }),
});

const listBoardSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    status_id: uuidSchema.optional(),
    request_type_id: uuidSchema.optional(),
    priority_id: uuidSchema.optional(),
    assigned_to: uuidSchema.optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(200).optional(),
  }),
});

const boardChangesSchema = z.object({
  query: z.object({
    lastEventId: z.coerce.number().int().min(0).optional(),
  }),
});

module.exports = {
  assignRequestSchema,
  changeStatusSchema,
  createCommentSchema,
  createAttachmentSchema,
  listBoardSchema,
  boardChangesSchema,
};
