// backend/src/controllers/instructorStudentsController.js
const pool = require("../config/database");

async function getInstructorIdFromSession(req) {
  const userId = req.session?.user_id;
  if (!userId) return { error: { code: 401, message: "Not authenticated" } };

  const [insRows] = await pool.execute(
    "SELECT instructor_id FROM instructors WHERE user_id = ? LIMIT 1",
    [userId],
  );

  if (!insRows.length) {
    return {
      error: {
        code: 404,
        message: "Instructor profile not found for this user_id",
      },
    };
  }

  return { instructorId: Number(insRows[0].instructor_id) };
}

/**
 * GET /api/instructor/students/list
 * Unique list of students handled by instructor (driving)
 * Based on schedules + schedule_reservations + users
 */
exports.getInstructorStudentsListOnly = async (req, res) => {
  try {
    const { instructorId, error } = await getInstructorIdFromSession(req);
    if (error)
      return res
        .status(error.code)
        .json({ status: "error", message: error.message });

    const [rows] = await pool.execute(
      `
      SELECT DISTINCT
        u.id AS id,
        COALESCE(u.fullname, u.username, u.email, '(no name)') AS name,
        u.email AS email,

        -- latest course name for this student under this instructor
        (
          SELECT COALESCE(c2.course_name, '(unknown course)')
          FROM schedule_reservations r2
          JOIN schedules s2 ON s2.schedule_id = r2.schedule_id
          LEFT JOIN courses c2 ON c2.id = COALESCE(s2.course_id, r2.course_id)
          WHERE s2.instructor_id = ?
            AND r2.student_id = u.id
            AND UPPER(COALESCE(r2.reservation_status,'')) != 'CANCELLED'
          ORDER BY r2.created_at DESC
          LIMIT 1
        ) AS course,

        -- latest reservation status for filtering (active/pending/inactive mapping happens in frontend)
        (
          SELECT LOWER(UPPER(COALESCE(r3.reservation_status,'pending')))
          FROM schedule_reservations r3
          JOIN schedules s3 ON s3.schedule_id = r3.schedule_id
          WHERE s3.instructor_id = ?
            AND r3.student_id = u.id
          ORDER BY r3.created_at DESC
          LIMIT 1
        ) AS status
      FROM schedules s
      JOIN schedule_reservations r ON r.schedule_id = s.schedule_id
      JOIN users u ON u.id = r.student_id
      WHERE s.instructor_id = ?
        AND UPPER(COALESCE(r.reservation_status,'')) != 'CANCELLED'
      ORDER BY name ASC
      `,
      [instructorId, instructorId, instructorId],
    );

    return res.json({
      status: "success",
      instructor_id: instructorId,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("getInstructorStudentsListOnly error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      debug: err.sqlMessage || err.message,
    });
  }
};

/**
 * GET /api/instructor/students
 * Detailed rows per reservation/schedule
 */
exports.getInstructorStudents = async (req, res) => {
  try {
    const { instructorId, error } = await getInstructorIdFromSession(req);
    if (error)
      return res
        .status(error.code)
        .json({ status: "error", message: error.message });

    const [rows] = await pool.execute(
      `
      SELECT
        u.id AS student_id,
        COALESCE(u.fullname, u.username, u.email, '(no name)') AS name,
        u.email,

        r.reservation_id,
        UPPER(COALESCE(r.reservation_status,'PENDING')) AS reservation_status,
        r.payment_method,
        r.requirements_mode,
        r.lto_client_id,
        r.picture_2x2,
        r.created_at AS reserved_at,

        s.schedule_id,
        s.schedule_date,
        TIME_FORMAT(s.start_time, '%H:%i') AS startTime,
        TIME_FORMAT(s.end_time, '%H:%i') AS endTime,
        LOWER(COALESCE(s.status, 'open')) AS schedule_status,

        COALESCE(c.course_name, '(unknown course)') AS course_name,
        c.course_code
      FROM schedules s
      JOIN schedule_reservations r ON r.schedule_id = s.schedule_id
      JOIN users u ON u.id = r.student_id
      LEFT JOIN courses c ON c.id = COALESCE(s.course_id, r.course_id)
      WHERE s.instructor_id = ?
        AND UPPER(COALESCE(r.reservation_status,'')) != 'CANCELLED'
      ORDER BY s.schedule_date DESC, s.start_time DESC
      `,
      [instructorId],
    );

    return res.json({
      status: "success",
      instructor_id: instructorId,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("getInstructorStudents error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      debug: err.sqlMessage || err.message,
    });
  }
};
