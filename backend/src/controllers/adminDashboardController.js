// backend/src/controllers/adminDashboardController.js
const pool = require("../config/database");

function enrolledStatuses() {
  // keep in-sync with your reports logic
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

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase();
}

// GET /api/admin/dashboard/summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const enrolled = enrolledStatuses();

    // ---------------- USERS ----------------
    const [roleRows] = await pool.execute(
      `SELECT UPPER(role) AS role, COUNT(*) AS count
       FROM users
       GROUP BY UPPER(role)`,
    );

    const roles = {};
    for (const r of roleRows)
      roles[normalizeRole(r.role)] = Number(r.count) || 0;

    const totalUsers = Object.values(roles).reduce((a, b) => a + b, 0);
    const totalStudents = (roles.USER || 0) + (roles.STUDENT || 0);

    // ---------------- COURSES ----------------
    const [[drivingCourses]] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN LOWER(status)='active' THEN 1 ELSE 0 END) AS active
       FROM courses`,
    );

    const [[tesdaCourses]] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN LOWER(status)='active' THEN 1 ELSE 0 END) AS active
       FROM tesda_courses`,
    );

    // ---------------- RESERVATIONS STATUS COUNTS ----------------
    const [drivingStatusRows] = await pool.execute(
      `SELECT UPPER(reservation_status) AS status, COUNT(*) AS count
       FROM schedule_reservations
       GROUP BY UPPER(reservation_status)`,
    );

    const [tesdaStatusRows] = await pool.execute(
      `SELECT UPPER(reservation_status) AS status, COUNT(*) AS count
       FROM tesda_schedule_reservations
       GROUP BY UPPER(reservation_status)`,
    );

    function collapseStatus(rows) {
      const map = {};
      for (const r of rows)
        map[String(r.status || "").toUpperCase()] = Number(r.count) || 0;
      return map;
    }

    const drivingByStatus = collapseStatus(drivingStatusRows);
    const tesdaByStatus = collapseStatus(tesdaStatusRows);

    const pendingDriving = drivingByStatus.PENDING || 0;
    const pendingTesda = tesdaByStatus.PENDING || 0;
    const pendingTotal = pendingDriving + pendingTesda;

    // ---------------- PAYMENTS ----------------
    const [[payCounts]] = await pool.execute(
      `SELECT
         SUM(CASE WHEN UPPER(status)='FOR_VERIFICATION' THEN 1 ELSE 0 END) AS for_verification,
         SUM(CASE WHEN UPPER(status) IN ('PAID','VERIFIED') THEN 1 ELSE 0 END) AS paid_count,
         COALESCE(SUM(CASE WHEN UPPER(status) IN ('PAID','VERIFIED') THEN amount_centavos ELSE 0 END), 0) AS paid_centavos
       FROM student_payment_submissions`,
    );

    // ---------------- RECENT ACTIVITY ----------------
    // IMPORTANT: TESDA course is derived from tesda_schedules.course_id (NOT reservation table)
    const [recent] = await pool.execute(
      `(
        SELECT
          'DRIVING' AS track,
          sr.reservation_id AS id,
          sr.created_at,
          UPPER(sr.reservation_status) AS status,
          u.fullname AS student_name,
          c.course_name,
          DATE(s.schedule_date) AS schedule_date,
          s.start_time,
          s.end_time
        FROM schedule_reservations sr
        LEFT JOIN users u ON u.id = sr.student_id
        LEFT JOIN courses c ON c.id = sr.course_id
        LEFT JOIN schedules s ON s.schedule_id = sr.schedule_id
      )
      UNION ALL
      (
        SELECT
          'TESDA' AS track,
          tr.reservation_id AS id,
          tr.created_at,
          UPPER(tr.reservation_status) AS status,
          u.fullname AS student_name,
          tc.course_name,
          DATE(ts.schedule_date) AS schedule_date,
          ts.start_time,
          ts.end_time
        FROM tesda_schedule_reservations tr
        LEFT JOIN users u ON u.id = tr.student_id
        LEFT JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
        LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      )
      ORDER BY created_at DESC
      LIMIT 100`,
    );

    // ---------------- MONTHLY TRENDS ----------------
    const labels = lastNMonthsLabels(12);
    const fromMonth = labels[0] + "-01";
    const inPlaceholders = enrolled.map(() => "?").join(",");

    const [drivingMonthly] = await pool.execute(
      `SELECT ${monthKeyExpr("sr.created_at")} AS ym, COUNT(*) AS count
       FROM schedule_reservations sr
       WHERE sr.created_at >= ?
         AND UPPER(sr.reservation_status) IN (${inPlaceholders})
       GROUP BY ym
       ORDER BY ym ASC`,
      [fromMonth, ...enrolled],
    );

    const [tesdaMonthly] = await pool.execute(
      `SELECT ${monthKeyExpr("tr.created_at")} AS ym, COUNT(*) AS count
       FROM tesda_schedule_reservations tr
       WHERE tr.created_at >= ?
         AND UPPER(tr.reservation_status) IN (${inPlaceholders})
       GROUP BY ym
       ORDER BY ym ASC`,
      [fromMonth, ...enrolled],
    );

    function toSeries(rows) {
      const m = {};
      for (const r of rows) m[String(r.ym)] = Number(r.count) || 0;
      return labels.map((k) => m[k] || 0);
    }

    const drivingSeries = toSeries(drivingMonthly);
    const tesdaSeries = toSeries(tesdaMonthly);

    // ---------------- STATUS DISTRIBUTION (combined) ----------------
    const combinedByStatus = {};
    for (const [k, v] of Object.entries(drivingByStatus)) {
      combinedByStatus[k] = (combinedByStatus[k] || 0) + (Number(v) || 0);
    }
    for (const [k, v] of Object.entries(tesdaByStatus)) {
      combinedByStatus[k] = (combinedByStatus[k] || 0) + (Number(v) || 0);
    }

    const buckets = {
      ENROLLED: 0,
      PENDING: 0,
      REJECTED: 0,
      CANCELLED: 0,
      OTHER: 0,
    };
    for (const [st, count] of Object.entries(combinedByStatus)) {
      const c = Number(count) || 0;
      if (!st) buckets.OTHER += c;
      else if (st === "PENDING") buckets.PENDING += c;
      else if (st === "REJECTED") buckets.REJECTED += c;
      else if (st === "CANCELLED" || st === "CANCELED") buckets.CANCELLED += c;
      else if (enrolled.includes(st)) buckets.ENROLLED += c;
      else buckets.OTHER += c;
    }

    // ---------------- UPCOMING SCHEDULES ----------------
    const [[upDriving]] = await pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM schedules
       WHERE schedule_date IS NOT NULL
         AND schedule_date >= CURDATE()
         AND (status <> 'closed' OR status = '' OR status IS NULL)`,
    );

    const [[upTesda]] = await pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM tesda_schedules
       WHERE schedule_date IS NOT NULL
         AND schedule_date >= CURDATE()
         AND (status <> 'closed' OR status = '' OR status IS NULL)`,
    );

    const upcoming = {
      driving: Number(upDriving.cnt) || 0,
      tesda: Number(upTesda.cnt) || 0,
      total: (Number(upDriving.cnt) || 0) + (Number(upTesda.cnt) || 0),
    };

    // ---------------- TOP COURSES THIS MONTH ----------------
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const monthStartISO = monthStart.toISOString().slice(0, 10);
    const nextMonthISO = nextMonthStart.toISOString().slice(0, 10);

    const [topDriving] = await pool.execute(
      `SELECT
         c.id AS course_id,
         c.course_name,
         COUNT(*) AS reservations
       FROM schedule_reservations sr
       JOIN courses c ON c.id = sr.course_id
       WHERE sr.created_at >= ?
         AND sr.created_at < ?
         AND UPPER(sr.reservation_status) <> 'CANCELLED'
       GROUP BY c.id, c.course_name
       ORDER BY reservations DESC
       LIMIT 5`,
      [monthStartISO, nextMonthISO],
    );

    const [topTesda] = await pool.execute(
      `SELECT
         tc.id AS course_id,
         tc.course_name,
         COUNT(*) AS reservations
       FROM tesda_schedule_reservations tr
       JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
       JOIN tesda_courses tc ON tc.id = ts.course_id
       WHERE tr.created_at >= ?
         AND tr.created_at < ?
         AND UPPER(tr.reservation_status) <> 'CANCELLED'
       GROUP BY tc.id, tc.course_name
       ORDER BY reservations DESC
       LIMIT 5`,
      [monthStartISO, nextMonthISO],
    );

    return res.json({
      status: "success",
      data: {
        users: {
          total: totalUsers,
          by_role: roles,
          students: totalStudents,
          instructors: roles.INSTRUCTOR || 0,
          trainers: roles.TRAINER || 0,
          admins: roles.ADMIN || 0,
        },
        courses: {
          driving: {
            total: Number(drivingCourses.total) || 0,
            active: Number(drivingCourses.active) || 0,
          },
          tesda: {
            total: Number(tesdaCourses.total) || 0,
            active: Number(tesdaCourses.active) || 0,
          },
        },
        reservations: {
          pending_total: pendingTotal,
          pending_driving: pendingDriving,
          pending_tesda: pendingTesda,
          by_status: combinedByStatus,
          buckets,
        },
        payments: {
          for_verification: Number(payCounts.for_verification) || 0,
          paid_count: Number(payCounts.paid_count) || 0,
          paid_amount_peso: (Number(payCounts.paid_centavos) || 0) / 100,
        },
        trends: {
          labels,
          driving: drivingSeries,
          tesda: tesdaSeries,
        },
        upcoming_schedules: upcoming,
        top_courses: {
          month_start: monthStartISO,
          next_month_start: nextMonthISO,
          driving: topDriving,
          tesda: topTesda,
        },
        recent,
      },
    });
  } catch (err) {
    console.error("getDashboardSummary error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load dashboard",
    });
  }
};
