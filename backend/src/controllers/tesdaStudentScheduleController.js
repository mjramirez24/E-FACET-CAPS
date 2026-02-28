// backend/src/controllers/tesdaTrainingScheduleController.js
const pool = require("../config/database");

function getSessionUserId(req) {
  const v = req?.session?.user_id ?? req?.session?.userId ?? req?.session?.id;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// only show these on "Training Schedule" page
const VISIBLE = ["APPROVED", "CONFIRMED", "ACTIVE"];

function ph(arr) {
  return arr.map(() => "?").join(",");
}

/**
 * GET /api/tesda/training-schedule
 * Returns confirmed-like reservations with:
 * - schedule_date (or 'TBA')
 * - start/end time (fallbacks)
 * - trainer_name
 * - batch_no (from tesda_batches)
 * - course duration (for computing end date in frontend)
 *
 * NOTE:
 * If tesda_schedule_reservations has batch_id => join by r.batch_id
 * else fallback join by schedule_id
 */
exports.getMyTrainingSchedule = async (req, res) => {
  try {
    const studentId = getSessionUserId(req);
    if (!studentId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not authenticated" });
    }

    let joinBatchSql =
      "LEFT JOIN tesda_batches b ON b.schedule_id = s.schedule_id";
    try {
      const [cols] = await pool.execute(
        "SHOW COLUMNS FROM tesda_schedule_reservations LIKE 'batch_id'",
      );
      if (Array.isArray(cols) && cols.length) {
        joinBatchSql = "LEFT JOIN tesda_batches b ON b.batch_id = r.batch_id";
      }
    } catch {
      // ignore; fallback joinBatchSql stays schedule_id
    }

    const [rows] = await pool.execute(
      `
      SELECT
        r.reservation_id,
        UPPER(COALESCE(r.reservation_status,'')) AS reservation_status,
        r.created_at AS reserved_at,

        s.schedule_id,
        s.course_id,
        c.course_name,
        c.course_code,

        -- ✅ include duration for end-date computation
        c.duration AS course_duration,

        -- ✅ TBA handling
        CASE
          WHEN s.schedule_date IS NULL OR s.schedule_date = '0000-00-00'
            THEN 'TBA'
          ELSE DATE_FORMAT(s.schedule_date, '%Y-%m-%d')
        END AS schedule_date,

        TIME_FORMAT(COALESCE(s.start_time,'08:00:00'), '%H:%i') AS startTime,
        TIME_FORMAT(COALESCE(s.end_time,'17:00:00'), '%H:%i') AS endTime,

        -- ✅ batch info
        b.batch_no,
        b.status AS batch_status,

        -- ✅ trainer
        s.trainer_id,
        CONCAT(t.firstname, ' ', t.lastname) AS trainer_name

      FROM tesda_schedule_reservations r
      JOIN tesda_schedules s ON s.schedule_id = r.schedule_id
      JOIN tesda_courses c ON c.id = s.course_id
      ${joinBatchSql}
      LEFT JOIN trainers t ON t.trainer_id = s.trainer_id

      WHERE r.student_id = ?
        AND UPPER(COALESCE(r.reservation_status,'')) IN (${ph(VISIBLE)})

      ORDER BY
        CASE
          WHEN s.schedule_date IS NULL OR s.schedule_date = '0000-00-00' THEN 1
          ELSE 0
        END ASC,
        s.schedule_date ASC,
        s.start_time ASC,
        r.reservation_id ASC
      `,
      [studentId, ...VISIBLE],
    );

    return res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("getMyTrainingSchedule error:", err);
    return res.status(500).json({
      status: "error",
      message: err.sqlMessage || err.message,
    });
  }
};
