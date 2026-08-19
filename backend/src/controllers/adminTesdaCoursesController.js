// REPLACE WITH
const pool = require("../config/database");
const { sendNewCourseAnnouncement } = require("../services/emailService");

// helpers
function parseRequirements(reqValue) {
  if (Array.isArray(reqValue)) return reqValue;
  if (typeof reqValue === "string") {
    const s = reqValue.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      // if plain text
      return [s];
    }
  }
  return [];
}

async function notifyTesdaStudentsOfNewCourse(courseId, courseData) {
  const [students] = await pool.query(
    `SELECT u.id
     FROM users u
     JOIN tracks t ON t.track_id = u.track_id
     WHERE u.role = 'user' 
       AND t.track_code = 'tesda'
       AND u.email NOT LIKE '%@seedtest.local'`
  );

  if (!students.length) return;

  const values = students.map((s) => [
    s.id,
    "new_course",
    "New Course Available",
    courseData.course_name,
    courseId,
  ]);

  await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, reference_id) VALUES ?`,
    [values]
  );
}

// =========================
// GET TESDA COURSES
// GET /api/admin/tesda/courses
// =========================
async function getTesdaCourses(req, res) {
  try {
    // adjust table name if different
    const [rows] = await pool.execute(
      `SELECT 
        id, course_code, course_name, description, duration, requirements, status, created_at
       FROM tesda_courses
       ORDER BY id DESC`
    );

    const data = rows.map((r) => ({
      ...r,
      requirements: parseRequirements(r.requirements),
    }));

    return res.json({ status: "success", data });
  } catch (err) {
    console.error("getTesdaCourses error:", err);
    return res.status(500).json({ status: "error", message: "Failed to load TESDA courses" });
  }
}

// =========================
// CREATE TESDA COURSE
// POST /api/admin/tesda/courses
// body: {course_code, course_name, description, duration, requirements, status}
// =========================
async function createTesdaCourse(req, res) {
  try {
    const { course_code, course_name, description, duration, requirements, status } = req.body;

    if (!course_code || !course_name || !duration) {
      return res.status(400).json({
        status: "error",
        message: "course_code, course_name, and duration are required",
      });
    }

    const reqArr = parseRequirements(requirements);
    const reqJson = JSON.stringify(reqArr);

    const [result] = await pool.execute(
      `INSERT INTO tesda_courses (course_code, course_name, description, duration, requirements, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(course_code).trim(),
        String(course_name).trim(),
        description ? String(description).trim() : "",
        String(duration).trim(),
        reqJson,
        status ? String(status).trim() : "active",
      ]
    );

    const newCourseId = result.insertId;

    // ADD THIS — bell notification
    await notifyTesdaStudentsOfNewCourse(newCourseId, req.body).catch(err =>
      console.error('❌ TESDA notification insert error:', err)
    );

// REPLACE WITH
    console.log('🔥 About to send TESDA announcement');
    sendNewCourseAnnouncement(req.body, 'tesda').catch(err =>
      console.error('❌ TESDA announcement error:', err)
    );

    return res.status(201).json({
      status: "success",
      message: "TESDA course created",
      data: { id: newCourseId },
    });
  } catch (err) {
    console.error("createTesdaCourse error:", err);
    return res.status(500).json({ status: "error", message: "Failed to create TESDA course" });
  }
}

// =========================
// UPDATE TESDA COURSE
// PUT /api/admin/tesda/courses/:id
// =========================
async function updateTesdaCourse(req, res) {
  try {
    const { id } = req.params;
    const { course_code, course_name, description, duration, requirements, status } = req.body;

    if (!id) return res.status(400).json({ status: "error", message: "Missing id" });

    const reqArr = parseRequirements(requirements);
    const reqJson = JSON.stringify(reqArr);

    const [result] = await pool.execute(
      `UPDATE tesda_courses
       SET course_code = ?, course_name = ?, description = ?, duration = ?, requirements = ?, status = ?
       WHERE id = ?`,
      [
        String(course_code || "").trim(),
        String(course_name || "").trim(),
        description ? String(description).trim() : "",
        String(duration || "").trim(),
        reqJson,
        status ? String(status).trim() : "active",
        Number(id),
      ]
    );

    return res.json({
      status: "success",
      message: result.affectedRows ? "TESDA course updated" : "No changes",
    });
  } catch (err) {
    console.error("updateTesdaCourse error:", err);
    return res.status(500).json({ status: "error", message: "Failed to update TESDA course" });
  }
}

// =========================
// DELETE TESDA COURSE
// DELETE /api/admin/tesda/courses/:id
// =========================
async function deleteTesdaCourse(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ status: "error", message: "Missing id" });

    const [result] = await pool.execute(`DELETE FROM tesda_courses WHERE id = ?`, [Number(id)]);

    return res.json({
      status: "success",
      message: result.affectedRows ? "TESDA course deleted" : "Course not found",
    });
  } catch (err) {
    console.error("deleteTesdaCourse error:", err);
    return res.status(500).json({ status: "error", message: "Failed to delete TESDA course" });
  }
}

async function upsertTesdaAssignment(req, res) {
  try {
    const course_id = Number(req.body.course_id);
    const trainer_id = Number(req.body.trainer_id);

    if (!course_id || !trainer_id) {
      return res.status(400).json({ status: "error", message: "course_id and trainer_id are required" });
    }

    const [trn] = await pool.execute(
      `SELECT status FROM trainers WHERE trainer_id = ? LIMIT 1`,
      [trainer_id]
    );
    if (!trn.length || trn[0].status !== "active") {
      return res.status(400).json({ status: "error", message: "Cannot assign: trainer is not active" });
    }

    await pool.execute(
      `INSERT INTO tesda_course_trainers (course_id, trainer_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE trainer_id = VALUES(trainer_id), updated_at = CURRENT_TIMESTAMP`,
      [course_id, trainer_id]
    );

    res.json({ status: "success", message: "TESDA trainer assigned" });
  } catch (err) {
    console.error("upsertTesdaAssignment error:", err);
    res.status(500).json({ status: "error", message: "Failed to assign TESDA trainer" });
  }
}

module.exports = {
  getTesdaCourses,
  createTesdaCourse,
  updateTesdaCourse,
  deleteTesdaCourse,
  upsertTesdaAssignment,
};