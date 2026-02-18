const { z } = require('zod');

const uuidParam = z.object({
  id: z.string().uuid()
});

const listQuery = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional()
});

const createBody = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(2).max(200),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().optional().default(true)
});

const updateBody = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(2).max(200),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean()
});

const schemaListRequestPriorities = z.object({ body: z.any().optional(), params: z.any().optional(), query: listQuery });
const schemaGetRequestPriority = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });
const schemaCreateRequestPriority = z.object({ body: createBody, params: z.any().optional(), query: z.any().optional() });
const schemaUpdateRequestPriority = z.object({ body: updateBody, params: uuidParam, query: z.any().optional() });
const schemaDeleteRequestPriority = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });

module.exports = {
  schemaListRequestPriorities,
  schemaGetRequestPriority,
  schemaCreateRequestPriority,
  schemaUpdateRequestPriority,
  schemaDeleteRequestPriority
};
