const { z } = require('zod');

const uuidParam = z.object({
  id: z.string().uuid()
});

const createComunaBody = z.object({
  name: z.string().min(2).max(120),
  isActive: z.boolean().optional().default(true)
});

const updateComunaBody = z.object({
  name: z.string().min(2).max(120),
  isActive: z.boolean()
});

const listComunasQuery = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional()
});

const schemaListComunas = z.object({ body: z.any().optional(), params: z.any().optional(), query: listComunasQuery });
const schemaGetComuna = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });
const schemaCreateComuna = z.object({ body: createComunaBody, params: z.any().optional(), query: z.any().optional() });
const schemaUpdateComuna = z.object({ body: updateComunaBody, params: uuidParam, query: z.any().optional() });
const schemaDeleteComuna = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });

module.exports = {
  schemaListComunas,
  schemaGetComuna,
  schemaCreateComuna,
  schemaUpdateComuna,
  schemaDeleteComuna
};
