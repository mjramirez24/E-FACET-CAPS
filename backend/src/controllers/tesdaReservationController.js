const pool = require("../config/database");

function getSessionUserId(req) {
  const v = req?.session?.user_id ?? req?.session?.userId ?? req?.session?.id;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// statuses considered active / blocking duplicates
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "APPROVED", "ACTIVE"];

function isPositiveInt(x) {
  const n = Number(x);
  return Number.isFinite(n) && n > 0 && Number.isInteger(n);
}

/**
 * CREATE RESERVATION (Batch-Based)
 * Accepts:
 *  - { course_id }       -> pooling batch (schedule_id NULL)
 *  - { schedule_id }     -> scheduled (derive course_id from schedule)
 */
exports.createReservation = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const studentId = getSessionUserId(req);
    if (!studentId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not authenticated" });
    }

    const bodyCourseId = Number(req.body.course_id || 0);
    const bodyScheduleId = Number(req.body.schedule_id || 0);

    const hasCourse = isPositiveInt(bodyCourseId);
    const hasSchedule = isPositiveInt(bodyScheduleId);

    if (!hasCourse && !hasSchedule) {
      return res.status(400).json({
        status: "error",
        message: "course_id or schedule_id is required",
      });
    }

    await conn.beginTransaction();

    let courseId = null;
    let scheduleId = null;

    // If schedule_id is provided, derive course_id from tesda_schedules
    if (hasSchedule) {
      scheduleId = Number(bodyScheduleId);

      const [schedRows] = await conn.execute(
        `
        SELECT s.schedule_id, s.course_id
        FROM tesda_schedules s
        WHERE s.schedule_id = ?
        LIMIT 1
        `,
        [scheduleId],
      );

      if (!schedRows.length) {
        await conn.rollback();
        return res
          .status(404)
          .json({ status: "error", message: "Schedule not found" });
      }

      courseId = Number(schedRows[0].course_id);
      if (!isPositiveInt(courseId)) {
        await conn.rollback();
        return res
          .status(400)
          .json({ status: "error", message: "Invalid schedule course_id" });
      }
    } else {
      // pooling by course_id
      courseId = Number(bodyCourseId);

      const [courseRows] = await conn.execute(
        `SELECT id FROM tesda_courses WHERE id = ? LIMIT 1`,
        [courseId],
      );

      if (!courseRows.length) {
        await conn.rollback();
        return res
          .status(404)
          .json({ status: "error", message: "Course not found" });
      }

      // pooling has no schedule_id yet
      scheduleId = null; // IMPORTANT: requires DB nullable schedule_id
    }

    // Prevent duplicate active reservation for same course
    const [existing] = await conn.execute(
      `
      SELECT r.reservation_id
      FROM tesda_schedule_reservations r
      JOIN tesda_batches b ON b.batch_id = r.batch_id
      WHERE r.student_id = ?
        AND b.course_id = ?
        AND UPPER(r.reservation_status) IN ('PENDING','CONFIRMED','APPROVED','ACTIVE')
      LIMIT 1
      `,
      [studentId, courseId],
    );

    if (existing.length) {
      await conn.rollback();
      return res.status(400).json({
        status: "error",
        message: "You already have an active reservation for this course.",
      });
    }

    // Find OPEN batch (lock row)
    const [openBatch] = await conn.execute(
      `
      SELECT batch_id, batch_no, capacity, reserved_count, status
      FROM tesda_batches
      WHERE course_id = ?
        AND status = 'OPEN'
        AND reserved_count < capacity
      ORDER BY batch_no ASC
      LIMIT 1
      FOR UPDATE
      `,
      [courseId],
    );

    let batchId;
    let batchNo;

    if (openBatch.length) {
      batchId = openBatch[0].batch_id;
      batchNo = openBatch[0].batch_no;
    } else {
      // Create new batch (lock max batch_no)
      const [maxBatch] = await conn.execute(
        `
        SELECT COALESCE(MAX(batch_no), 0) AS maxNo
        FROM tesda_batches
        WHERE course_id = ?
        FOR UPDATE
        `,
        [courseId],
      );

      batchNo = Number(maxBatch[0].maxNo || 0) + 1;

      const [newBatch] = await conn.execute(
        `
        INSERT INTO tesda_batches
          (course_id, batch_no, capacity, reserved_count, status)
        VALUES (?, ?, 25, 0, 'OPEN')
        `,
        [courseId, batchNo],
      );

      batchId = newBatch.insertId;
    }

    // Insert reservation
    // NOTE: schedule_id NULL allowed for pooling (TBA)
    const [insertRes] = await conn.execute(
      `
      INSERT INTO tesda_schedule_reservations
        (schedule_id, student_id, batch_id, reservation_source, reservation_status, notes)
      VALUES (?, ?, ?, 'ONLINE', 'PENDING', NULL)
      `,
      [scheduleId, studentId, batchId],
    );

    // Increment batch counter
    await conn.execute(
      `
      UPDATE tesda_batches
      SET reserved_count = reserved_count + 1,
          status = CASE
            WHEN reserved_count + 1 >= capacity THEN 'FULL'
            ELSE status
          END
      WHERE batch_id = ?
      `,
      [batchId],
    );

    await conn.commit();

    return res.json({
      status: "success",
      message: scheduleId
        ? `Reservation assigned to Batch ${batchNo} (Scheduled)`
        : `Reservation assigned to Batch ${batchNo} (Schedule TBA)`,
      batch_no: batchNo,
      reservation_id: insertRes.insertId,
      schedule_id: scheduleId, // can be null if pooling
      course_id: courseId,
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    console.error("createReservation error:", err);

    if (String(err.code) === "ER_DUP_ENTRY") {
      return res.status(400).json({
        status: "error",
        message: "Duplicate reservation.",
      });
    }

    return res.status(500).json({
      status: "error",
      message: err.sqlMessage || err.message,
    });
  } finally {
    conn.release();
  }
};

/**
 * MY RESERVATIONS
 * Shows schedule if assigned, otherwise TBA
 */
exports.myReservations = async (req, res) => {
  try {
    const studentId = getSessionUserId(req);
    if (!studentId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not authenticated" });
    }

    const [rows] = await pool.execute(
      `
      SELECT
        r.reservation_id,
        r.reservation_status,
        r.created_at,

        b.batch_no,
        b.status AS batch_status,
        b.course_id,

        r.schedule_id,
        DATE_FORMAT(s.schedule_date, '%Y-%m-%d') AS schedule_date,
        TIME_FORMAT(s.start_time, '%H:%i') AS startTime,
        TIME_FORMAT(s.end_time, '%H:%i') AS endTime,

        c.course_name

      FROM tesda_schedule_reservations r
      JOIN tesda_batches b ON b.batch_id = r.batch_id
      JOIN tesda_courses c ON c.id = b.course_id
      LEFT JOIN tesda_schedules s ON s.schedule_id = r.schedule_id

      WHERE r.student_id = ?
      ORDER BY r.created_at DESC
      `,
      [studentId],
    );

    const formatted = rows.map((r) => ({
      ...r,
      schedule_date: r.schedule_date || "TBA",
      startTime: r.startTime || "TBA",
      endTime: r.endTime || "",
    }));

    return res.json({ status: "success", data: formatted });
  } catch (err) {
    console.error("myReservations error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load reservations",
    });
  }
};
