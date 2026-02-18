const { z } = require('zod');

const uuid = z.string().uuid();

const schemaListBoardEvents = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(500).default(50),
    requestId: uuid.optional()
  }),
  params: z.object({}).optional(),
  body: z.any().optional()
});

module.exports = { schemaListBoardEvents };
