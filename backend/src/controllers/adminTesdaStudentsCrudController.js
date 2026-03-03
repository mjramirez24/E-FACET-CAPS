const pool = require("../config/database");

function safeInt(v, def = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function safeStr(v) {
  return typeof v === "string" ? v.trim() : "";
}

function makeUsername(fullname, email) {
  // must be non-empty + unique-ish
  const base =
    safeStr(email).split("@")[0] ||
    safeStr(fullname).toLowerCase().replace(/\s+/g, "").slice(0, 12) ||
    "tesdastudent";

  const suffix =
    Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);
  return `${base}_${suffix}`.replace(/[^a-zA-Z0-9_]/g, "");
}

async function pickAssignedTrainer(conn, courseId) {
  if (!courseId) return null;

  const [[row]] = await conn.execute(
    `SELECT trainer_id
     FROM tesda_course_trainers
     WHERE course_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [courseId],
  );
  if (row?.trainer_id) return row.trainer_id;

  const [[anyTr]] = await conn.execute(
    `SELECT trainer_id FROM trainers ORDER BY trainer_id ASC LIMIT 1`,
    [],
  );
  return anyTr?.trainer_id || null;
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

    const email = safeStr(req.body.email) || null;
    const birthdate = req.body.birthdate || null;
    const sex = safeStr(req.body.sex) || null;

    // ✅ FIX: username required/unique in your DB
    const username = makeUsername(full_name, email);

    // 1) create user
    const [uRes] = await conn.execute(
      `INSERT INTO users (fullname, username, email, birthday, gender, role, created_at)
      VALUES (?, ?, ?, ?, ?, 'USER', NOW())`,
      [full_name, username, email, birthdate, sex],
    );
    const studentId = uRes.insertId;

    // 2) validate course
    const courseId = safeInt(req.body.course_id);
    if (!courseId) {
      await conn.rollback();
      return res
        .status(400)
        .json({ status: "error", message: "course_id required" });
    }

    // 3) schedule (use existing schedule_id OR create)
    const incomingScheduleId = safeInt(req.body.schedule_id);
    let scheduleId = incomingScheduleId;

    if (!scheduleId) {
      const scheduleDate = req.body.course_start || null;
      const startTime = req.body.start_time || "08:00:00";
      const endTime = req.body.end_time || "17:00:00";
      const totalSlots = safeInt(req.body.total_slots, 1) ?? 1;

      const trainerId = await pickAssignedTrainer(conn, courseId);
      if (!trainerId) {
        await conn.rollback();
        return res.status(400).json({
          status: "error",
          message:
            "No trainer available for this course. Assign a trainer to the course first.",
        });
      }

      const [sRes] = await conn.execute(
        `INSERT INTO tesda_schedules
          (course_id, trainer_id, schedule_date, start_time, end_time, total_slots, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
        [courseId, trainerId, scheduleDate, startTime, endTime, totalSlots],
      );
      scheduleId = sRes.insertId;
    }

    // 4) reservation
    const status = safeStr(req.body.status).toUpperCase() || "CONFIRMED";
    const source = safeStr(req.body.source).toUpperCase() || "ONLINE";

    await conn.execute(
      `INSERT INTO tesda_schedule_reservations
        (schedule_id, student_id, reservation_status, reservation_source, created_at)
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

    // user info
    const full_name = safeStr(req.body.full_name);
    const email = safeStr(req.body.email) || null;
    const birthdate = req.body.birthdate || null;
    const sex = safeStr(req.body.sex) || null;

    if (full_name || email || birthdate || sex) {
      await conn.execute(
        `UPDATE users
         SET fullname = COALESCE(?, fullname),
             email = COALESCE(?, email),
             birthday = COALESCE(?, birthday),
             gender = COALESCE(?, gender)
         WHERE id = ?`,
        [full_name || null, email, birthdate, sex || null, r.student_id],
      );
    }

    // schedule update
    const courseId = safeInt(req.body.course_id);
    const scheduleDate = req.body.course_start || null;

    let trainerId = null;
    if (courseId) trainerId = await pickAssignedTrainer(conn, courseId);

    if (courseId || scheduleDate || trainerId) {
      await conn.execute(
        `UPDATE tesda_schedules
         SET course_id = COALESCE(?, course_id),
             schedule_date = COALESCE(?, schedule_date),
             trainer_id = COALESCE(?, trainer_id)
         WHERE schedule_id = ?`,
        [courseId || null, scheduleDate, trainerId || null, r.schedule_id],
      );
    }

    // reservation update
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
