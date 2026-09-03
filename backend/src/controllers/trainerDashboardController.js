// backend/src/controllers/trainerDashboardController.js

const pool = require("../config/database");

const ASSIGN_TABLE = "tesda_course_trainers";

/* =========================================================
   HELPERS
   ========================================================= */

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
    `
      SELECT trainer_id
      FROM trainers
      WHERE user_id = ?
      LIMIT 1
      `,
    [userId],
  );

  return rows.length ? Number(rows[0].trainer_id) : null;
}

/* =========================================================
   GET /api/trainer/dashboard/summary

   IMPORTANT:
   tesda_course_trainers is now the authority.

   Example:
   Course 15
      Trainer A
      Trainer B
      Trainer C

   All three trainers see the SAME:
   - dashboard counts
   - schedules
   - students
   - reservations
   - trends
   - course statistics

   tesda_schedules.trainer_id is NOT used for authorization.
   ========================================================= */

exports.getTrainerDashboardSummary = async (req, res) => {
  try {
    /* =========================
         AUTHENTICATION
         ========================= */

    const userId = getSessionUserId(req);

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const trainerId = await resolveTrainerIdFromUserId(userId);

    if (!trainerId) {
      return res.status(403).json({
        status: "error",
        message: "Trainer not mapped (trainers.user_id missing).",
      });
    }

    const enrolled = enrolledStatuses();

    const inPlaceholders = enrolled.map(() => "?").join(",");

    /* =====================================================
         1. ASSIGNED COURSES
         ===================================================== */

    const [[assignedCourses]] = await pool.execute(
      `
          SELECT
            COUNT(
              DISTINCT tct.course_id
            ) AS cnt

          FROM ${ASSIGN_TABLE} tct

          WHERE tct.trainer_id = ?
          `,
      [trainerId],
    );

    /* =====================================================
         2. UPCOMING SCHEDULE COUNT

         Shared:
         Trainer has access if trainer is assigned
         to the schedule's COURSE.
         ===================================================== */

    const [[upcomingSchedules]] = await pool.execute(
      `
          SELECT
            COUNT(
              DISTINCT ts.schedule_id
            ) AS cnt

          FROM tesda_schedules ts

          JOIN ${ASSIGN_TABLE} tct
            ON tct.course_id =
               ts.course_id
           AND tct.trainer_id = ?

          WHERE
            ts.schedule_date IS NOT NULL

            AND YEAR(
              ts.schedule_date
            ) <> 0

            AND ts.schedule_date >=
                CURDATE()

            AND (
              LOWER(
                COALESCE(
                  ts.status,
                  'open'
                )
              ) <> 'closed'
            )
          `,
      [trainerId],
    );

    /* =====================================================
         3. TOTAL TRAINEES

         Same students are visible to every trainer
         assigned to the course.
         ===================================================== */

    const [[totalTrainees]] = await pool.execute(
      `
          SELECT
            COUNT(
              DISTINCT tr.student_id
            ) AS cnt

          FROM tesda_schedule_reservations tr

          JOIN tesda_schedules ts
            ON ts.schedule_id =
               tr.schedule_id

          JOIN ${ASSIGN_TABLE} tct
            ON tct.course_id =
               ts.course_id
           AND tct.trainer_id = ?

          WHERE
            UPPER(
              tr.reservation_status
            ) IN (
              ${inPlaceholders}
            )
          `,
      [trainerId, ...enrolled],
    );

    /* =====================================================
         4. PENDING ATTENDANCE TODAY

         Count attendance per schedule + student.

         Attendance is SHARED.
         We DO NOT filter attendance by a.trainer_id.

         a.trainer_id = original recorder only.
         ===================================================== */

    const [[todayStudents]] = await pool.execute(
      `
          SELECT
            COUNT(
              DISTINCT CONCAT(
                ts.schedule_id,
                ':',
                tr.student_id
              )
            ) AS cnt

          FROM tesda_schedule_reservations tr

          JOIN tesda_schedules ts
            ON ts.schedule_id =
               tr.schedule_id

          JOIN ${ASSIGN_TABLE} tct
            ON tct.course_id =
               ts.course_id
           AND tct.trainer_id = ?

          WHERE
            ts.schedule_date =
              CURDATE()

            AND UPPER(
              tr.reservation_status
            ) IN (
              ${inPlaceholders}
            )
          `,
      [trainerId, ...enrolled],
    );

    /*
     * IMPORTANT:
     *
     * We count attendance rows from courses
     * assigned to this trainer.
     *
     * We DO NOT use:
     *
     *   WHERE a.trainer_id = ?
     *
     * because trainer_id means:
     * "Recorded by".
     */

    const [[todayMarked]] = await pool.execute(
      `
          SELECT
            COUNT(
              DISTINCT a.attendance_id
            ) AS cnt

          FROM tesda_trainer_attendance a

          JOIN ${ASSIGN_TABLE} tct
            ON tct.course_id =
               a.course_id
           AND tct.trainer_id = ?

          WHERE
            a.attendance_date =
              CURDATE()
          `,
      [trainerId],
    );

    const pendingAttendance = Math.max(
      0,

      (Number(todayStudents.cnt) || 0) - (Number(todayMarked.cnt) || 0),
    );

    /* =====================================================
         5. RECENT TESDA RESERVATIONS

         Shared by COURSE.
         ===================================================== */

    const [recent] = await pool.execute(
      `
          SELECT
            tr.reservation_id AS id,

            tr.created_at,

            UPPER(
              tr.reservation_status
            ) AS status,

            u.fullname
              AS student_name,

            tc.course_name,

            CASE
              WHEN
                ts.schedule_date
                IS NULL
                OR YEAR(
                  ts.schedule_date
                ) = 0
              THEN NULL

              ELSE DATE_FORMAT(
                ts.schedule_date,
                '%Y-%m-%d'
              )
            END
              AS schedule_date,

            ts.start_time,
            ts.end_time

          FROM tesda_schedule_reservations tr

          JOIN tesda_schedules ts
            ON ts.schedule_id =
               tr.schedule_id

          JOIN ${ASSIGN_TABLE} tct
            ON tct.course_id =
               ts.course_id
           AND tct.trainer_id = ?

          LEFT JOIN users u
            ON u.id =
               tr.student_id

          LEFT JOIN tesda_courses tc
            ON tc.id =
               ts.course_id

          ORDER BY
            tr.created_at DESC

          LIMIT 200
          `,
      [trainerId],
    );

    /* =====================================================
         6. TOP COURSES THIS MONTH

         Shared course statistics.
         ===================================================== */

    const [topCourses] = await pool.execute(
      `
          SELECT
            tc.id AS course_id,

            tc.course_name,

            COUNT(*) AS reservations

          FROM tesda_schedule_reservations tr

          JOIN tesda_schedules ts
            ON ts.schedule_id =
               tr.schedule_id

          JOIN tesda_courses tc
            ON tc.id =
               ts.course_id

          JOIN ${ASSIGN_TABLE} tct
            ON tct.course_id =
               ts.course_id
           AND tct.trainer_id = ?

          WHERE
            tr.created_at >=
              DATE_FORMAT(
                CURDATE(),
                '%Y-%m-01'
              )

          GROUP BY
            tc.id,
            tc.course_name

          ORDER BY
            reservations DESC,
            tc.course_name ASC

          LIMIT 5
          `,
      [trainerId],
    );

    /* =====================================================
         7. UPCOMING SCHEDULE LIST

         All trainers assigned to the course
         see the SAME schedules.
         ===================================================== */

    const [upcomingList] = await pool.execute(
      `
          SELECT
            ts.schedule_id,

            ts.course_id,

            tc.course_name,

            CASE
              WHEN
                ts.schedule_date
                  IS NULL
                OR YEAR(
                  ts.schedule_date
                ) = 0
              THEN NULL

              ELSE DATE_FORMAT(
                ts.schedule_date,
                '%Y-%m-%d'
              )
            END
              AS schedule_date,

            ts.start_time,

            ts.end_time,

            ts.total_slots,

            (
              SELECT COUNT(*)

              FROM tesda_schedule_reservations tr

              WHERE
                tr.schedule_id =
                  ts.schedule_id

                AND UPPER(
                  tr.reservation_status
                ) IN (
                  ${inPlaceholders}
                )
            )
              AS reserved_count,

            ts.status

          FROM tesda_schedules ts

          JOIN ${ASSIGN_TABLE} tct
            ON tct.course_id =
               ts.course_id
           AND tct.trainer_id = ?

          LEFT JOIN tesda_courses tc
            ON tc.id =
               ts.course_id

          WHERE
            ts.schedule_date IS NOT NULL

            AND YEAR(
              ts.schedule_date
            ) <> 0

            AND ts.schedule_date >=
                CURDATE()

          ORDER BY
            ts.schedule_date ASC,
            ts.start_time ASC

          LIMIT 200
          `,
      [...enrolled, trainerId],
    );

    /* =====================================================
         8. MONTHLY TRENDS
         LAST 12 MONTHS
         ===================================================== */

    const labels = lastNMonthsLabels(12);

    const fromMonth = labels[0] + "-01";

    const [monthly] = await pool.execute(
      `
          SELECT
            ${monthKeyExpr("tr.created_at")} AS ym,

            COUNT(*) AS count

          FROM tesda_schedule_reservations tr

          JOIN tesda_schedules ts
            ON ts.schedule_id =
               tr.schedule_id

          JOIN ${ASSIGN_TABLE} tct
            ON tct.course_id =
               ts.course_id
           AND tct.trainer_id = ?

          WHERE
            tr.created_at >= ?

            AND UPPER(
              tr.reservation_status
            ) IN (
              ${inPlaceholders}
            )

          GROUP BY ym

          ORDER BY ym ASC
          `,
      [trainerId, fromMonth, ...enrolled],
    );

    const map = {};

    for (const r of monthly || []) {
      map[String(r.ym)] = Number(r.count) || 0;
    }

    const series = labels.map((k) => map[k] || 0);

    /* =====================================================
         9. STATUS BUCKETS
         ===================================================== */

    const [statusRows] = await pool.execute(
      `
          SELECT
            UPPER(
              tr.reservation_status
            ) AS status,

            COUNT(*) AS count

          FROM tesda_schedule_reservations tr

          JOIN tesda_schedules ts
            ON ts.schedule_id =
               tr.schedule_id

          JOIN ${ASSIGN_TABLE} tct
            ON tct.course_id =
               ts.course_id
           AND tct.trainer_id = ?

          GROUP BY
            UPPER(
              tr.reservation_status
            )
          `,
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

      if (!st) {
        buckets.OTHER += c;
      } else if (st === "PENDING") {
        buckets.PENDING += c;
      } else if (st === "REJECTED") {
        buckets.REJECTED += c;
      } else if (st === "CANCELLED" || st === "CANCELED") {
        buckets.CANCELLED += c;
      } else if (enrolled.includes(st)) {
        buckets.ENROLLED += c;
      } else {
        buckets.OTHER += c;
      }
    }

    /* =====================================================
         RESPONSE
         ===================================================== */

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

        trends: {
          labels,
          series,
        },

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
