const { z } = require('zod');

const uuid = z.string().uuid();

const schemaListRequestStatusHistory = z.object({
  query: z.object({
    requestId: uuid
  }),
  params: z.object({}).optional(),
  body: z.any().optional()
});

const schemaCreateRequestStatusHistory = z.object({
  body: z.object({
    request_id: uuid,
    from_status_id: uuid.optional(),
    to_status_id: uuid,
    note: z.string().trim().min(1).max(1000).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = {
  schemaListRequestStatusHistory,
  schemaCreateRequestStatusHistory
};
