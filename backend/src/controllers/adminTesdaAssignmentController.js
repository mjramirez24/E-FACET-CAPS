// backend/src/controllers/adminTesdaAssignmentController.js
const pool = require("../config/database");

// ✅ USE THE SAME TABLE EVERYWHERE
// columns: course_id, trainer_id, created_at?, updated_at?
const ASSIGN_TABLE = "tesda_course_trainers";
const COURSES_TABLE = "tesda_courses";

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * GET /api/admin/tesda/course-trainers
 * Optional query:
 *  - course_id
 *  - trainer_id
 */
async function getCourseTrainers(req, res) {
  try {
    const courseId = toInt(req.query.course_id);
    const trainerId = toInt(req.query.trainer_id);

    const where = [];
    const params = [];

    if (courseId) {
      where.push("a.course_id = ?");
      params.push(courseId);
    }
    if (trainerId) {
      where.push("a.trainer_id = ?");
      params.push(trainerId);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.execute(
      `
      SELECT
        a.course_id,
        c.course_name,
        c.course_code,
        a.trainer_id,
        t.trainer_code,
        CONCAT(t.firstname, ' ', t.lastname) AS trainer_name
      FROM ${ASSIGN_TABLE} a
      LEFT JOIN ${COURSES_TABLE} c ON c.id = a.course_id
      LEFT JOIN trainers t ON t.trainer_id = a.trainer_id
      ${whereSql}
      ORDER BY a.course_id ASC, a.trainer_id ASC
      `,
      params,
    );

    return res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("getCourseTrainers error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load TESDA assignments",
      debug: {
        code: err.code,
        sqlMessage: err.sqlMessage,
        message: err.message,
      },
    });
  }
}

/**
 * POST /api/admin/tesda/course-trainers
 * body: { course_id, trainer_id }
 *
 * ✅ many-to-many: insert mapping
 * requires UNIQUE(course_id, trainer_id) OR use INSERT IGNORE.
 */
async function assignTrainerToCourse(req, res) {
  try {
    const course_id = toInt(req.body.course_id);
    const trainer_id = toInt(req.body.trainer_id);

    if (!course_id || !trainer_id) {
      return res.status(400).json({
        status: "error",
        message: "course_id and trainer_id are required",
      });
    }

    // validate course exists
    const [cRows] = await pool.execute(
      `SELECT id FROM ${COURSES_TABLE} WHERE id=? LIMIT 1`,
      [course_id],
    );
    if (!cRows.length) {
      return res
        .status(404)
        .json({ status: "error", message: "Course not found" });
    }

    // validate trainer exists
    const [tRows] = await pool.execute(
      `SELECT trainer_id FROM trainers WHERE trainer_id=? LIMIT 1`,
      [trainer_id],
    );
    if (!tRows.length) {
      return res
        .status(404)
        .json({ status: "error", message: "Trainer not found" });
    }

    // ✅ safest: INSERT IGNORE (works if unique composite exists)
    await pool.execute(
      `INSERT IGNORE INTO ${ASSIGN_TABLE} (course_id, trainer_id) VALUES (?, ?)`,
      [course_id, trainer_id],
    );

    return res.json({
      status: "success",
      message: "Trainer assigned to course",
    });
  } catch (err) {
    console.error("assignTrainerToCourse error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to assign trainer",
      debug: {
        code: err.code,
        sqlMessage: err.sqlMessage,
        message: err.message,
      },
    });
  }
}

/**
 * DELETE /api/admin/tesda/course-trainers
 * body OR query: { course_id, trainer_id }
 *
 * ✅ remove specific mapping (not whole course)
 */
async function removeTrainerFromCourse(req, res) {
  try {
    const course_id = toInt(req.body.course_id ?? req.query.course_id);
    const trainer_id = toInt(req.body.trainer_id ?? req.query.trainer_id);

    if (!course_id || !trainer_id) {
      return res.status(400).json({
        status: "error",
        message: "course_id and trainer_id are required",
      });
    }

    const [result] = await pool.execute(
      `DELETE FROM ${ASSIGN_TABLE} WHERE course_id = ? AND trainer_id = ?`,
      [course_id, trainer_id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        status: "error",
        message: "Assignment not found",
      });
    }

    return res.json({ status: "success", message: "Assignment removed" });
  } catch (err) {
    console.error("removeTrainerFromCourse error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to remove assignment",
      debug: {
        code: err.code,
        sqlMessage: err.sqlMessage,
        message: err.message,
      },
    });
  }
}

module.exports = {
  getCourseTrainers,
  assignTrainerToCourse,
  removeTrainerFromCourse,
};
