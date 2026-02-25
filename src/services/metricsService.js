const metricsRepository = require('../models/metricsRepository');
const { AppError } = require('../utils/appError');
const { HttpStatus } = require('../utils/httpStatus');

function resolveRange(dateFrom, dateTo) {
  // defaults: últimos 30 días
  const now = new Date();
  const to = dateTo ? new Date(`${dateTo}T23:59:59.999Z`) : now;
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`) : new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);

  return {
    fromIso: from.toISOString(),
    toIso: to.toISOString()
  };
}

async function getOverview(query) {
  const { fromIso, toIso } = resolveRange(query.dateFrom, query.dateTo);

  const repoArgs = {
    dateFrom: fromIso,
    dateTo: toIso,
    statusId: query.statusId || null,
    requestTypeId: query.requestTypeId || null,
    priorityId: query.priorityId || null,
    assigneeId: query.assigneeId || null
  };

  const [kpisRow, backlogRows] = await Promise.all([
    metricsRepository.getOverviewKpis(repoArgs),
    metricsRepository.getBacklogByStatus(repoArgs)
  ]);

  if (!kpisRow) {
    throw new AppError('Metrics overview not available', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  return {
    range: { dateFrom: fromIso, dateTo: toIso },
    kpis: {
      backlogTotal: Number(kpisRow.backlog_total || 0),
      createdInRange: Number(kpisRow.created_in_range || 0),
      closedInRange: Number(kpisRow.closed_in_range || 0),
      avgTimeToFirstAssignHours: Number(kpisRow.avg_time_to_first_assign_hours || 0)
    },
    backlogByStatus: backlogRows.map((r) => ({
      statusId: r.status_id,
      code: r.code,
      name: r.name,
      count: Number(r.count || 0)
    }))
  };
}

function resolveGroupBy(groupBy) {
  const value = groupBy || 'day';

  if (value === 'day') return { groupByUnit: 'day', intervalLiteral: '1 day' };
  if (value === 'week') return { groupByUnit: 'week', intervalLiteral: '1 week' };
  if (value === 'month') return { groupByUnit: 'month', intervalLiteral: '1 month' };

  throw new AppError('Invalid groupBy', HttpStatus.BAD_REQUEST);
}

async function getThroughput(query) {
  const { fromIso, toIso } = resolveRange(query.dateFrom, query.dateTo);
  const { groupByUnit, intervalLiteral } = resolveGroupBy(query.groupBy);

  const rows = await metricsRepository.getThroughput({
    dateFrom: fromIso,
    dateTo: toIso,
    groupByUnit,
    intervalLiteral,
    statusId: query.statusId || null,
    requestTypeId: query.requestTypeId || null,
    priorityId: query.priorityId || null,
    assigneeId: query.assigneeId || null
  });

  if (!rows) {
    throw new AppError('Metrics throughput not available', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  return {
    range: { dateFrom: fromIso, dateTo: toIso },
    groupBy: query.groupBy || 'day',
    series: rows.map((r) => ({
      bucket: r.bucket,          // YYYY-MM-DD (para day, week y month = inicio del bucket)
      created: Number(r.created || 0),
      closed: Number(r.closed || 0)
    }))
  };
}

async function getTimeStats(query) {
  const { fromIso, toIso } = resolveRange(query.dateFrom, query.dateTo);

  const row = await metricsRepository.getTimeStats({
    dateFrom: fromIso,
    dateTo: toIso,
    statusId: query.statusId || null,
    requestTypeId: query.requestTypeId || null,
    priorityId: query.priorityId || null,
    assigneeId: query.assigneeId || null
  });

  if (!row) {
    throw new AppError('Metrics time-stats not available', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  return {
    range: { dateFrom: fromIso, dateTo: toIso },
    totals: {
      closedInRange: Number(row.total_closed || 0)
    },
    leadTimeHours: {
      p50: row.lead_p50_h !== null ? Number(row.lead_p50_h) : 0,
      p90: row.lead_p90_h !== null ? Number(row.lead_p90_h) : 0
    },
    cycleTimeHours: {
      p50: row.cycle_p50_h !== null ? Number(row.cycle_p50_h) : 0,
      p90: row.cycle_p90_h !== null ? Number(row.cycle_p90_h) : 0
    }
  };
}

async function getStatusTime(query) {
  const { fromIso, toIso } = resolveRange(query.dateFrom, query.dateTo);

  const rows = await metricsRepository.getStatusTime({
    dateFrom: fromIso,
    dateTo: toIso,
    statusId: query.statusId || null,
    requestTypeId: query.requestTypeId || null,
    priorityId: query.priorityId || null,
    assigneeId: query.assigneeId || null
  });

  if (!rows) {
    throw new AppError('Metrics status-time not available', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  return {
    range: { dateFrom: fromIso, dateTo: toIso },
    byStatus: rows.map((r) => ({
      statusId: r.status_id,
      code: r.code,
      name: r.name,
      countTransitions: Number(r.count_transitions || 0),
      timeHours: {
        p50: r.p50_h !== null ? Number(r.p50_h) : 0,
        p90: r.p90_h !== null ? Number(r.p90_h) : 0
      }
    }))
  };
}

async function getWorkload(query) {
  const { fromIso, toIso } = resolveRange(query.dateFrom, query.dateTo);

  const filters = {
    dateFrom: fromIso,
    dateTo: toIso,
    statusId: query.statusId || null,
    requestTypeId: query.requestTypeId || null,
    priorityId: query.priorityId || null
  };

  const [backlogRows, activityRows] = await Promise.all([
    metricsRepository.getWorkloadBacklogByAssignee(filters),
    metricsRepository.getWorkloadActivityByAssignee(filters)
  ]);

  if (!backlogRows || !activityRows) {
    throw new AppError('Metrics workload not available', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  return {
    range: { dateFrom: fromIso, dateTo: toIso },
    backlogByAssignee: backlogRows.map((r) => ({
      assigneeId: r.assignee_id,
      username: r.username,
      fullName: r.full_name,
      openAssigned: Number(r.open_assigned || 0)
    })),
    activityByUser: activityRows.map((r) => ({
      userId: r.user_id,
      username: r.username,
      fullName: r.full_name,
      createdInRange: Number(r.created_in_range || 0),
      closedInRange: Number(r.closed_in_range || 0),
      assignmentsInRange: Number(r.assignments_in_range || 0)
    }))
  };
}

async function getDistribution(query) {
  const { fromIso, toIso } = resolveRange(query.dateFrom, query.dateTo);

  const filters = {
    dateFrom: fromIso,
    dateTo: toIso,
    statusId: query.statusId || null,
    requestTypeId: query.requestTypeId || null,
    priorityId: query.priorityId || null,
    assigneeId: query.assigneeId || null
  };

  const [openBy, createdBy, closedBy] = await Promise.all([
    metricsRepository.getDistributionOpen(filters),
    metricsRepository.getDistributionCreated(filters),
    metricsRepository.getDistributionClosed(filters)
  ]);

  return {
    range: { dateFrom: fromIso, dateTo: toIso },
    openBy,
    periodBy: {
      created: createdBy,
      closed: closedBy
    }
  };
}

async function getProcessTime(query) {
  const { fromIso, toIso } = resolveRange(query.dateFrom, query.dateTo);
  const inProgressStatusCode = (query.inProgressStatusCode || 'IN_PROGRESS').toUpperCase();

  const row = await metricsRepository.getProcessTimeStats({
    dateFrom: fromIso,
    dateTo: toIso,
    statusId: query.statusId || null,
    requestTypeId: query.requestTypeId || null,
    priorityId: query.priorityId || null,
    assigneeId: query.assigneeId || null,
    inProgressStatusCode
  });

  if (!row) {
    throw new AppError('Metrics process-time not available', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  const toNum = (v) => (v === null || v === undefined ? 0 : Number(v));

  return {
    range: { dateFrom: fromIso, dateTo: toIso },
    totals: {
      closedInRange: toNum(row.total_closed)
    },
    // Horas (frontend las convierte a d/h/min)
    leadHours: {
      min: toNum(row.lead_min_h),
      max: toNum(row.lead_max_h),
      avg: toNum(row.lead_avg_h),
      p50: toNum(row.lead_p50_h),
      p90: toNum(row.lead_p90_h)
    },
    cycleHours: {
      min: toNum(row.cycle_min_h),
      max: toNum(row.cycle_max_h),
      avg: toNum(row.cycle_avg_h),
      p50: toNum(row.cycle_p50_h),
      p90: toNum(row.cycle_p90_h)
    },
    inProgressHours: {
      min: toNum(row.inprog_min_h),
      max: toNum(row.inprog_max_h),
      avg: toNum(row.inprog_avg_h),
      p50: toNum(row.inprog_p50_h),
      p90: toNum(row.inprog_p90_h)
    }
  };
}

module.exports = {
  getOverview,
  getThroughput,
  getTimeStats,
  getStatusTime,
  getWorkload,
  getDistribution,
  getProcessTime
};