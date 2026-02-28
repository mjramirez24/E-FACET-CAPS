// backend/src/controllers/instructorScheduleController.js
const pool = require("../config/database");

// statuses that occupy slot (same as reservationController)
const OCCUPYING_STATUSES = ["PENDING", "CONFIRMED", "APPROVED", "ACTIVE"];

function ph(arr) {
  return arr.map(() => "?").join(",");
}

/**
 * Convert a date-like value to "YYYY-MM-DD"
 * (fallback only, but we mostly return DATE_FORMAT from SQL)
 */
function toYMD(dateLike) {
  if (!dateLike) return "";

  if (dateLike instanceof Date && !Number.isNaN(dateLike.getTime())) {
    const y = dateLike.getFullYear();
    const m = String(dateLike.getMonth() + 1).padStart(2, "0");
    const d = String(dateLike.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const s = String(dateLike).trim();
  if (!s) return "";
  if (s.includes("T")) return s.split("T")[0];
  if (s.includes(" ")) return s.split(" ")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  return "";
}

async function getInstructorIdByUserId(userId) {
  const [insRows] = await pool.execute(
    `SELECT instructor_id, fullname
     FROM instructors
     WHERE user_id = ?
     LIMIT 1`,
    [Number(userId)],
  );

  if (!insRows.length) return null;

  return {
    instructor_id: Number(insRows[0].instructor_id),
    fullname: insRows[0].fullname || "",
  };
}

/**
 * Helper: safe int clamp
 */
function clampInt(n, min, max, fallback) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.min(Math.max(Math.floor(x), min), max);
}

/**
 * GET /api/instructor/schedules/list?page=1&limit=10
 * ✅ ACTIVE LIST = schedules that are TODAY or FUTURE
 * (view-only)
 *
 * Returns:
 *  - id, course, course_code
 *  - date (YYYY-MM-DD), startTime, endTime
 *  - totalSlots, booked
 *  - status
 */
exports.getInstructorSchedulesList = async (req, res) => {
  try {
    const userId = req.session?.user_id;
    if (!userId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not authenticated" });
    }

    const ins = await getInstructorIdByUserId(userId);
    if (!ins) {
      return res.status(404).json({
        status: "error",
        message: "Instructor profile not found for this user",
      });
    }

    const instructorId = ins.instructor_id;

    // pagination (NO placeholders for LIMIT/OFFSET to avoid stmt_execute error)
    const page = clampInt(req.query?.page, 1, 999999, 1);
    const limit = clampInt(req.query?.limit, 1, 50, 10);
    const offset = (page - 1) * limit;

    const placeholders = ph(OCCUPYING_STATUSES);

    // total count (today/future)
    const [cntRows] = await pool.execute(
      `
      SELECT COUNT(*) AS total
      FROM schedules s
      WHERE s.instructor_id = ?
        AND s.schedule_date IS NOT NULL
        AND DATE(s.schedule_date) >= CURDATE()
      `,
      [instructorId],
    );
    const total = Number(cntRows?.[0]?.total || 0);

    const sql = `
      SELECT
        s.schedule_id,
        COALESCE(c.course_name, '(unknown course)') AS course_name,
        c.course_code,

        -- ✅ force YYYY-MM-DD string to avoid Invalid Date
        DATE_FORMAT(s.schedule_date, '%Y-%m-%d') AS schedule_date_ymd,
        TIME_FORMAT(s.start_time, '%H:%i') AS startTime,
        TIME_FORMAT(s.end_time, '%H:%i') AS endTime,

        COALESCE(s.total_slots, 0) AS total_slots,
        LOWER(COALESCE(s.status, 'open')) AS schedule_status,

        COALESCE(b.booked, 0) AS booked
      FROM schedules s
      LEFT JOIN courses c ON c.id = s.course_id

      LEFT JOIN (
        SELECT schedule_id, COUNT(*) AS booked
        FROM schedule_reservations
        WHERE reservation_status IN (${placeholders})
        GROUP BY schedule_id
      ) b ON b.schedule_id = s.schedule_id

      WHERE s.instructor_id = ?
        AND s.schedule_date IS NOT NULL
        AND DATE(s.schedule_date) >= CURDATE()
      ORDER BY s.schedule_date ASC, s.start_time ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await pool.execute(sql, [
      ...OCCUPYING_STATUSES,
      instructorId,
    ]);

    const data = (rows || []).map((r) => ({
      id: Number(r.schedule_id),
      course: r.course_name,
      course_code: r.course_code || "",
      date: r.schedule_date_ymd || toYMD(r.schedule_date_ymd),
      startTime: r.startTime || "",
      endTime: r.endTime || "",
      totalSlots: Number(r.total_slots || 0),
      booked: Number(r.booked || 0),
      status: r.schedule_status || "open",
    }));

    return res.json({
      status: "success",
      page,
      limit,
      total,
      data,
    });
  } catch (err) {
    console.error("getInstructorSchedulesList error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      debug: err.sqlMessage || err.message,
    });
  }
};

/**
 * GET /api/instructor/schedules/history?page=1&limit=10
 * ✅ HISTORY = schedules that are PAST
 * Rule:
 *  - schedule_date < today
 *  OR
 *  - schedule_date = today AND end_time < now (optional but good)
 *
 * Returns same format + optional done_at (we'll use schedule_date/end_time logic)
 */
exports.getInstructorSchedulesHistory = async (req, res) => {
  try {
    const userId = req.session?.user_id;
    if (!userId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not authenticated" });
    }

    const ins = await getInstructorIdByUserId(userId);
    if (!ins) {
      return res.status(404).json({
        status: "error",
        message: "Instructor profile not found for this user",
      });
    }

    const instructorId = ins.instructor_id;

    const page = clampInt(req.query?.page, 1, 999999, 1);
    const limit = clampInt(req.query?.limit, 1, 50, 10);
    const offset = (page - 1) * limit;

    const placeholders = ph(OCCUPYING_STATUSES);

    // total count (past)
    const [cntRows] = await pool.execute(
      `
      SELECT COUNT(*) AS total
      FROM schedules s
      WHERE s.instructor_id = ?
        AND s.schedule_date IS NOT NULL
        AND (
          DATE(s.schedule_date) < CURDATE()
          OR (DATE(s.schedule_date) = CURDATE() AND s.end_time IS NOT NULL AND s.end_time < CURTIME())
        )
      `,
      [instructorId],
    );
    const total = Number(cntRows?.[0]?.total || 0);

    const sql = `
      SELECT
        s.schedule_id,
        COALESCE(c.course_name, '(unknown course)') AS course_name,
        c.course_code,

        DATE_FORMAT(s.schedule_date, '%Y-%m-%d') AS schedule_date_ymd,
        TIME_FORMAT(s.start_time, '%H:%i') AS startTime,
        TIME_FORMAT(s.end_time, '%H:%i') AS endTime,

        COALESCE(s.total_slots, 0) AS total_slots,
        LOWER(COALESCE(s.status, 'open')) AS schedule_status,

        COALESCE(b.booked, 0) AS booked
      FROM schedules s
      LEFT JOIN courses c ON c.id = s.course_id

      LEFT JOIN (
        SELECT schedule_id, COUNT(*) AS booked
        FROM schedule_reservations
        WHERE reservation_status IN (${placeholders})
        GROUP BY schedule_id
      ) b ON b.schedule_id = s.schedule_id

      WHERE s.instructor_id = ?
        AND s.schedule_date IS NOT NULL
        AND (
          DATE(s.schedule_date) < CURDATE()
          OR (DATE(s.schedule_date) = CURDATE() AND s.end_time IS NOT NULL AND s.end_time < CURTIME())
        )
      ORDER BY s.schedule_date DESC, s.start_time DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await pool.execute(sql, [
      ...OCCUPYING_STATUSES,
      instructorId,
    ]);

    const data = (rows || []).map((r) => ({
      id: Number(r.schedule_id),
      course: r.course_name,
      course_code: r.course_code || "",
      date: r.schedule_date_ymd || toYMD(r.schedule_date_ymd),
      startTime: r.startTime || "",
      endTime: r.endTime || "",
      totalSlots: Number(r.total_slots || 0),
      booked: Number(r.booked || 0),
      status: r.schedule_status || "open",
    }));

    return res.json({
      status: "success",
      page,
      limit,
      total,
      data,
    });
  } catch (err) {
    console.error("getInstructorSchedulesHistory error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      debug: err.sqlMessage || err.message,
    });
  }
};
