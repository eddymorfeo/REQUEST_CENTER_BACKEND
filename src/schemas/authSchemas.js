const { z } = require('zod');

const loginBody = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(200)
});

const schemaLogin = z.object({
  body: loginBody,
  params: z.any().optional(),
  query: z.any().optional()
});

module.exports = { schemaLogin };
