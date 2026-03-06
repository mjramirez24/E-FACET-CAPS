// backend/src/controllers/tesdaStudentDashboardSummaryController.js
const pool = require("../config/database");

function getSessionUserId(req) {
  const v = req?.session?.user_id ?? req?.session?.userId ?? req?.session?.id;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function enrolledStatuses() {
  return ["CONFIRMED", "APPROVED", "ACTIVE", "DONE", "COMPLETED", "FINISHED"];
}

exports.getTesdaStudentDashboardSummary = async (req, res) => {
  try {
    const role = String(req.session.role || "").toLowerCase();
    // TESDA student normally role = "student"
    if (role !== "student") {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Student role required.",
      });
    }

    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const enrolled = enrolledStatuses();
    const inPlaceholders = enrolled.map(() => "?").join(",");

    const [userRows] = await pool.execute(
      `SELECT id, fullname, username, role FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );
    const me = userRows?.[0] || null;

    // status counts
    const [statusRows] = await pool.execute(
      `SELECT UPPER(reservation_status) AS status, COUNT(*) AS count
       FROM tesda_schedule_reservations
       WHERE student_id = ?
       GROUP BY UPPER(reservation_status)`,
      [userId],
    );

    const byStatus = {};
    for (const r of statusRows || []) {
      byStatus[String(r.status || "").toUpperCase()] = Number(r.count) || 0;
    }

    const stats = {
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      pending: byStatus.PENDING || 0,
      enrolled:
        (byStatus.CONFIRMED || 0) +
        (byStatus.APPROVED || 0) +
        (byStatus.ACTIVE || 0),
      done: byStatus.DONE || 0,
      cancelled: byStatus.CANCELLED || 0,
    };

    // upcoming (course is from tesda_schedules.course_id)
    const [upcoming] = await pool.execute(
      `SELECT
         tr.reservation_id AS id,
         UPPER(tr.reservation_status) AS status,
         tc.course_name,
         DATE(ts.schedule_date) AS schedule_date,
         ts.start_time,
         ts.end_time,
         tu.fullname AS trainer_name
       FROM tesda_schedule_reservations tr
       JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
       LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
       LEFT JOIN users tu ON tu.id = ts.trainer_id
       WHERE tr.student_id = ?
         AND ts.schedule_date IS NOT NULL
         AND ts.schedule_date >= CURDATE()
         AND UPPER(tr.reservation_status) IN (${inPlaceholders})
       ORDER BY ts.schedule_date ASC, ts.start_time ASC
       LIMIT 20`,
      [userId, ...enrolled],
    );

    // top courses this month (my)
    const [topCourses] = await pool.execute(
      `SELECT
         tc.id AS course_id,
         tc.course_name,
         COUNT(*) AS reservations
       FROM tesda_schedule_reservations tr
       JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
       JOIN tesda_courses tc ON tc.id = ts.course_id
       WHERE tr.student_id = ?
         AND tr.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND UPPER(tr.reservation_status) <> 'CANCELLED'
       GROUP BY tc.id, tc.course_name
       ORDER BY reservations DESC, tc.course_name ASC
       LIMIT 5`,
      [userId],
    );

    // certificates tesda
    const [[certAgg]] = await pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM certificates cert
       JOIN tesda_schedule_reservations tr ON tr.reservation_id = cert.reservation_id
       WHERE cert.certificate_type = 'TESDA'
         AND cert.status = 'issued'
         AND tr.student_id = ?`,
      [userId],
    );

    // recent activity
    const [recent] = await pool.execute(
      `SELECT
         tr.reservation_id AS id,
         tr.created_at,
         UPPER(tr.reservation_status) AS status,
         tc.course_name,
         DATE(ts.schedule_date) AS schedule_date,
         ts.start_time,
         ts.end_time
       FROM tesda_schedule_reservations tr
       LEFT JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
       LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
       WHERE tr.student_id = ?
       ORDER BY tr.created_at DESC
       LIMIT 300`,
      [userId],
    );

    return res.json({
      status: "success",
      data: {
        user: me,
        stats,
        upcoming,
        topCourses,
        certificates: { issued: Number(certAgg?.cnt) || 0 },
        recent,
      },
    });
  } catch (err) {
    console.error("getTesdaStudentDashboardSummary error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to load TESDA dashboard" });
  }
};
