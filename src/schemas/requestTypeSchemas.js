const { z } = require('zod');

const uuidParam = z.object({
  id: z.string().uuid()
});

const listQuery = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional()
});

const createBody = z.object({
  code: z.string().min(1).max(6),
  name: z.string().min(2).max(200),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true)
});

const updateBody = z.object({
  code: z.string().min(1).max(6),
  name: z.string().min(2).max(200),
  description: z.string().optional().nullable(),
  isActive: z.boolean()
});

const schemaListRequestTypes = z.object({ body: z.any().optional(), params: z.any().optional(), query: listQuery });
const schemaGetRequestType = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });
const schemaCreateRequestType = z.object({ body: createBody, params: z.any().optional(), query: z.any().optional() });
const schemaUpdateRequestType = z.object({ body: updateBody, params: uuidParam, query: z.any().optional() });
const schemaDeleteRequestType = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });

module.exports = {
  schemaListRequestTypes,
  schemaGetRequestType,
  schemaCreateRequestType,
  schemaUpdateRequestType,
  schemaDeleteRequestType
};
