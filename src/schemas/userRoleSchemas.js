const { z } = require('zod');

const uuidParam = z.object({
  id: z.string().uuid()
});

const createBody = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid()
});

const updateBody = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid()
});

const listQuery = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional()
});

const schemaList = z.object({ body: z.any().optional(), params: z.any().optional(), query: listQuery });
const schemaGet = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });
const schemaCreate = z.object({ body: createBody, params: z.any().optional(), query: z.any().optional() });
const schemaUpdate = z.object({ body: updateBody, params: uuidParam, query: z.any().optional() });
const schemaDelete = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });

module.exports = {
  schemaListUserRoles: schemaList,
  schemaGetUserRole: schemaGet,
  schemaCreateUserRole: schemaCreate,
  schemaUpdateUserRole: schemaUpdate,
  schemaDeleteUserRole: schemaDelete
};
