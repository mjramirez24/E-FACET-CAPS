// backend/src/controllers/trainerTesdaSchedulesController.js
const pool = require("../config/database");

const COURSES_TABLE = "tesda_courses";
const SCHEDULES_TABLE = "tesda_schedules";
const RESERVATIONS_TABLE = "tesda_schedule_reservations";

const OCCUPYING = ["CONFIRMED", "APPROVED", "ACTIVE"];
function ph(arr) {
  return arr.map(() => "?").join(",");
}

async function getTrainerIdFromUser(req) {
  const userId =
    req.user?.user_id ||
    req.user?.id ||
    req.session?.user_id ||
    req.session?.id;

  if (!userId) return { error: { status: 401, message: "Unauthorized" } };

  const [trows] = await pool.execute(
    `SELECT trainer_id FROM trainers WHERE user_id = ? LIMIT 1`,
    [userId],
  );

  if (!trows.length) {
    return { error: { status: 404, message: "Trainer profile not found" } };
  }

  return { trainerId: Number(trows[0].trainer_id) };
}

// ===================== TESDA end-date rules (same as courses controller) =====================
function isValidYMD(ymd) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(ymd || ""));
}

function parseDurationHours(duration) {
  const m = String(duration || "").match(/(\d+(?:\.\d+)?)/);
  const n = m ? Number(m[1]) : 0;
  return Number.isFinite(n) ? n : 0;
}

function tesdaDaysFromDuration(duration) {
  const TESDA_HOURS_PER_DAY = 9;
  const hours = parseDurationHours(duration);
  return hours > 0 ? Math.max(1, Math.ceil(hours / TESDA_HOURS_PER_DAY)) : 1;
}

function isSundayDateObj(d) {
  return d.getDay() === 0;
}

function addDaysSkipSundays(startYmd, addTrainingDays) {
  const [y, m, d] = startYmd.split("-").map(Number);
  let date = new Date(y, m - 1, d);
  let added = 0;

  while (added < addTrainingDays) {
    date.setDate(date.getDate() + 1);
    if (!isSundayDateObj(date)) added++;
  }

  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function computeTesdaEndDate(startYmd, duration) {
  if (!isValidYMD(startYmd)) return null;

  const [y, m, d] = startYmd.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  if (isSundayDateObj(start)) return null;

  const daysNeeded = tesdaDaysFromDuration(duration);
  if (daysNeeded <= 1) return startYmd;

  return addDaysSkipSundays(startYmd, daysNeeded - 1);
}

/**
 * GET /api/trainer/tesda/schedules?course_id=123
 * - trainer-only
 * - exclude dated Sundays (keep NULL / 0000-00-00 as TBA)
 * - returns duration AND computed end_date
 */
async function listSchedulesByCourse(req, res) {
  try {
    const { trainerId, error } = await getTrainerIdFromUser(req);
    if (error) {
      return res
        .status(error.status)
        .json({ status: "error", message: error.message });
    }

    const courseId = Number(req.query.course_id);
    if (!Number.isFinite(courseId) || courseId < 1) {
      return res
        .status(400)
        .json({ status: "error", message: "Valid course_id is required" });
    }

    const OCC_PH = ph(OCCUPYING);

    const [rows] = await pool.execute(
      `
      SELECT
        s.schedule_id AS id,
        s.course_id,
        c.course_name AS course,
        c.course_code AS course_code,
        c.duration AS duration,

        s.trainer_id AS trainer_id,

        CASE
          WHEN s.schedule_date IS NULL OR s.schedule_date = '0000-00-00' THEN NULL
          ELSE DATE_FORMAT(s.schedule_date, '%Y-%m-%d')
        END AS date,

        CASE
          WHEN s.schedule_date IS NULL OR s.schedule_date = '0000-00-00' THEN NULL
          ELSE DATE_FORMAT(s.schedule_date, '%a')
        END AS day,

        TIME_FORMAT(COALESCE(s.start_time, '08:00:00'), '%H:%i') AS startTime,
        TIME_FORMAT(COALESCE(s.end_time, '17:00:00'), '%H:%i') AS endTime,

        s.total_slots AS totalSlots,
        s.status AS scheduleStatus,

        (
          SELECT COUNT(*)
          FROM ${RESERVATIONS_TABLE} r
          WHERE r.schedule_id = s.schedule_id
            AND UPPER(COALESCE(r.reservation_status,'')) IN (${OCC_PH})
        ) AS reservedCount,

        GREATEST(
          s.total_slots - (
            SELECT COUNT(*)
            FROM ${RESERVATIONS_TABLE} r
            WHERE r.schedule_id = s.schedule_id
              AND UPPER(COALESCE(r.reservation_status,'')) IN (${OCC_PH})
          ),
          0
        ) AS availableSlots

      FROM ${SCHEDULES_TABLE} s
      JOIN ${COURSES_TABLE} c ON c.id = s.course_id
      WHERE s.course_id = ?
        AND s.trainer_id = ?

        -- exclude dated Sundays; keep TBA
        AND (
          s.schedule_date IS NULL
          OR s.schedule_date = '0000-00-00'
          OR DAYOFWEEK(s.schedule_date) <> 1
        )

      ORDER BY
        CASE WHEN s.schedule_date IS NULL OR s.schedule_date = '0000-00-00' THEN 1 ELSE 0 END ASC,
        s.schedule_date ASC,
        s.start_time ASC,
        s.schedule_id ASC
      `,
      [...OCCUPYING, ...OCCUPYING, courseId, trainerId],
    );

    // ✅ add computed end_date (Mon–Sat only)
    const data = (rows || []).map((r) => {
      const start = r.date ? String(r.date) : null;
      const end = start ? computeTesdaEndDate(start, r.duration) : null;

      return {
        ...r,
        end_date: end,
        totalSlots: Number(r.totalSlots) || 0,
        reservedCount: Number(r.reservedCount) || 0,
        availableSlots: Number(r.availableSlots) || 0,
        startTime: r.startTime || "08:00",
        endTime: r.endTime || "17:00",
      };
    });

    return res.json({ status: "success", data, total: data.length });
  } catch (err) {
    console.error(
      "trainerTesdaSchedulesController.listSchedulesByCourse error:",
      err,
    );
    return res.status(500).json({
      status: "error",
      message: err.sqlMessage || err.message || "Failed to load schedules",
    });
  }
}

module.exports = { listSchedulesByCourse };
