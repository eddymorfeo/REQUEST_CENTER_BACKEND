const express = require('express');
const { userRouter } = require('./userRoutes');
const { roleRouter } = require('./roleRoutes');
const { comunaRouter } = require('./comunaRoutes');
const { userRoleRouter } = require('./userRoleRoutes');
const { authRouter } = require('./authRoutes');
const { requireAuth } = require('../middlewares/auth');
const { requestTypeRouter } = require('./requestTypeRoutes');
const { requestPriorityRouter } = require('./requestPriorityRoutes');
const { requestStatusRouter } = require('./requestStatusRoutes');
const { requestRouter } = require('./requestRoutes');
const { boardRouter } = require('./boardRoutes');
const { requestCommentsRouter } = require('./requestCommentsRoutes');
const { requestAttachmentsRouter } = require('./requestAttachmentsRoutes');
const { requestStatusHistoryRouter } = require('./requestStatusHistoryRoutes');
const { requestAssignmentsRouter } = require('./requestAssignmentsRoutes');
const { boardEventsRouter } = require('./boardEventsRoutes');

const router = express.Router();

// No requiere token
router.use('/auth', authRouter);

// Requiere token
router.use('/users', requireAuth, userRouter);
router.use('/roles', requireAuth, roleRouter);
router.use('/comunas', requireAuth, comunaRouter);
router.use('/user-roles', requireAuth, userRoleRouter);
router.use('/request-types', requireAuth, requestTypeRouter);
router.use('/request-priorities', requireAuth, requestPriorityRouter);
router.use('/request-status', requireAuth, requestStatusRouter);
router.use('/requests', requireAuth, requestRouter);
router.use('/board', requireAuth, boardRouter);
router.use('/request-comments', requireAuth, requestCommentsRouter);
router.use('/request-attachments', requireAuth, requestAttachmentsRouter);
router.use('/request-status-history', requireAuth, requestStatusHistoryRouter);
router.use('/request-assignments', requireAuth, requestAssignmentsRouter);
router.use('/board-events', requireAuth, boardEventsRouter);

module.exports = { apiRouter: router };
