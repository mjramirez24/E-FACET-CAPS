// backend/src/controllers/trainerTesdaStudentsController.js
const pool = require("../config/database");

async function listMyTesdaStudents(req, res) {
  try {
    const userId =
      req.user?.user_id ||
      req.user?.id ||
      req.session?.user?.user_id ||
      req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const [trows] = await pool.execute(
      `SELECT trainer_id FROM trainers WHERE user_id = ? LIMIT 1`,
      [userId],
    );

    if (!trows.length) {
      return res
        .status(404)
        .json({ status: "error", message: "Trainer profile not found" });
    }

    const trainerId = trows[0].trainer_id;

    const courseId = Number(req.query.course_id);
    const scheduleId = Number(req.query.schedule_id);

    const where = [`sch.trainer_id = ?`];
    const params = [trainerId];

    if (Number.isFinite(courseId) && courseId > 0) {
      where.push(`sch.course_id = ?`);
      params.push(courseId);
    }

    if (Number.isFinite(scheduleId) && scheduleId > 0) {
      where.push(`sch.schedule_id = ?`);
      params.push(scheduleId);
    }

    const [rows] = await pool.execute(
      `
      SELECT
        u.id AS student_id,
        u.fullname,
        u.email,
        COUNT(DISTINCT r.reservation_id) AS reservations_count,
        MAX(r.updated_at) AS last_activity
      FROM tesda_schedule_reservations r
      INNER JOIN tesda_schedules sch
        ON sch.schedule_id = r.schedule_id
      INNER JOIN users u
        ON u.id = r.student_id
      WHERE ${where.join(" AND ")}
      GROUP BY u.id, u.fullname, u.email
      ORDER BY u.fullname ASC
      `,
      params,
    );

    return res.json({ status: "success", data: rows, total: rows.length });
  } catch (err) {
    console.error("listMyTesdaStudents error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load trainer students",
      debug: {
        code: err.code,
        sqlMessage: err.sqlMessage,
        message: err.message,
      },
    });
  }
}

// ✅ IMPORTANT: THIS MUST MATCH YOUR ROUTE CALL
module.exports = { listMyTesdaStudents };
