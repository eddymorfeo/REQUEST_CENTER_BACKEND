const { z } = require('zod');

const uuid = z.string().uuid();

const schemaListRequestAttachments = z.object({
  query: z.object({
    requestId: uuid
  }),
  params: z.object({}).optional(),
  body: z.any().optional()
});

const schemaCreateRequestAttachment = z.object({
  body: z.object({
    request_id: uuid,
    file_name: z.string().trim().min(1).max(500),
    file_url: z.string().trim().min(1).max(2000),
    mime_type: z.string().trim().max(200).optional(),
    size_bytes: z.coerce.number().int().nonnegative().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const schemaUpdateRequestAttachment = z.object({
  params: z.object({
    id: uuid
  }),
  body: z.object({
    file_name: z.string().trim().min(1).max(500).optional(),
    file_url: z.string().trim().min(1).max(2000).optional(),
    mime_type: z.string().trim().max(200).optional(),
    size_bytes: z.coerce.number().int().nonnegative().optional(),
    is_active: z.boolean().optional()
  }).refine((b) => Object.keys(b).length > 0, { message: 'No fields to update' }),
  query: z.object({}).optional()
});

const schemaDeleteRequestAttachment = z.object({
  params: z.object({
    id: uuid
  }),
  query: z.object({}).optional(),
  body: z.any().optional()
});

module.exports = {
  schemaListRequestAttachments,
  schemaCreateRequestAttachment,
  schemaUpdateRequestAttachment,
  schemaDeleteRequestAttachment
};
