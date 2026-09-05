// backend/src/controllers/tesdaScheduleController.js

const pool = require("../config/database");

// statuses that occupy a slot
const OCCUPYING = ["CONFIRMED", "APPROVED", "ACTIVE", "DONE"];

function ph(arr) {
  return arr.map(() => "?").join(",");
}

exports.listSchedulesByCourse = async (req, res) => {
  try {
    const courseId = Number(req.query.course_id);

    if (!Number.isFinite(courseId) || courseId < 1) {
      return res.status(400).json({
        status: "error",
        message: "Valid course_id is required",
      });
    }

    // We use these placeholders multiple times
    const OCC_PH = ph(OCCUPYING);

    const [rows] = await pool.execute(
      `
      SELECT
        s.schedule_id AS id,
        s.course_id,
        c.course_name AS course,

        -- allow null trainer for TBA/pooling schedules
        s.trainer_id AS instructor_id,

        CASE
          WHEN s.trainer_id IS NULL THEN NULL
          ELSE CONCAT(t.firstname, ' ', t.lastname)
        END AS instructor,

        -- TBA handling
        CASE
          WHEN s.schedule_date IS NULL THEN 'TBA'
          WHEN YEAR(s.schedule_date) = 0 THEN 'TBA'
          ELSE DATE_FORMAT(s.schedule_date, '%Y-%m-%d')
        END AS date,

        CASE
          WHEN s.schedule_date IS NULL THEN NULL
          WHEN YEAR(s.schedule_date) = 0 THEN NULL
          ELSE DATE_FORMAT(s.schedule_date, '%a')
        END AS day,

        -- default times for display when TBA
        TIME_FORMAT(
          COALESCE(s.start_time, '08:00:00'),
          '%H:%i'
        ) AS startTime,

        TIME_FORMAT(
          COALESCE(s.end_time, '17:00:00'),
          '%H:%i'
        ) AS endTime,

        s.total_slots AS totalSlots,
        s.status AS scheduleStatus,

        -- count only occupying reservation statuses
        (
          SELECT COUNT(*)
          FROM tesda_schedule_reservations r
          WHERE r.schedule_id = s.schedule_id
            AND UPPER(r.reservation_status) IN (${OCC_PH})
        ) AS reservedCount,

        GREATEST(
          s.total_slots - (
            SELECT COUNT(*)
            FROM tesda_schedule_reservations r
            WHERE r.schedule_id = s.schedule_id
              AND UPPER(r.reservation_status) IN (${OCC_PH})
          ),
          0
        ) AS availableSlots,

        CASE
          -- TBA / walang schedule date
          WHEN s.schedule_date IS NULL
            THEN 'TBA'

          WHEN YEAR(s.schedule_date) = 0
            THEN 'TBA'

          -- manually closed
          WHEN LOWER(COALESCE(s.status, 'open')) = 'closed'
            THEN 'Closed'

          -- automatic close kapag tapos na ang date + end time
          WHEN TIMESTAMP(
            s.schedule_date,
            COALESCE(s.end_time, '17:00:00')
          ) < DATE_ADD(UTC_TIMESTAMP(), INTERVAL 8 HOUR)
            THEN 'Closed'

          -- full kapag walang slots
          WHEN s.total_slots <= 0
            THEN 'Full'

          WHEN GREATEST(
            s.total_slots - (
              SELECT COUNT(*)
              FROM tesda_schedule_reservations r
              WHERE r.schedule_id = s.schedule_id
                AND UPPER(r.reservation_status) IN (${OCC_PH})
            ),
            0
          ) = 0
            THEN 'Full'

          ELSE 'Open'
        END AS computedStatus,

        s.created_at,
        s.updated_at

      FROM tesda_schedules s

      JOIN tesda_courses c
        ON c.id = s.course_id

      LEFT JOIN trainers t
        ON t.trainer_id = s.trainer_id

      WHERE s.course_id = ?

      ORDER BY

        -- scheduled batches first, TBA batches last
        CASE
          WHEN s.schedule_date IS NULL THEN 1
          WHEN YEAR(s.schedule_date) = 0 THEN 1
          ELSE 0
        END ASC,

        s.schedule_date ASC,
        s.start_time ASC,
        s.schedule_id ASC
      `,
      [...OCCUPYING, ...OCCUPYING, ...OCCUPYING, courseId],
    );

    return res.json({
      status: "success",
      data: rows,
    });
  } catch (err) {
    console.error("listSchedulesByCourse error:", err);

    return res.status(500).json({
      status: "error",
      message: err.sqlMessage || err.message,
    });
  }
};
