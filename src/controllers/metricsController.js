const metricsService = require('../services/metricsService');
const { HttpStatus } = require('../utils/httpStatus');

const getMetricsOverview = async (req, res) => {
  const result = await metricsService.getOverview(req.validated.query);
  res.status(HttpStatus.OK).json({ success: true, data: result });
};

const getMetricsThroughput = async (req, res) => {
  const result = await metricsService.getThroughput(req.validated.query);
  res.status(HttpStatus.OK).json({ success: true, data: result });
};

const getMetricsTimeStats = async (req, res) => {
  const result = await metricsService.getTimeStats(req.validated.query);
  res.status(HttpStatus.OK).json({ success: true, data: result });
};

const getMetricsStatusTime = async (req, res) => {
  const result = await metricsService.getStatusTime(req.validated.query);
  res.status(HttpStatus.OK).json({ success: true, data: result });
};

const getMetricsWorkload = async (req, res) => {
  const result = await metricsService.getWorkload(req.validated.query);
  res.status(HttpStatus.OK).json({ success: true, data: result });
};

const getMetricsDistribution = async (req, res) => {
  const result = await metricsService.getDistribution(req.validated.query);
  res.status(HttpStatus.OK).json({ success: true, data: result });
};

const getMetricsProcessTime = async (req, res) => {
  const result = await metricsService.getProcessTime(req.validated.query);
  res.status(HttpStatus.OK).json({ success: true, data: result });
};

const getMetricsRequestTimes = async (req, res) => {
  const result = await metricsService.getRequestTimes(req.validated.query);
  res.status(HttpStatus.OK).json({ success: true, data: result });
};

const getMetricsRequestTimesLive = async (req, res) => {
  const result = await metricsService.getRequestTimesLive(req.validated.query);
  return res.status(HttpStatus.OK).json({ success: true, data: result });
};

module.exports = {
  getMetricsOverview,
  getMetricsThroughput,
  getMetricsTimeStats,
  getMetricsStatusTime,
  getMetricsWorkload,
  getMetricsDistribution,
  getMetricsProcessTime,
  getMetricsRequestTimes,
  getMetricsRequestTimesLive
};