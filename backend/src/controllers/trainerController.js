// backend/src/controllers/trainerTesdaController.js
const pool = require("../config/database");

const ASSIGN_TABLE = "tesda_course_trainers"; // ✅ course_id, trainer_id
const COURSES_TABLE = "tesda_courses";
const SCHEDULES_TABLE = "tesda_schedules";
const RESERVATIONS_TABLE = "tesda_schedule_reservations";

const OCCUPYING = ["CONFIRMED", "APPROVED", "ACTIVE"];
function ph(arr) {
  return arr.map(() => "?").join(",");
}

// ✅ robust: supports req.user + req.session variants
function getSessionUserId(req) {
  const v =
    req.user?.user_id ??
    req.user?.id ??
    req.session?.user_id ??
    req.session?.userId ??
    req.session?.id ??
    req.session?.user?.user_id ??
    req.session?.user?.id;

  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// ===================== TESDA end-date rules (Mon–Sat only) =====================
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
    // ✅ TESDA: skip Sundays (Mon–Sat only)
    if (!isSundayDateObj(date)) added++;
  }

  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// returns last training day (Mon–Sat); null if invalid start/sunday
function computeTesdaEndDate(startYmd, duration) {
  if (!isValidYMD(startYmd)) return null;

  const [y, m, d] = startYmd.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  if (isSundayDateObj(start)) return null;

  const daysNeeded = tesdaDaysFromDuration(duration);
  if (daysNeeded <= 1) return startYmd;

  // if 3 days total -> add 2 more training days after start
  return addDaysSkipSundays(startYmd, daysNeeded - 1);
}

/**
 * ✅ GET /api/trainer/tesda/courses
 * Returns:
 * - course fields
 * - start_date (earliest scheduled date, excluding Sundays)
 * - end_date (computed from duration, skipping Sundays)
 * - startTime/endTime (min non-null, defaults 08:00 / 17:00)
 * - totalSlots (sum of total_slots; includes TBA schedules as pool capacity)
 * - reservedCount (count occupying reservations across schedules)
 * - students_count (distinct students occupying)
 * - availableSlots = totalSlots - reservedCount
 */
