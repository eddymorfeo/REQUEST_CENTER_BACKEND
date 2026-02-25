const { z } = require('zod');

const uuid = z.string().uuid();
const isoDateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)');

const groupByEnum = z.enum(['day', 'week', 'month']);

const overviewQuery = z.object({
  dateFrom: isoDateOnly.optional(),
  dateTo: isoDateOnly.optional(),
  statusId: uuid.optional(),
  requestTypeId: uuid.optional(),
  priorityId: uuid.optional(),
  assigneeId: uuid.optional()
});

const schemaGetMetricsOverview = z.object({
  query: overviewQuery,
  params: z.object({}).optional(),
  body: z.any().optional()
});

const throughputQuery = z.object({
  dateFrom: isoDateOnly.optional(),
  dateTo: isoDateOnly.optional(),
  groupBy: groupByEnum.optional(), // default en service = 'day'
  statusId: uuid.optional(),
  requestTypeId: uuid.optional(),
  priorityId: uuid.optional(),
  assigneeId: uuid.optional()
});

const schemaGetMetricsThroughput = z.object({
  query: throughputQuery,
  params: z.object({}).optional(),
  body: z.any().optional()
});

const timeStatsQuery = z.object({
  dateFrom: isoDateOnly.optional(),
  dateTo: isoDateOnly.optional(),
  statusId: uuid.optional(),
  requestTypeId: uuid.optional(),
  priorityId: uuid.optional(),
  assigneeId: uuid.optional()
});

const schemaGetMetricsTimeStats = z.object({
  query: timeStatsQuery,
  params: z.object({}).optional(),
  body: z.any().optional()
});

const statusTimeQuery = z.object({
  dateFrom: isoDateOnly.optional(),
  dateTo: isoDateOnly.optional(),
  statusId: uuid.optional(),         // filtra por estado EN LA DURACIÓN (to_status_id)
  requestTypeId: uuid.optional(),
  priorityId: uuid.optional(),
  assigneeId: uuid.optional()
});

const schemaGetMetricsStatusTime = z.object({
  query: statusTimeQuery,
  params: z.object({}).optional(),
  body: z.any().optional()
});

const workloadQuery = z.object({
  dateFrom: isoDateOnly.optional(),
  dateTo: isoDateOnly.optional(),
  requestTypeId: uuid.optional(),
  priorityId: uuid.optional(),
  statusId: uuid.optional() // si quieres filtrar backlog por estado actual
});

const schemaGetMetricsWorkload = z.object({
  query: workloadQuery,
  params: z.object({}).optional(),
  body: z.any().optional()
});

const distributionQuery = z.object({
  dateFrom: isoDateOnly.optional(),
  dateTo: isoDateOnly.optional(),
  statusId: uuid.optional(),
  requestTypeId: uuid.optional(),
  priorityId: uuid.optional(),
  assigneeId: uuid.optional()
});

const schemaGetMetricsDistribution = z.object({
  query: distributionQuery,
  params: z.object({}).optional(),
  body: z.any().optional()
});

const processTimeQuery = z.object({
  dateFrom: isoDateOnly.optional(),
  dateTo: isoDateOnly.optional(),
  statusId: uuid.optional(),
  requestTypeId: uuid.optional(),
  priorityId: uuid.optional(),
  assigneeId: uuid.optional(),

  // opcional: si algún día cambias el code IN_PROGRESS o quieres controlar el estado objetivo
  inProgressStatusCode: z.string().min(1).optional() // default: 'IN_PROGRESS'
});

const schemaGetMetricsProcessTime = z.object({
  query: processTimeQuery,
  params: z.object({}).optional(),
  body: z.any().optional()
});

module.exports = {
  schemaGetMetricsOverview,
  schemaGetMetricsThroughput,
  schemaGetMetricsTimeStats,
  schemaGetMetricsStatusTime,
  schemaGetMetricsDistribution,
  schemaGetMetricsProcessTime,
  schemaGetMetricsWorkload
};