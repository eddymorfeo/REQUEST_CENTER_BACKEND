const express = require('express');
const metricsController = require('../controllers/metricsController');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const { schemaGetMetricsOverview, schemaGetMetricsThroughput, schemaGetMetricsTimeStats, schemaGetMetricsStatusTime, schemaGetMetricsWorkload, schemaGetMetricsDistribution, schemaGetMetricsProcessTime } = require('../schemas/metricsSchemas');

const router = express.Router();

router.get('/overview', validate(schemaGetMetricsOverview), asyncHandler(metricsController.getMetricsOverview));
router.get('/throughput', validate(schemaGetMetricsThroughput), asyncHandler(metricsController.getMetricsThroughput));
router.get('/time-stats', validate(schemaGetMetricsTimeStats), asyncHandler(metricsController.getMetricsTimeStats));
router.get('/status-time', validate(schemaGetMetricsStatusTime), asyncHandler(metricsController.getMetricsStatusTime));
router.get('/workload', validate(schemaGetMetricsWorkload), asyncHandler(metricsController.getMetricsWorkload));
router.get('/distribution', validate(schemaGetMetricsDistribution), asyncHandler(metricsController.getMetricsDistribution));
router.get('/process-time', validate(schemaGetMetricsProcessTime), asyncHandler(metricsController.getMetricsProcessTime));


module.exports = { metricsRouter: router };