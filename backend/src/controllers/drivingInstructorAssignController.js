const pool = require("../config/database");

exports.getDrivingInstructors = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT instructor_id, instructor_code, fullname, status
       FROM instructors
       WHERE status = 'active'
       ORDER BY fullname ASC`
    );

    return res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("getDrivingInstructors error:", err); // ✅ makita sa terminal
    return res.status(500).json({
      status: "error",
      message: "Failed to load instructors",
      debug: err.sqlMessage || err.message, // ✅ makita sa browser network response
    });
  }
};


exports.getDrivingCourseInstructors = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        dci.course_id,
        dci.instructor_id,
        i.fullname AS instructor_name,
        i.instructor_code,
        i.status
      FROM driving_course_instructors dci
      JOIN instructors i ON i.instructor_id = dci.instructor_id
      ORDER BY dci.course_id ASC
    `);

    return res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("getDrivingCourseInstructors error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load assignments",
      debug: err.sqlMessage || err.message,
    });
  }
};


exports.upsertDrivingCourseInstructor = async (req, res) => {
  try {
    const { course_id, instructor_id } = req.body;

    if (!course_id || !instructor_id) {
      return res.status(400).json({ status: "error", message: "course_id and instructor_id are required" });
    }

    // ✅ GUARD: block inactive instructors
    const [ins] = await pool.execute(
      `SELECT status FROM instructors WHERE instructor_id = ? LIMIT 1`,
      [instructor_id]
    );
    if (!ins.length || ins[0].status !== "active") {
      return res.status(400).json({ status: "error", message: "Cannot assign: instructor is not active" });
    }

    await pool.execute(
      `INSERT INTO driving_course_instructors (course_id, instructor_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE instructor_id = VALUES(instructor_id)`,
      [course_id, instructor_id]
    );

    return res.json({ status: "success", message: "Assigned successfully" });
  } catch (err) {
    console.error("upsertDrivingCourseInstructor error:", err);
    return res.status(500).json({ status: "error", message: "Failed to save assignment" });
  }
};
