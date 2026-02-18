const { z } = require('zod');

const uuidParam = z.object({
  id: z.string().uuid()
});

const listQuery = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  includeInactive: z.string().optional(),
  statusId: z.string().uuid().optional(),
  requestTypeId: z.string().uuid().optional(),
  priorityId: z.string().uuid().optional(),
  q: z.string().optional()
});

const createBody = z.object({
  title: z.string().min(2).max(250),
  description: z.string().optional().nullable(),
  statusId: z.string().uuid().optional(), // si no viene, usa DEFAULT en DB
  requestTypeId: z.string().uuid(),
  priorityId: z.string().uuid()
});

const updateBody = z.object({
  title: z.string().min(2).max(250).optional(),
  description: z.string().optional().nullable(),
  statusId: z.string().uuid().optional(),
  requestTypeId: z.string().uuid().optional(),
  priorityId: z.string().uuid().optional(),
  isActive: z.boolean().optional()
});

const schemaListRequests = z.object({ body: z.any().optional(), params: z.any().optional(), query: listQuery });
const schemaGetRequest = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });
const schemaCreateRequest = z.object({ body: createBody, params: z.any().optional(), query: z.any().optional() });
const schemaUpdateRequest = z.object({ body: updateBody, params: uuidParam, query: z.any().optional() });
const schemaDeleteRequest = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });

module.exports = {
  schemaListRequests,
  schemaGetRequest,
  schemaCreateRequest,
  schemaUpdateRequest,
  schemaDeleteRequest
};
