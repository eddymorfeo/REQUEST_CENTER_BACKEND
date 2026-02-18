const { z } = require('zod');

const uuidParam = z.object({
  id: z.string().uuid()
});

const createRoleBody = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(80),
  isActive: z.boolean().optional().default(true)
});

const updateRoleBody = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(80),
  isActive: z.boolean()
});

const listRolesQuery = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional()
});

const schemaListRoles = z.object({ body: z.any().optional(), params: z.any().optional(), query: listRolesQuery });
const schemaGetRole = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });
const schemaCreateRole = z.object({ body: createRoleBody, params: z.any().optional(), query: z.any().optional() });
const schemaUpdateRole = z.object({ body: updateRoleBody, params: uuidParam, query: z.any().optional() });
const schemaDeleteRole = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });

module.exports = {
  schemaListRoles,
  schemaGetRole,
  schemaCreateRole,
  schemaUpdateRole,
  schemaDeleteRole
};
