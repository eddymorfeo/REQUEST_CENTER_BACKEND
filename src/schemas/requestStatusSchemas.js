const { z } = require('zod');

const uuidParam = z.object({
  id: z.string().uuid()
});

const listQuery = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional()
});

const createBody = z.object({
  code: z.string().min(1).max(80),
  name: z.string().min(2).max(200),
  sortOrder: z.number().int().min(0).default(0),
  isTerminal: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true)
});

const updateBody = z.object({
  code: z.string().min(1).max(80),
  name: z.string().min(2).max(200),
  sortOrder: z.number().int().min(0),
  isTerminal: z.boolean(),
  isActive: z.boolean()
});

const schemaListRequestStatus = z.object({ body: z.any().optional(), params: z.any().optional(), query: listQuery });
const schemaGetRequestStatus = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });
const schemaCreateRequestStatus = z.object({ body: createBody, params: z.any().optional(), query: z.any().optional() });
const schemaUpdateRequestStatus = z.object({ body: updateBody, params: uuidParam, query: z.any().optional() });
const schemaDeleteRequestStatus = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });

module.exports = {
  schemaListRequestStatus,
  schemaGetRequestStatus,
  schemaCreateRequestStatus,
  schemaUpdateRequestStatus,
  schemaDeleteRequestStatus
};
