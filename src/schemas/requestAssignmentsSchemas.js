const { z } = require('zod');

const uuid = z.string().uuid();

const schemaListRequestAssignments = z.object({
  query: z.object({
    requestId: uuid
  }),
  params: z.object({}).optional(),
  body: z.any().optional()
});

const schemaGetRequestAssignment = z.object({
  params: z.object({
    id: uuid
  }),
  query: z.object({}).optional(),
  body: z.any().optional()
});

const schemaSoftDeleteRequestAssignment = z.object({
  params: z.object({
    id: uuid
  }),
  query: z.object({}).optional(),
  body: z.any().optional()
});

module.exports = {
  schemaListRequestAssignments,
  schemaGetRequestAssignment,
  schemaSoftDeleteRequestAssignment
};
