// backend/src/controllers/trainerTesdaController.js
const pool = require("../config/database");

const ASSIGN_TABLE = "tesda_course_trainers";
const COURSES_TABLE = "tesda_courses";
const SCHEDULES_TABLE = "tesda_schedules";
const RESERVATIONS_TABLE = "tesda_schedule_reservations";

const OCCUPYING = ["CONFIRMED", "APPROVED", "ACTIVE"];

function ph(arr) {
  return arr.map(() => "?").join(",");
}

function getSessionUserId(req) {
  const v =
    req.user?.user_id ??
    req.user?.id ??
    req.session?.user_id ??
    req.session?.userId ??
    req.session?.id;

  const n = Number(v);

  return Number.isFinite(n) && n > 0 ? n : 0;
}

// ===================== TESDA end-date rules =====================

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

// ===================== TRAINER COURSES =====================

async function getMyTesdaCourses(req, res) {
  try {
    const userId = getSessionUserId(req);

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // Get current trainer
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

    /**
     * SHARED TESDA COURSE ACCESS
     *
     * Important:
     * - tesda_course_trainers decides which trainers
     *   are allowed to access the course.
     *
     * - tesda_schedules.trainer_id is NOT used
     *   to restrict the course anymore.
     *
     * Therefore:
     *
     * Trainer A \
     * Trainer B  \
     * Trainer C   ---> SAME COURSE
     * Trainer D  /     SAME SCHEDULES
     * Trainer E /      SAME STUDENTS
     *
     * as long as they are assigned in:
     * tesda_course_trainers
     */

    const [rows] = await pool.execute(
      `
      SELECT
        c.id AS course_id,
        c.course_name,
        c.course_code,
        c.description,
        c.duration,
        c.requirements,
        c.status,

        schedule_data.start_date,

        COALESCE(
          schedule_data.startTime,
          '08:00'
        ) AS startTime,

        COALESCE(
          schedule_data.endTime,
          '17:00'
        ) AS endTime,

        COALESCE(
          schedule_data.totalSlots,
          0
        ) AS totalSlots,

        COALESCE(
          reservation_data.reservedCount,
          0
        ) AS reservedCount,

        COALESCE(
          reservation_data.students_count,
          0
        ) AS students_count

      FROM ${ASSIGN_TABLE} a

      INNER JOIN ${COURSES_TABLE} c
        ON c.id = a.course_id

      /*
       * Shared schedule information.
       *
       * We aggregate by COURSE,
       * not by trainer.
       */
      LEFT JOIN (
        SELECT
          s.course_id,

          DATE_FORMAT(
            MIN(
              CASE
                WHEN s.schedule_date IS NULL
                  THEN NULL

                WHEN YEAR(s.schedule_date) = 0
                  THEN NULL

                WHEN DAYOFWEEK(s.schedule_date) = 1
                  THEN NULL

                ELSE s.schedule_date
              END
            ),
            '%Y-%m-%d'
          ) AS start_date,

          TIME_FORMAT(
            MIN(
              CASE
                WHEN s.start_time IS NULL
                  THEN NULL
                ELSE s.start_time
              END
            ),
            '%H:%i'
          ) AS startTime,

          TIME_FORMAT(
            MIN(
              CASE
                WHEN s.end_time IS NULL
                  THEN NULL
                ELSE s.end_time
              END
            ),
            '%H:%i'
          ) AS endTime,

          SUM(
            COALESCE(
              s.total_slots,
              0
            )
          ) AS totalSlots

        FROM ${SCHEDULES_TABLE} s

        WHERE
          s.schedule_date IS NULL
          OR YEAR(s.schedule_date) = 0
          OR DAYOFWEEK(s.schedule_date) <> 1

        GROUP BY s.course_id
      ) schedule_data
        ON schedule_data.course_id = c.id

      /*
       * Shared reservations / students.
       *
       * All assigned trainers see the same
       * enrolled students for the course.
       */
      LEFT JOIN (
        SELECT
          s.course_id,

          COUNT(
            r.reservation_id
          ) AS reservedCount,

          COUNT(
            DISTINCT r.student_id
          ) AS students_count

        FROM ${SCHEDULES_TABLE} s

        INNER JOIN ${RESERVATIONS_TABLE} r
          ON r.schedule_id = s.schedule_id

        WHERE
          UPPER(
            COALESCE(
              r.reservation_status,
              ''
            )
          ) IN (${OCC_PH})

          AND (
            s.schedule_date IS NULL
            OR YEAR(s.schedule_date) = 0
            OR DAYOFWEEK(s.schedule_date) <> 1
          )

        GROUP BY s.course_id
      ) reservation_data
        ON reservation_data.course_id = c.id

      /*
       * THIS is now the access control.
       *
       * Current trainer only needs to be
       * assigned to the course.
       */
      WHERE a.trainer_id = ?

      ORDER BY c.course_name ASC
      `,
      [...OCCUPYING, trainerId],
    );

    const data = (rows || []).map((r) => {
      const start =
        r.start_date && r.start_date !== "0000-00-00"
          ? String(r.start_date)
          : null;

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

module.exports = {
  getMyTesdaCourses,
};