async function getMyTesdaCourses(req, res) {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    // trainers table has user_id -> trainer_id
    const [trows] = await pool.execute(
      `SELECT trainer_id FROM trainers WHERE user_id = ? LIMIT 1`,
      [userId],
    );

    if (!trows.length) {
      return res
        .status(404)
        .json({ status: "error", message: "Trainer profile not found" });
    }

    const trainerId = Number(trows[0].trainer_id);
    const OCC_PH = ph(OCCUPYING);

    /**
     * Notes:
     * - start_date: earliest schedule_date for that course/trainer (skip Sundays; ignore NULL/TBA)
     * - totalSlots: sum total_slots for ALL schedules (including TBA = pooling batch capacity)
     * - reservedCount/students_count: counts from reservations joined to schedules
     *   - includes TBA schedules too (schedule_date NULL)
     *   - excludes Sundays if a schedule_date exists and is Sunday
     */
    const [rows] = await pool.execute(
      `
      SELECT
        c.id AS course_id,
        c.course_code,
        c.course_name,
        c.description,
        c.duration,
        c.requirements,
        c.status,

        -- earliest valid scheduled date (excluding Sundays); NULL if all are TBA
        DATE_FORMAT(
          MIN(
            CASE
              WHEN s.schedule_date IS NULL OR s.schedule_date = '0000-00-00' THEN NULL
              WHEN DAYOFWEEK(DATE(s.schedule_date)) = 1 THEN NULL
              ELSE DATE(s.schedule_date)
            END
          ),
          '%Y-%m-%d'
        ) AS start_date,

        -- pick a display start/end time if any schedule has time; default 08:00/17:00
        TIME_FORMAT(
          COALESCE(
            MIN(CASE WHEN s.start_time IS NULL THEN NULL ELSE s.start_time END),
            '08:00:00'
          ),
          '%H:%i'
        ) AS startTime,

        TIME_FORMAT(
          COALESCE(
            MIN(CASE WHEN s.end_time IS NULL THEN NULL ELSE s.end_time END),
            '17:00:00'
          ),
          '%H:%i'
        ) AS endTime,

        -- capacity pool across schedules (includes TBA schedules)
        COALESCE(SUM(COALESCE(s.total_slots, 0)), 0) AS totalSlots,

        -- counts of occupying reservations across schedules for this trainer/course
        (
          SELECT COUNT(*)
          FROM ${RESERVATIONS_TABLE} r
          INNER JOIN ${SCHEDULES_TABLE} ss ON ss.schedule_id = r.schedule_id
          WHERE ss.course_id = c.id
            AND ss.trainer_id = ?
            AND (
              ss.schedule_date IS NULL
              OR ss.schedule_date = '0000-00-00'
              OR DAYOFWEEK(DATE(ss.schedule_date)) <> 1
            )
            AND UPPER(COALESCE(r.reservation_status,'')) IN (${OCC_PH})
        ) AS reservedCount,

        (
          SELECT COUNT(DISTINCT r.student_id)
          FROM ${RESERVATIONS_TABLE} r
          INNER JOIN ${SCHEDULES_TABLE} ss ON ss.schedule_id = r.schedule_id
          WHERE ss.course_id = c.id
            AND ss.trainer_id = ?
            AND (
              ss.schedule_date IS NULL
              OR ss.schedule_date = '0000-00-00'
              OR DAYOFWEEK(DATE(ss.schedule_date)) <> 1
            )
            AND UPPER(COALESCE(r.reservation_status,'')) IN (${OCC_PH})
        ) AS students_count,

        -- helper counts
        SUM(CASE WHEN s.schedule_date IS NULL THEN 1 ELSE 0 END) AS tba_batches,
        SUM(CASE WHEN s.schedule_date IS NOT NULL THEN 1 ELSE 0 END) AS scheduled_batches

      FROM ${ASSIGN_TABLE} a
      INNER JOIN ${COURSES_TABLE} c ON c.id = a.course_id

      LEFT JOIN ${SCHEDULES_TABLE} s
        ON s.course_id = c.id
       AND s.trainer_id = a.trainer_id

      WHERE a.trainer_id = ?
      GROUP BY
        c.id, c.course_code, c.course_name, c.description, c.duration, c.requirements, c.status
      ORDER BY c.course_name ASC
      `,
      [
        trainerId, // reservedCount ss.trainer_id = ?
        ...OCCUPYING,
        trainerId, // students_count ss.trainer_id = ?
        ...OCCUPYING,
        trainerId, // WHERE a.trainer_id = ?
      ],
    );

    const data = (rows || []).map((r) => {
      const start =
        r.start_date && r.start_date !== "0000-00-00"
          ? String(r.start_date)
          : null;

      const end = start ? computeTesdaEndDate(start, r.duration) : null;

      const totalSlots = Number(r.totalSlots) || 0;
      const reservedCount = Number(r.reservedCount) || 0;
      const availableSlots = Math.max(totalSlots - reservedCount, 0);

      return {
        ...r,
        start_date: start, // earliest scheduled date (null if all TBA)
        end_date: end, // computed from duration, skipping Sundays
        totalSlots,
        reservedCount,
        availableSlots,
        startTime: r.startTime || "08:00",
        endTime: r.endTime || "17:00",
        tba_batches: Number(r.tba_batches) || 0,
        scheduled_batches: Number(r.scheduled_batches) || 0,
      };
    });

    return res.json({ status: "success", data });
  } catch (err) {
    console.error("getMyTesdaCourses error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load assigned TESDA courses",
      debug: {
        code: err.code,
        sqlMessage: err.sqlMessage,
        message: err.message,
      },
    });
  }
}

// --------------------
// STUBS (para di mag-crash kung may routes pa)
// --------------------
const createTrainer = async (req, res) => {
  return res.status(501).json({
    status: "error",
    message: "createTrainer not implemented yet",
  });
};

const updateTrainer = async (req, res) => {
  return res.status(501).json({
    status: "error",
    message: "updateTrainer not implemented yet",
  });
};

const deleteTrainer = async (req, res) => {
  
  return res.status(501).json({
    status: "error",
    message: "deleteTrainer not implemented yet",
  });
};

module.exports = {
  getMyTesdaCourses,
  createTrainer,
  updateTrainer,
  deleteTrainer,
};
