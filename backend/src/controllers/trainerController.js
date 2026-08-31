// backend/src/controllers/trainerController.js

const pool = require("../config/database");

const ASSIGN_TABLE = "tesda_course_trainers";
const COURSES_TABLE = "tesda_courses";
const SCHEDULES_TABLE = "tesda_schedules";
const RESERVATIONS_TABLE = "tesda_schedule_reservations";

const OCCUPYING = ["CONFIRMED", "APPROVED", "ACTIVE"];

function ph(arr) {
  return arr.map(() => "?").join(",");
}

// Supports req.user + req.session variants
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

// ======================================================
// TESDA end-date rules
// Monday-Saturday only
// ======================================================

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

    if (!isSundayDateObj(date)) {
      added++;
    }
  }

  const pad = (n) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}`;
}

function computeTesdaEndDate(startYmd, duration) {
  if (!isValidYMD(startYmd)) {
    return null;
  }

  const [y, m, d] = startYmd.split("-").map(Number);

  const start = new Date(y, m - 1, d);

  if (isSundayDateObj(start)) {
    return null;
  }

  const daysNeeded = tesdaDaysFromDuration(duration);

  if (daysNeeded <= 1) {
    return startYmd;
  }

  return addDaysSkipSundays(startYmd, daysNeeded - 1);
}

// ======================================================
// GET /api/trainer/tesda/courses
// ======================================================

async function getMyTesdaCourses(req, res) {
  try {
    const userId = getSessionUserId(req);

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // trainers.user_id -> trainers.trainer_id
    const [trows] = await pool.execute(
      `
      SELECT trainer_id
      FROM trainers
      WHERE user_id = ?
      LIMIT 1
      `,
      [userId],
    );

    if (!trows.length) {
      return res.status(404).json({
        status: "error",
        message: "Trainer profile not found",
      });
    }

    const trainerId = Number(trows[0].trainer_id);

    const OCC_PH = ph(OCCUPYING);

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

        /*
         * Earliest valid scheduled date
         * NULL       = TBA
         * YEAR = 0   = zero-date / TBA
         * Sunday     = ignored
         */
        DATE_FORMAT(
          MIN(
            CASE
              WHEN s.schedule_date IS NULL THEN NULL
              WHEN YEAR(s.schedule_date) = 0 THEN NULL
              WHEN DAYOFWEEK(s.schedule_date) = 1 THEN NULL
              ELSE s.schedule_date
            END
          ),
          '%Y-%m-%d'
        ) AS start_date,

        /*
         * Display start time
         */
        TIME_FORMAT(
          COALESCE(
            MIN(
              CASE
                WHEN s.start_time IS NULL THEN NULL
                ELSE s.start_time
              END
            ),
            '08:00:00'
          ),
          '%H:%i'
        ) AS startTime,

        /*
         * Display end time
         */
        TIME_FORMAT(
          COALESCE(
            MIN(
              CASE
                WHEN s.end_time IS NULL THEN NULL
                ELSE s.end_time
              END
            ),
            '17:00:00'
          ),
          '%H:%i'
        ) AS endTime,

        /*
         * Total capacity
         */
        COALESCE(
          SUM(
            COALESCE(s.total_slots, 0)
          ),
          0
        ) AS totalSlots,

        /*
         * Occupying reservations
         */
        (
          SELECT COUNT(*)

          FROM ${RESERVATIONS_TABLE} r

          INNER JOIN ${SCHEDULES_TABLE} ss
            ON ss.schedule_id = r.schedule_id

          WHERE ss.course_id = c.id
            AND ss.trainer_id = ?

            AND (
              ss.schedule_date IS NULL
              OR YEAR(ss.schedule_date) = 0
              OR DAYOFWEEK(ss.schedule_date) <> 1
            )

            AND UPPER(
              COALESCE(
                r.reservation_status,
                ''
              )
            ) IN (${OCC_PH})

        ) AS reservedCount,

        /*
         * Unique students
         */
        (
          SELECT COUNT(
            DISTINCT r.student_id
          )

          FROM ${RESERVATIONS_TABLE} r

          INNER JOIN ${SCHEDULES_TABLE} ss
            ON ss.schedule_id = r.schedule_id

          WHERE ss.course_id = c.id
            AND ss.trainer_id = ?

            AND (
              ss.schedule_date IS NULL
              OR YEAR(ss.schedule_date) = 0
              OR DAYOFWEEK(ss.schedule_date) <> 1
            )

            AND UPPER(
              COALESCE(
                r.reservation_status,
                ''
              )
            ) IN (${OCC_PH})

        ) AS students_count,

        /*
         * TBA batches
         *
         * schedule_id NULL means there is actually
         * no schedule row, so do not count it as TBA.
         */
        SUM(
          CASE
            WHEN s.schedule_id IS NULL THEN 0
            WHEN s.schedule_date IS NULL THEN 1
            WHEN YEAR(s.schedule_date) = 0 THEN 1
            ELSE 0
          END
        ) AS tba_batches,

        /*
         * Valid scheduled batches
         */
        SUM(
          CASE
            WHEN s.schedule_id IS NULL THEN 0
            WHEN s.schedule_date IS NULL THEN 0
            WHEN YEAR(s.schedule_date) = 0 THEN 0
            ELSE 1
          END
        ) AS scheduled_batches

      FROM ${ASSIGN_TABLE} a

      INNER JOIN ${COURSES_TABLE} c
        ON c.id = a.course_id

      LEFT JOIN ${SCHEDULES_TABLE} s
        ON s.course_id = c.id
       AND s.trainer_id = a.trainer_id

      WHERE a.trainer_id = ?

      GROUP BY
        c.id,
        c.course_code,
        c.course_name,
        c.description,
        c.duration,
        c.requirements,
        c.status

      ORDER BY c.course_name ASC
      `,
      [
        // reservedCount
        trainerId,
        ...OCCUPYING,

        // students_count
        trainerId,
        ...OCCUPYING,

        // assigned trainer
        trainerId,
      ],
    );

    const data = (rows || []).map((r) => {
      const start = r.start_date ? String(r.start_date) : null;

      const end = start ? computeTesdaEndDate(start, r.duration) : null;

      const totalSlots = Number(r.totalSlots) || 0;

      const reservedCount = Number(r.reservedCount) || 0;

      const studentsCount = Number(r.students_count) || 0;

      const availableSlots = Math.max(totalSlots - reservedCount, 0);

      return {
        ...r,

        start_date: start,
        end_date: end,

        totalSlots,
        reservedCount,
        students_count: studentsCount,
        availableSlots,

        startTime: r.startTime || "08:00",

        endTime: r.endTime || "17:00",

        tba_batches: Number(r.tba_batches) || 0,

        scheduled_batches: Number(r.scheduled_batches) || 0,
      };
    });

    return res.json({
      status: "success",
      data,
    });
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

// ======================================================
// STUBS
// ======================================================

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
