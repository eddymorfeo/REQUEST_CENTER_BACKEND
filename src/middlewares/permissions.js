const { AppError } = require("../utils/appError");
const { HttpStatus } = require("../utils/httpStatus");

/**
 * ✅ ADMIN only, usando roleCode del JWT
 */
const requireAdmin = (req, _res, next) => {
  const roleCode = req?.auth?.roleCode;
  if (roleCode !== "ADMIN") {
    return next(new AppError("Forbidden (ADMIN only)", HttpStatus.FORBIDDEN));
  }
  return next();
};

/**
 * ✅ Permite: ADMIN o el usuario actualmente asignado a la request
 * - ADMIN se valida por JWT
 * - Para assignee igual hay que consultar asignación activa (DB), pero NO user/role.
 */
const { pool } = require("../configs/db");

const requireAdminOrAssignee = async (req, _res, next) => {
  try {
    const userId = req?.auth?.sub;
    const roleCode = req?.auth?.roleCode;

    if (!userId) {
      return next(new AppError("Unauthorized", HttpStatus.UNAUTHORIZED));
    }

    if (roleCode === "ADMIN") {
      return next();
    }

    const requestId = req.params.requestId || req.params.id;
    if (!requestId) {
      return next(new AppError("requestId is required", HttpStatus.BAD_REQUEST));
    }

    const { rows } = await pool.query(
      `
      select assigned_to
      from request_assignments
      where request_id = $1
        and is_active = true
        and unassigned_at is null
      order by assigned_at desc
      limit 1
      `,
      [requestId]
    );

    const active = rows[0];
    if (!active) {
      return next(new AppError("No active assignment", HttpStatus.FORBIDDEN));
    }

    if (active.assigned_to !== userId) {
      return next(new AppError("Forbidden", HttpStatus.FORBIDDEN));
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  requireAdmin,
  requireAdminOrAssignee,
};
