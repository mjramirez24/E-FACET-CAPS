// backend/src/controllers/tesdaStudentDashboardSummaryController.js
const pool = require("../config/database");

// ─────────────────────────────────────────────────────────────────────────────
// Session stores user info nested: req.session.user.user_id
// (confirmed via /api/debug/session: { user: { user_id: 93, ... } })
// ─────────────────────────────────────────────────────────────────────────────
function getSessionUserId(req) {
  const v =
    req?.session?.user?.user_id ??
    req?.session?.user?.id ??
    req?.session?.user_id ??
    req?.session?.userId;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function enrolledStatuses() {
  return ["CONFIRMED", "APPROVED", "ACTIVE", "DONE", "COMPLETED", "FINISHED"];
}

function normalizeAttendanceStatus(status) {
  const s = String(status || "")
    .toLowerCase()
    .trim();
  if (["present", "late", "absent", "excused", "unmarked"].includes(s)) {
    return s;
  }
  return "unmarked";
}

function computeAttendanceStats(rows = []) {
  const stats = {
    comingSoon: false,
    totalSessions: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    unmarked: 0,
    rate: 0,
  };

  stats.totalSessions = rows.length;

  for (const row of rows) {
    const s = normalizeAttendanceStatus(row.status);

    if (s === "present") stats.present += 1;
    else if (s === "late") stats.late += 1;
    else if (s === "absent") stats.absent += 1;
    else if (s === "excused") stats.excused += 1;
    else stats.unmarked += 1;
  }

  const attended = stats.present + stats.late + stats.excused;
  stats.rate =
    stats.totalSessions > 0
      ? Math.round((attended / stats.totalSessions) * 100)
      : 0;

  return stats;
}

exports.getTesdaStudentDashboardSummary = async (req, res) => {
  try {
    // TESDA students: role="user", track_code="tesda"
    const trackCode = String(
      req?.session?.user?.track_code || "",
    ).toLowerCase();
    const role = String(
      req?.session?.user?.role || req?.session?.role || "",
    ).toLowerCase();

    const isTesdaStudent =
      trackCode === "tesda" || role === "student" || role === "user";
    if (!isTesdaStudent) {
      return res
        .status(403)
        .json({ status: "error", message: "Access denied." });
    }

    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const enrolled = enrolledStatuses();
    const inPlaceholders = enrolled.map(() => "?").join(",");

    // ── User (from session — no extra DB call needed) ─────────────────────
    const me = {
      id: userId,
      fullname: req?.session?.user?.fullname || null,
      username: req?.session?.user?.username || null,
      role: req?.session?.user?.role || null,
    };

    // ── Status counts ─────────────────────────────────────────────────────
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
      done:
        (byStatus.DONE || 0) +
        (byStatus.COMPLETED || 0) +
        (byStatus.FINISHED || 0),
      cancelled: byStatus.CANCELLED || 0,
    };

    // ── Currently enrolled course (yellow KPI card) ───────────────────────
    const [enrolledCourseRows] = await pool.execute(
      `SELECT
         tc.course_name,
         tc.course_code,
         UPPER(tr.reservation_status) AS status
       FROM tesda_schedule_reservations tr
       JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
       JOIN tesda_courses tc   ON tc.id = ts.course_id
       WHERE tr.student_id = ?
         AND UPPER(tr.reservation_status) IN ('CONFIRMED','APPROVED','ACTIVE')
       ORDER BY tr.created_at DESC
       LIMIT 1`,
      [userId],
    );
    const currentEnrollment = enrolledCourseRows?.[0] || null;

    // ── Upcoming sessions ─────────────────────────────────────────────────
    const [upcoming] = await pool.execute(
      `SELECT
         tr.reservation_id AS id,
         UPPER(tr.reservation_status) AS status,
         tc.course_name,
         tc.course_code,
         DATE(ts.schedule_date) AS schedule_date,
         ts.start_time,
         ts.end_time,
         CONCAT(t.firstname, ' ', t.lastname) AS trainer_name
       FROM tesda_schedule_reservations tr
       JOIN tesda_schedules ts    ON ts.schedule_id = tr.schedule_id
       LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
       LEFT JOIN trainers t       ON t.trainer_id = ts.trainer_id
       WHERE tr.student_id = ?
         AND ts.schedule_date IS NOT NULL
         AND ts.schedule_date >= CURDATE()
         AND UPPER(tr.reservation_status) IN (${inPlaceholders})
       ORDER BY ts.schedule_date ASC, ts.start_time ASC
       LIMIT 20`,
      [userId, ...enrolled],
    );

    // ── Top courses this month ────────────────────────────────────────────
    const [topCourses] = await pool.execute(
      `SELECT
         tc.id AS course_id,
         tc.course_name,
         COUNT(*) AS reservations
       FROM tesda_schedule_reservations tr
       JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
       JOIN tesda_courses tc   ON tc.id = ts.course_id
       WHERE tr.student_id = ?
         AND tr.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND UPPER(tr.reservation_status) <> 'CANCELLED'
       GROUP BY tc.id, tc.course_name
       ORDER BY reservations DESC, tc.course_name ASC
       LIMIT 5`,
      [userId],
    );

    // ── Certificates ──────────────────────────────────────────────────────
    const [[certAgg]] = await pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM certificates cert
       JOIN tesda_schedule_reservations tr ON tr.reservation_id = cert.reservation_id
       WHERE cert.certificate_type = 'TESDA'
         AND cert.status = 'issued'
         AND tr.student_id = ?`,
      [userId],
    );

    // ── Attendance (LIVE from tesda_trainer_attendance) ───────────────────
    let attendance = {
      comingSoon: false,
      totalSessions: 0,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      unmarked: 0,
      rate: 0,
    };

    try {
      const [attendanceRows] = await pool.execute(
        `SELECT LOWER(COALESCE(status, 'unmarked')) AS status
         FROM tesda_trainer_attendance
         WHERE student_id = ?`,
        [userId],
      );

      attendance = computeAttendanceStats(attendanceRows || []);
    } catch (attendanceErr) {
      console.error("TESDA dashboard attendance query error:", attendanceErr);
      attendance = {
        comingSoon: false,
        totalSessions: 0,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        unmarked: 0,
        rate: 0,
      };
    }

    // ── Recent activity ───────────────────────────────────────────────────
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
       LEFT JOIN tesda_courses tc   ON tc.id = ts.course_id
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
        currentEnrollment,
        upcoming,
        topCourses,
        certificates: { issued: Number(certAgg?.cnt) || 0 },
        attendance,
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
