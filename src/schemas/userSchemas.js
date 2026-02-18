const { z } = require('zod');

const uuidParam = z.object({
  id: z.string().uuid()
});

const createUserBody = z.object({
  username: z.string().min(3).max(50),
  fullName: z.string().min(3).max(120),
  email: z.string().email().max(255),
  roleId: z.string().uuid().optional(),
  password: z.string().min(6).max(200),
  isActive: z.boolean().optional().default(true)
});

const updateUserBody = z.object({
  username: z.string().min(3).max(50),
  fullName: z.string().min(3).max(120),
  email: z.string().email().max(255).optional(),
  roleId: z.string().uuid().optional(),
  password: z.string().min(6).max(200).optional(),
  isActive: z.boolean()
});

const listUsersQuery = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional()
});

const schemaListUsers = z.object({ body: z.any().optional(), params: z.any().optional(), query: listUsersQuery });
const schemaGetUser = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });
const schemaCreateUser = z.object({ body: createUserBody, params: z.any().optional(), query: z.any().optional() });
const schemaUpdateUser = z.object({ body: updateUserBody, params: uuidParam, query: z.any().optional() });
const schemaDeleteUser = z.object({ body: z.any().optional(), params: uuidParam, query: z.any().optional() });

module.exports = {
  schemaListUsers,
  schemaGetUser,
  schemaCreateUser,
  schemaUpdateUser,
  schemaDeleteUser
};
