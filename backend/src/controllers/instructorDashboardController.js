// backend/src/controllers/instructorDashboardController.js
const pool = require("../config/database");

function enrolledStatuses() {
  return ["CONFIRMED", "APPROVED", "ACTIVE", "DONE", "COMPLETED", "FINISHED"];
}
function monthKeyExpr(sqlDateExpr) {
  return `DATE_FORMAT(${sqlDateExpr}, '%Y-%m')`;
}
function lastNMonthsLabels(n = 12) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}`);
  }
  return out;
}
function getSessionUserId(req) {
  const v = req?.session?.user_id ?? req?.session?.userId ?? req?.session?.id;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
async function resolveInstructorIdFromUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT instructor_id FROM instructors WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  return rows.length ? Number(rows[0].instructor_id) : null;
}

// GET /api/instructor/dashboard/summary
exports.getInstructorDashboardSummary = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    // driving schedules use instructors.instructor_id
    const instructorId = await resolveInstructorIdFromUserId(userId);
    if (!instructorId) {
      return res.status(403).json({
        status: "error",
        message: "Instructor not mapped (instructors.user_id missing).",
      });
    }

    const enrolled = enrolledStatuses();

    // ---------------- STATS ----------------
    const [[assignedCourses]] = await pool.execute(
      `SELECT COUNT(DISTINCT course_id) AS cnt
       FROM schedules
       WHERE instructor_id = ?`,
      [instructorId],
    );

    const [[upcomingSchedules]] = await pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM schedules
       WHERE instructor_id = ?
         AND schedule_date IS NOT NULL
         AND schedule_date >= CURDATE()
         AND (status <> 'closed' OR status = '' OR status IS NULL)`,
      [instructorId],
    );

    const [[pendingReservations]] = await pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM schedule_reservations sr
       JOIN schedules s ON s.schedule_id = sr.schedule_id
       WHERE s.instructor_id = ?
         AND UPPER(sr.reservation_status) = 'PENDING'`,
      [instructorId],
    );

    const inPlaceholders = enrolled.map(() => "?").join(",");
    const [[studentsHandled]] = await pool.execute(
      `SELECT COUNT(DISTINCT sr.student_id) AS cnt
       FROM schedule_reservations sr
       JOIN schedules s ON s.schedule_id = sr.schedule_id
       WHERE s.instructor_id = ?
         AND UPPER(sr.reservation_status) IN (${inPlaceholders})`,
      [instructorId, ...enrolled],
    );

    // ---------------- RECENT RESERVATIONS (driving only for instructor) ----------------
    const [recent] = await pool.execute(
      `SELECT
         sr.reservation_id AS id,
         sr.created_at,
         UPPER(sr.reservation_status) AS status,
         u.fullname AS student_name,
         c.course_name,
         DATE(s.schedule_date) AS schedule_date,
         s.start_time,
         s.end_time
       FROM schedule_reservations sr
       JOIN schedules s ON s.schedule_id = sr.schedule_id
       LEFT JOIN users u ON u.id = sr.student_id
       LEFT JOIN courses c ON c.id = sr.course_id
       WHERE s.instructor_id = ?
       ORDER BY sr.created_at DESC
       LIMIT 200`,
      [instructorId],
    );

    // ---------------- TOP COURSES THIS MONTH ----------------
    const [topCourses] = await pool.execute(
      `SELECT
         c.id AS course_id,
         c.course_name,
         COUNT(*) AS reservations
       FROM schedule_reservations sr
       JOIN schedules s ON s.schedule_id = sr.schedule_id
       JOIN courses c ON c.id = sr.course_id
       WHERE s.instructor_id = ?
         AND sr.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
       GROUP BY c.id, c.course_name
       ORDER BY reservations DESC, c.course_name ASC
       LIMIT 5`,
      [instructorId],
    );

    // ---------------- UPCOMING SCHEDULE LIST ----------------
    const [upcomingList] = await pool.execute(
      `SELECT
         s.schedule_id,
         s.course_id,
         c.course_name,
         s.schedule_date,
         s.start_time,
         s.end_time,
         s.total_slots,
         (SELECT COUNT(*) FROM schedule_reservations sr WHERE sr.schedule_id = s.schedule_id) AS reserved_count,
         s.status
       FROM schedules s
       LEFT JOIN courses c ON c.id = s.course_id
       WHERE s.instructor_id = ?
         AND s.schedule_date IS NOT NULL
         AND s.schedule_date >= CURDATE()
       ORDER BY s.schedule_date ASC, s.start_time ASC
       LIMIT 200`,
      [instructorId],
    );

    // ---------------- MONTHLY TRENDS (last 12 months) ----------------
    const labels = lastNMonthsLabels(12);
    const fromMonth = labels[0] + "-01";

    const [monthly] = await pool.execute(
      `SELECT ${monthKeyExpr("sr.created_at")} AS ym, COUNT(*) AS count
       FROM schedule_reservations sr
       JOIN schedules s ON s.schedule_id = sr.schedule_id
       WHERE s.instructor_id = ?
         AND sr.created_at >= ?
         AND UPPER(sr.reservation_status) IN (${inPlaceholders})
       GROUP BY ym
       ORDER BY ym ASC`,
      [instructorId, fromMonth, ...enrolled],
    );

    const map = {};
    for (const r of monthly || []) map[String(r.ym)] = Number(r.count) || 0;
    const series = labels.map((k) => map[k] || 0);

    // ---------------- STATUS BUCKETS ----------------
    const [statusRows] = await pool.execute(
      `SELECT UPPER(sr.reservation_status) AS status, COUNT(*) AS count
       FROM schedule_reservations sr
       JOIN schedules s ON s.schedule_id = sr.schedule_id
       WHERE s.instructor_id = ?
       GROUP BY UPPER(sr.reservation_status)`,
      [instructorId],
    );

    const byStatus = {};
    for (const r of statusRows || []) {
      byStatus[String(r.status || "").toUpperCase()] = Number(r.count) || 0;
    }

    const buckets = {
      ENROLLED: 0,
      PENDING: 0,
      REJECTED: 0,
      CANCELLED: 0,
      OTHER: 0,
    };
    for (const [st, count] of Object.entries(byStatus)) {
      const c = Number(count) || 0;
      if (!st) buckets.OTHER += c;
      else if (st === "PENDING") buckets.PENDING += c;
      else if (st === "REJECTED") buckets.REJECTED += c;
      else if (st === "CANCELLED" || st === "CANCELED") buckets.CANCELLED += c;
      else if (enrolled.includes(st)) buckets.ENROLLED += c;
      else buckets.OTHER += c;
    }

    return res.json({
      status: "success",
      data: {
        stats: {
          assignedCourses: Number(assignedCourses.cnt) || 0,
          upcomingSchedules: Number(upcomingSchedules.cnt) || 0,
          pendingReservations: Number(pendingReservations.cnt) || 0,
          studentsHandled: Number(studentsHandled.cnt) || 0,
        },
        topCourses: topCourses || [],
        upcoming: upcomingList || [],
        recent: recent || [],
        trends: { labels, series },
        buckets,
      },
    });
  } catch (err) {
    console.error("getInstructorDashboardSummary error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load instructor dashboard",
      debug: err.sqlMessage || err.message,
    });
  }
};
