const pool = require("../config/database");

function getSessionUserId(req) {
  const v = req?.session?.user_id ?? req?.session?.userId ?? req?.session?.id;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "APPROVED", "ACTIVE"];
const COMPLETED_STATUSES = [
  "DONE",
  "COMPLETED",
  "FINISHED",
  "CERTIFICATE_ISSUED",
];

function isPositiveInt(x) {
  const n = Number(x);
  return Number.isFinite(n) && n > 0 && Number.isInteger(n);
}

exports.createReservation = async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const studentId = getSessionUserId(req);

    if (!studentId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated",
      });
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

    if (hasSchedule) {
      scheduleId = bodyScheduleId;

      const [schedRows] = await conn.execute(
        `
        SELECT schedule_id, course_id, schedule_date
        FROM tesda_schedules
        WHERE schedule_id = ?
        LIMIT 1
        `,
        [scheduleId],
      );

      if (!schedRows.length) {
        await conn.rollback();
        return res.status(404).json({
          status: "error",
          message: "Schedule not found",
        });
      }

      courseId = Number(schedRows[0].course_id);

      if (!isPositiveInt(courseId)) {
        await conn.rollback();
        return res.status(400).json({
          status: "error",
          message: "Invalid schedule course_id",
        });
      }

      if (schedRows[0].schedule_date) {
        const schedDate = new Date(schedRows[0].schedule_date);
        const today = new Date();

        schedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (schedDate < today) {
          await conn.rollback();
          return res.status(400).json({
            status: "error",
            message: "Cannot enroll. This schedule has already passed.",
          });
        }
      }
    } else {
      courseId = bodyCourseId;

      const [courseRows] = await conn.execute(
        `
        SELECT id
        FROM tesda_courses
        WHERE id = ?
        LIMIT 1
        `,
        [courseId],
      );

      if (!courseRows.length) {
        await conn.rollback();
        return res.status(404).json({
          status: "error",
          message: "Course not found",
        });
      }

      scheduleId = null;
    }

    // ✅ GLOBAL BLOCK:
    // bawal mag-enroll sa kahit anong TESDA course
    // kapag may ongoing reservation pa.
    const [activeRows] = await conn.execute(
      `
      SELECT
        r.reservation_id,
        r.reservation_status,
        b.course_id,
        c.course_name
      FROM tesda_schedule_reservations r
      JOIN tesda_batches b ON b.batch_id = r.batch_id
      JOIN tesda_courses c ON c.id = b.course_id
      WHERE r.student_id = ?
        AND UPPER(r.reservation_status) IN ('PENDING','CONFIRMED','APPROVED','ACTIVE')
      ORDER BY r.reservation_id DESC
      LIMIT 1
      `,
      [studentId],
    );

    if (activeRows.length) {
      await conn.rollback();

      const active = activeRows[0];

      return res.status(400).json({
        status: "error",
        message: `You already have an ongoing enrollment in ${active.course_name}. Finish or cancel it first before enrolling again.`,
        active_reservation_id: active.reservation_id,
        active_course_id: active.course_id,
        active_course_name: active.course_name,
        active_status: active.reservation_status,
      });
    }

    // ✅ Previous reservations for SAME course only
    // Ginagamit lang ito para malaman kung RETAKE.
    const [previousRows] = await conn.execute(
      `
      SELECT
        r.reservation_id,
        r.reservation_status
      FROM tesda_schedule_reservations r
      JOIN tesda_batches b ON b.batch_id = r.batch_id
      WHERE r.student_id = ?
        AND b.course_id = ?
      ORDER BY r.reservation_id DESC
      `,
      [studentId, courseId],
    );

    const completedCount = previousRows.filter((r) =>
      COMPLETED_STATUSES.includes(
        String(r.reservation_status || "").toUpperCase(),
      ),
    ).length;

    const isRetake = completedCount > 0;
    const attemptNo = completedCount + 1;

    // ✅ Find open batch
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

    const notes = isRetake
      ? `RETAKE enrollment. Attempt #${attemptNo}`
      : `FIRST enrollment. Attempt #${attemptNo}`;

    // ✅ Insert reservation
    const [insertRes] = await conn.execute(
      `
      INSERT INTO tesda_schedule_reservations
        (schedule_id, student_id, batch_id, reservation_source, reservation_status, notes)
      VALUES (?, ?, ?, 'ONLINE', 'PENDING', ?)
      `,
      [scheduleId, studentId, batchId, notes],
    );

    // ✅ Update batch count
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
      message: isRetake
        ? `Retake reservation created. Assigned to Batch ${batchNo}.`
        : `Reservation created. Assigned to Batch ${batchNo}.`,
      reservation_id: insertRes.insertId,
      schedule_id: scheduleId,
      course_id: courseId,
      batch_no: batchNo,
      is_retake: isRetake,
      attempt_no: attemptNo,
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}

    console.error("createReservation error:", err);

    return res.status(500).json({
      status: "error",
      message: err.sqlMessage || err.message || "Failed to create reservation",
    });
  } finally {
    conn.release();
  }
};

exports.myReservations = async (req, res) => {
  try {
    const studentId = getSessionUserId(req);

    if (!studentId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated",
      });
    }

    const [rows] = await pool.execute(
      `
      SELECT
        r.reservation_id,
        r.reservation_status,
        r.created_at,
        r.notes,

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
      is_retake: String(r.notes || "")
        .toUpperCase()
        .includes("RETAKE"),
    }));

    return res.json({
      status: "success",
      data: formatted,
    });
  } catch (err) {
    console.error("myReservations error:", err);

    return res.status(500).json({
      status: "error",
      message: "Failed to load reservations",
    });
  }
};
