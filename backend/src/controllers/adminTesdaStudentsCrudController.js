const pool = require("../config/database");

function safeInt(v, def = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function safeStr(v) {
  return typeof v === "string" ? v.trim() : "";
}

exports.createTesdaStudent = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const full_name = safeStr(req.body.full_name);
    if (!full_name) {
      await conn.rollback();
      return res
        .status(400)
        .json({ status: "error", message: "Full name required" });
    }

    // 1) ensure user exists (simple: create a user record for tesda student)
    // If you already have users creation logic, adapt this part.
    const email = safeStr(req.body.email) || null;
    const birthdate = req.body.birthdate || null;
    const sex = safeStr(req.body.sex) || null;

    // create user
    const [uRes] = await conn.execute(
      `INSERT INTO users (fullname, email, birthday, gender, role, created_at)
       VALUES (?, ?, ?, ?, 'STUDENT', NOW())`,
      [full_name, email, birthdate, sex],
    );
    const studentId = uRes.insertId;

    // 2) create TESDA schedule row (because TESDA is schedule-based)
    const courseId = safeInt(req.body.course_id);
    if (!courseId) {
      await conn.rollback();
      return res
        .status(400)
        .json({ status: "error", message: "course_id required" });
    }

    const scheduleDate = req.body.course_start || null;
    const startTime = req.body.start_time || "08:00:00";
    const endTime = req.body.end_time || "17:00:00";

    const [sRes] = await conn.execute(
      `INSERT INTO tesda_schedules (course_id, trainer_id, schedule_date, start_time, end_time, total_slots, status, created_at)
       VALUES (?, NULL, ?, ?, ?, 0, 'active', NOW())`,
      [courseId, scheduleDate, startTime, endTime],
    );
    const scheduleId = sRes.insertId;

    // 3) create reservation linking user + schedule
    const status = safeStr(req.body.status).toUpperCase() || "CONFIRMED";
    const source = safeStr(req.body.source).toUpperCase() || "ONLINE";

    await conn.execute(
      `INSERT INTO tesda_schedule_reservations (schedule_id, student_id, reservation_status, reservation_source, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [scheduleId, studentId, status, source],
    );

    await conn.commit();
    return res.json({ status: "success" });
  } catch (err) {
    await conn.rollback();
    console.error("createTesdaStudent error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to create TESDA student",
      debug: err.sqlMessage || err.message,
    });
  } finally {
    conn.release();
  }
};

exports.updateTesdaStudent = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const reservationId = safeInt(req.params.id);
    if (!reservationId) {
      await conn.rollback();
      return res
        .status(400)
        .json({ status: "error", message: "Invalid reservation id" });
    }

    // find reservation
    const [[r]] = await conn.execute(
      `SELECT reservation_id, student_id, schedule_id
       FROM tesda_schedule_reservations
       WHERE reservation_id = ? LIMIT 1`,
      [reservationId],
    );
    if (!r) {
      await conn.rollback();
      return res
        .status(404)
        .json({ status: "error", message: "Reservation not found" });
    }

    // update user basic info
    const full_name = safeStr(req.body.full_name);
    const email = safeStr(req.body.email) || null;
    const birthdate = req.body.birthdate || null;
    const sex = safeStr(req.body.sex) || null;

    if (full_name) {
      await conn.execute(
        `UPDATE users SET fullname=?, email=?, birthday=?, gender=? WHERE id=?`,
        [full_name, email, birthdate, sex, r.student_id],
      );
    }

    // update schedule date/course
    const courseId = safeInt(req.body.course_id);
    const scheduleDate = req.body.course_start || null;

    if (courseId || scheduleDate) {
      await conn.execute(
        `UPDATE tesda_schedules
         SET course_id = COALESCE(?, course_id),
             schedule_date = COALESCE(?, schedule_date)
         WHERE schedule_id = ?`,
        [courseId || null, scheduleDate || null, r.schedule_id],
      );
    }

    // update reservation status/source
    const status = safeStr(req.body.status).toUpperCase();
    const source = safeStr(req.body.source).toUpperCase();

    await conn.execute(
      `UPDATE tesda_schedule_reservations
       SET reservation_status = COALESCE(?, reservation_status),
           reservation_source = COALESCE(?, reservation_source),
           updated_at = NOW()
       WHERE reservation_id = ?`,
      [status || null, source || null, reservationId],
    );

    await conn.commit();
    return res.json({ status: "success" });
  } catch (err) {
    await conn.rollback();
    console.error("updateTesdaStudent error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to update TESDA student",
      debug: err.sqlMessage || err.message,
    });
  } finally {
    conn.release();
  }
};

exports.deleteTesdaStudent = async (req, res) => {
  try {
    const reservationId = safeInt(req.params.id);
    if (!reservationId) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid reservation id" });
    }

    // soft delete pattern: mark cancelled (recommended)
    await pool.execute(
      `UPDATE tesda_schedule_reservations
       SET reservation_status = 'CANCELLED', updated_at = NOW()
       WHERE reservation_id = ?`,
      [reservationId],
    );

    return res.json({ status: "success" });
  } catch (err) {
    console.error("deleteTesdaStudent error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete TESDA student",
      debug: err.sqlMessage || err.message,
    });
  }
};
