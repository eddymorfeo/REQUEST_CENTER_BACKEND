const { z } = require('zod');

const uuid = z.string().uuid();

const schemaListRequestComments = z.object({
  query: z.object({
    requestId: uuid
  }),
  params: z.object({}).optional(),
  body: z.any().optional()
});

const schemaCreateRequestComment = z.object({
  body: z.object({
    request_id: uuid,
    comment: z.string().trim().min(1).max(5000)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const schemaUpdateRequestComment = z.object({
  params: z.object({
    id: uuid
  }),
  body: z.object({
    comment: z.string().trim().min(1).max(5000).optional(),
    is_active: z.boolean().optional()
  }).refine((b) => Object.keys(b).length > 0, { message: 'No fields to update' }),
  query: z.object({}).optional()
});

const schemaDeleteRequestComment = z.object({
  params: z.object({
    id: uuid
  }),
  query: z.object({}).optional(),
  body: z.any().optional()
});

module.exports = {
  schemaListRequestComments,
  schemaCreateRequestComment,
  schemaUpdateRequestComment,
  schemaDeleteRequestComment
};
