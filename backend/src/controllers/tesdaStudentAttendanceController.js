// backend/src/controllers/tesdaStudentAttendanceController.js
const pool = require("../config/database");

function getSessionUserId(req) {
  const v =
    req?.session?.user?.user_id ??
    req?.session?.user?.id ??
    req?.session?.user_id ??
    req?.session?.userId;

  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalizeStatus(status) {
  const s = String(status || "")
    .toLowerCase()
    .trim();
  if (["present", "late", "absent", "excused", "unmarked"].includes(s)) {
    return s;
  }
  return "unmarked";
}

function monthLabel(ym) {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || "";
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

exports.getMyTesdaAttendance = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const role = String(
      req?.session?.user?.role || req?.session?.role || "",
    ).toLowerCase();

    if (role && role !== "user" && role !== "student") {
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
      });
    }

    const [rows] = await pool.execute(
      `
      SELECT
        a.attendance_id,
        DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date,
        COALESCE(a.course_name, tc.course_name, 'TESDA Training') AS course_name,
        COALESCE(a.course_code, tc.course_code, '') AS course_code,
        LOWER(COALESCE(a.status, 'unmarked')) AS status,
        COALESCE(a.remarks, '') AS remarks,

        TIME_FORMAT(sl.start_time, '%h:%i %p') AS start_time,
        TIME_FORMAT(sl.end_time, '%h:%i %p') AS end_time,

        TRIM(
          CONCAT(
            COALESCE(t.firstname, ''),
            CASE
              WHEN COALESCE(t.firstname, '') <> '' AND COALESCE(t.lastname, '') <> '' THEN ' '
              ELSE ''
            END,
            COALESCE(t.lastname, '')
          )
        ) AS trainer_name
      FROM tesda_trainer_attendance a
      LEFT JOIN tesda_courses tc
        ON tc.id = a.course_id
      LEFT JOIN (
        SELECT
          r.student_id,
          s.course_id,
          s.schedule_date,
          MIN(s.start_time) AS start_time,
          MAX(s.end_time) AS end_time,
          MAX(s.trainer_id) AS trainer_id
        FROM tesda_schedule_reservations r
        JOIN tesda_schedules s
          ON s.schedule_id = r.schedule_id
        WHERE r.student_id = ?
        GROUP BY r.student_id, s.course_id, s.schedule_date
      ) sl
        ON sl.student_id = a.student_id
       AND COALESCE(sl.course_id, 0) = COALESCE(a.course_id, 0)
       AND sl.schedule_date = a.attendance_date
      LEFT JOIN trainers t
        ON t.trainer_id = sl.trainer_id
      WHERE a.student_id = ?
      ORDER BY a.attendance_date DESC, course_name ASC
      `,
      [userId, userId],
    );

    const records = (rows || []).map((r) => {
      const status = normalizeStatus(r.status);

      return {
        id: Number(r.attendance_id),
        date: r.attendance_date,
        training: r.course_name || "TESDA Training",
        course_code: r.course_code || "",
        time:
          r.start_time && r.end_time
            ? `${r.start_time} - ${r.end_time}`
            : r.start_time || r.end_time || "—",
        status,
        remarks: r.remarks || "—",
        trainer: r.trainer_name || "TESDA Trainer",
      };
    });

    const stats = {
      totalTrainings: records.length,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      unmarked: 0,
      attendanceRate: 0,
    };

    for (const r of records) {
      const st = normalizeStatus(r.status);
      if (stats[st] === undefined) stats[st] = 0;
      stats[st] += 1;
    }

    const attended = stats.present + stats.late + stats.excused;
    stats.attendanceRate =
      stats.totalTrainings > 0
        ? Math.round((attended / stats.totalTrainings) * 100)
        : 0;

    const trainingSet = new Set();
    for (const r of records) {
      if (r.training) trainingSet.add(r.training);
    }

    const monthMap = {};
    for (const r of records) {
      const ym = String(r.date || "").slice(0, 7);
      if (!ym) continue;

      if (!monthMap[ym]) {
        monthMap[ym] = {
          monthKey: ym,
          month: monthLabel(ym),
          total: 0,
          attended: 0,
        };
      }

      monthMap[ym].total += 1;
      if (["present", "late", "excused"].includes(r.status)) {
        monthMap[ym].attended += 1;
      }
    }

    const monthlySummary = Object.values(monthMap)
      .sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1))
      .map((m) => ({
        month: m.month,
        monthKey: m.monthKey,
        total: m.total,
        attended: m.attended,
        rate: m.total > 0 ? Math.round((m.attended / m.total) * 100) : 0,
      }));

    return res.json({
      status: "success",
      data: {
        records,
        trainings: Array.from(trainingSet).sort((a, b) => a.localeCompare(b)),
        stats,
        monthlySummary,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("getMyTesdaAttendance error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load TESDA attendance",
      debug: err.sqlMessage || err.message,
    });
  }
};
