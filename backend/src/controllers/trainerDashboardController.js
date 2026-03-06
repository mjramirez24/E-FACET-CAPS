// backend/src/controllers/trainerDashboardController.js
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
async function resolveTrainerIdFromUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT trainer_id FROM trainers WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  return rows.length ? Number(rows[0].trainer_id) : null;
}

// GET /api/trainer/dashboard/summary
exports.getTrainerDashboardSummary = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const trainerId = await resolveTrainerIdFromUserId(userId);
    if (!trainerId) {
      return res.status(403).json({
        status: "error",
        message: "Trainer not mapped (trainers.user_id missing).",
      });
    }

    const enrolled = enrolledStatuses();
    const inPlaceholders = enrolled.map(() => "?").join(",");

    // ---------------- STATS ----------------
    const [[assignedCourses]] = await pool.execute(
      `SELECT COUNT(DISTINCT course_id) AS cnt
       FROM tesda_schedules
       WHERE trainer_id = ?`,
      [trainerId],
    );

    const [[upcomingSchedules]] = await pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM tesda_schedules
       WHERE trainer_id = ?
         AND schedule_date IS NOT NULL
         AND schedule_date >= CURDATE()
         AND (status <> 'closed' OR status = '' OR status IS NULL)`,
      [trainerId],
    );

    const [[totalTrainees]] = await pool.execute(
      `SELECT COUNT(DISTINCT tr.student_id) AS cnt
       FROM tesda_schedule_reservations tr
       JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
       WHERE ts.trainer_id = ?
         AND UPPER(tr.reservation_status) IN (${inPlaceholders})`,
      [trainerId, ...enrolled],
    );

    // pending attendance TODAY = students in today's schedules - marked in tesda_trainer_attendance today
    const [[todayStudents]] = await pool.execute(
      `SELECT COUNT(DISTINCT tr.student_id) AS cnt
       FROM tesda_schedule_reservations tr
       JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
       WHERE ts.trainer_id = ?
         AND ts.schedule_date = CURDATE()
         AND UPPER(tr.reservation_status) IN (${inPlaceholders})`,
      [trainerId, ...enrolled],
    );

    const [[todayMarked]] = await pool.execute(
      `SELECT COUNT(DISTINCT student_id) AS cnt
       FROM tesda_trainer_attendance
       WHERE trainer_id = ?
         AND attendance_date = CURDATE()`,
      [trainerId],
    );

    const pendingAttendance = Math.max(
      0,
      (Number(todayStudents.cnt) || 0) - (Number(todayMarked.cnt) || 0),
    );

    // ---------------- RECENT TESDA RESERVATIONS (for trainer schedules) ----------------
    const [recent] = await pool.execute(
      `SELECT
         tr.reservation_id AS id,
         tr.created_at,
         UPPER(tr.reservation_status) AS status,
         u.fullname AS student_name,
         tc.course_name,
         DATE(ts.schedule_date) AS schedule_date,
         ts.start_time,
         ts.end_time
       FROM tesda_schedule_reservations tr
       JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
       LEFT JOIN users u ON u.id = tr.student_id
       LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
       WHERE ts.trainer_id = ?
       ORDER BY tr.created_at DESC
       LIMIT 200`,
      [trainerId],
    );

    // ---------------- TOP COURSES THIS MONTH ----------------
    const [topCourses] = await pool.execute(
      `SELECT
         tc.id AS course_id,
         tc.course_name,
         COUNT(*) AS reservations
       FROM tesda_schedule_reservations tr
       JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
       JOIN tesda_courses tc ON tc.id = ts.course_id
       WHERE ts.trainer_id = ?
         AND tr.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
       GROUP BY tc.id, tc.course_name
       ORDER BY reservations DESC, tc.course_name ASC
       LIMIT 5`,
      [trainerId],
    );

    // ---------------- UPCOMING SCHEDULE LIST ----------------
    const [upcomingList] = await pool.execute(
      `SELECT
         ts.schedule_id,
         ts.course_id,
         tc.course_name,
         ts.schedule_date,
         ts.start_time,
         ts.end_time,
         ts.total_slots,
         (SELECT COUNT(*) FROM tesda_schedule_reservations tr WHERE tr.schedule_id = ts.schedule_id) AS reserved_count,
         ts.status
       FROM tesda_schedules ts
       LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
       WHERE ts.trainer_id = ?
         AND ts.schedule_date IS NOT NULL
         AND ts.schedule_date >= CURDATE()
       ORDER BY ts.schedule_date ASC, ts.start_time ASC
       LIMIT 200`,
      [trainerId],
    );

    // ---------------- MONTHLY TRENDS (last 12 months) ----------------
    const labels = lastNMonthsLabels(12);
    const fromMonth = labels[0] + "-01";

    const [monthly] = await pool.execute(
      `SELECT ${monthKeyExpr("tr.created_at")} AS ym, COUNT(*) AS count
       FROM tesda_schedule_reservations tr
       JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
       WHERE ts.trainer_id = ?
         AND tr.created_at >= ?
         AND UPPER(tr.reservation_status) IN (${inPlaceholders})
       GROUP BY ym
       ORDER BY ym ASC`,
      [trainerId, fromMonth, ...enrolled],
    );

    const map = {};
    for (const r of monthly || []) map[String(r.ym)] = Number(r.count) || 0;
    const series = labels.map((k) => map[k] || 0);

    // ---------------- STATUS BUCKETS ----------------
    const [statusRows] = await pool.execute(
      `SELECT UPPER(tr.reservation_status) AS status, COUNT(*) AS count
       FROM tesda_schedule_reservations tr
       JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
       WHERE ts.trainer_id = ?
       GROUP BY UPPER(tr.reservation_status)`,
      [trainerId],
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
          totalTrainees: Number(totalTrainees.cnt) || 0,
          pendingAttendance,
        },
        topCourses: topCourses || [],
        upcoming: upcomingList || [],
        recent: recent || [],
        trends: { labels, series },
        buckets,
      },
    });
  } catch (err) {
    console.error("getTrainerDashboardSummary error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load trainer dashboard",
      debug: err.sqlMessage || err.message,
    });
  }
};
