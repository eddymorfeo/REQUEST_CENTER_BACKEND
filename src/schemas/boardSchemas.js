const { z } = require('zod');

const uuid = z.string().uuid();
const positiveInt = z.coerce.number().int().positive();

const schemaBoardList = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
    statusCode: z.string().trim().min(1).optional(),
    priorityCode: z.string().trim().min(1).optional(),
    typeCode: z.string().trim().min(1).optional()
  }),
  params: z.object({}).optional(),
  body: z.any().optional()
});

const schemaBoardAssign = z.object({
  params: z.object({
    requestId: uuid
  }),
  body: z.object({
    assigned_to: uuid,
    note: z.string().trim().min(1).max(1000).optional()
  }),
  query: z.object({}).optional()
});

const schemaBoardChangeStatus = z.object({
  params: z.object({
    requestId: uuid
  }),
  body: z.object({
    to_status_code: z.string().trim().min(1).optional(),
    to_status_id: uuid.optional(),
    note: z.string().trim().min(1).max(1000).optional()
  }).refine((data) => data.to_status_code || data.to_status_id, {
    message: 'to_status_code or to_status_id is required'
  }),
  query: z.object({}).optional()
});

const schemaBoardChanges = z.object({
  query: z.object({
    sinceId: positiveInt.default(0),
    requestId: uuid.optional()
  }),
  params: z.object({}).optional(),
  body: z.any().optional()
});

const schemaBoardMetrics = z.object({
  query: z.object({
    days: z.coerce.number().int().min(1).max(365).default(30)
  }),
  params: z.object({}).optional(),
  body: z.any().optional()
});

module.exports = {
  schemaBoardList,
  schemaBoardAssign,
  schemaBoardChangeStatus,
  schemaBoardChanges,
  schemaBoardMetrics
};
