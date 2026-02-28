// src/controllers/studentRequirementsController.js
const pool = require("../config/database");

// statuses that indicate "active" / occupying
const OCCUPYING_STATUSES = ["PENDING", "CONFIRMED", "APPROVED", "ACTIVE"];

const toYMD = (dateLike) => {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDaysYMD = (ymd, days) => {
  const d = new Date(`${String(ymd)}T00:00:00`);
  d.setDate(d.getDate() + Number(days || 0));
  return toYMD(d);
};

const ph = (arr) => arr.map(() => "?").join(",");

// ✅ detect 2-day package by course_code (same logic as your reservation controller)
function isTwoDayCourseByCode(course_code) {
  const code = String(course_code || "")
    .trim()
    .toUpperCase();
  return code === "PDC-AB" || code === "TDC";
}

/**
 * POST /api/student/reservations/:reservationId/requirements
 * multipart/form-data (multer fields):
 *  - picture_2x2 (single) ✅ REQUIRED
 *  - requirement_ids (repeat per file OR array) (optional unless files present)
 *  - files (repeat per file) field name = "files" (optional)
 *
 * ✅ NEW BEHAVIOR:
 * - Always saves 2x2 on Day 1 reservation
 * - If course is 2-day package, auto finds Day 2 sibling reservation and also sets picture_2x2 there
 */
exports.uploadRequirements = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = Number(req.session?.user_id);
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const reservationId = Number(req.params.reservationId);
    if (!Number.isFinite(reservationId) || reservationId < 1) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid reservation id" });
    }

    // multer .fields() shape: req.files = { picture_2x2:[file], files:[...] }
    const twoByTwo = req.files?.picture_2x2?.[0] || null;
    const files = Array.isArray(req.files?.files) ? req.files.files : [];

    // normalize requirement_ids
    const raw = req.body?.requirement_ids;
    let requirementIds = Array.isArray(raw) ? raw : raw ? [raw] : [];
    requirementIds = requirementIds
      .map((x) => String(x ?? "").trim())
      .filter((x) => x.length > 0);

    // ✅ 2x2 ALWAYS REQUIRED
    if (!twoByTwo) {
      return res
        .status(400)
        .json({ status: "error", message: "picture_2x2 is required" });
    }

    // ✅ if other requirement files exist => must have requirement_ids and match counts
    if (files.length > 0) {
      if (!requirementIds.length) {
        return res
          .status(400)
          .json({ status: "error", message: "requirement_ids is required" });
      }
      if (files.length !== requirementIds.length) {
        return res.status(400).json({
          status: "error",
          message: "Files count must match requirement_ids count",
        });
      }
    }

    await conn.beginTransaction();

    // ✅ get day1 reservation context + ownership
    // We need schedule_date/time/instructor to find sibling (day2)
    const [rRows] = await conn.execute(
      `
      SELECT
        r.reservation_id,
        r.student_id,
        r.course_id,
        r.schedule_id,
        s.instructor_id,
        DATE_FORMAT(s.schedule_date, '%Y-%m-%d') AS schedule_date,
        TIME_FORMAT(s.start_time, '%H:%i') AS startTime,
        TIME_FORMAT(s.end_time, '%H:%i') AS endTime,
        c.course_code
      FROM schedule_reservations r
      JOIN schedules s ON s.schedule_id = r.schedule_id
      LEFT JOIN courses c ON c.id = COALESCE(s.course_id, r.course_id)
      WHERE r.reservation_id = ?
        AND r.student_id = ?
      LIMIT 1
      `,
      [reservationId, userId],
    );

    if (!rRows.length) {
      await conn.rollback();
      return res.status(403).json({ status: "error", message: "Not allowed" });
    }

    const r0 = rRows[0];
    const isTwoDay = isTwoDayCourseByCode(r0.course_code);

    // ✅ save 2x2 path for day1
    const picturePath = `/uploads/2x2/${twoByTwo.filename}`;

    await conn.execute(
      `
      UPDATE schedule_reservations
      SET picture_2x2 = ?, updated_at = NOW()
      WHERE reservation_id = ? AND student_id = ?
      `,
      [picturePath, reservationId, userId],
    );

    // ✅ if 2-day, also update sibling reservation's picture_2x2
    let siblingReservationId = null;

    if (isTwoDay) {
      const day2 = addDaysYMD(r0.schedule_date, 1);

      // Find sibling reservation row (same student, next day, same time & instructor, active-ish)
      // We don't strictly require status filter, but it's safer to match occupying statuses
      const [sibRows] = await conn.execute(
        `
        SELECT r.reservation_id
        FROM schedule_reservations r
        JOIN schedules s ON s.schedule_id = r.schedule_id
        WHERE r.student_id = ?
          AND r.course_id = ?
          AND s.instructor_id = ?
          AND DATE_FORMAT(s.schedule_date, '%Y-%m-%d') = ?
          AND TIME_FORMAT(s.start_time, '%H:%i') = ?
          AND TIME_FORMAT(s.end_time, '%H:%i') = ?
          AND r.reservation_id <> ?
        ORDER BY r.created_at DESC
        LIMIT 1
        `,
        [
          userId,
          Number(r0.course_id),
          Number(r0.instructor_id),
          day2,
          r0.startTime,
          r0.endTime,
          reservationId,
        ],
      );

      if (sibRows.length) {
        siblingReservationId = Number(sibRows[0].reservation_id);

        await conn.execute(
          `
          UPDATE schedule_reservations
          SET picture_2x2 = ?, updated_at = NOW()
          WHERE reservation_id = ? AND student_id = ?
          `,
          [picturePath, siblingReservationId, userId],
        );
      }
    }

    // ✅ save other requirements (optional)
    for (let i = 0; i < files.length; i++) {
      const rid = Number(requirementIds[i]);
      if (!Number.isFinite(rid) || rid < 1) {
        await conn.rollback();
        return res
          .status(400)
          .json({ status: "error", message: "Invalid requirement id" });
      }

      const f = files[i];
      const filePath = `/uploads/requirements/${f.filename}`;

      // overwrite per reservation+requirement
      await conn.execute(
        `DELETE FROM requirement_submissions WHERE reservation_id = ? AND requirement_id = ?`,
        [reservationId, rid],
      );

      await conn.execute(
        `
        INSERT INTO requirement_submissions
          (reservation_id, requirement_id, file_path, created_at)
        VALUES (?, ?, ?, NOW())
        `,
        [reservationId, rid, filePath],
      );

      // OPTIONAL: if gusto mo rin i-copy to Day 2, uncomment below
      // if (siblingReservationId) {
      //   await conn.execute(
      //     `DELETE FROM requirement_submissions WHERE reservation_id = ? AND requirement_id = ?`,
      //     [siblingReservationId, rid],
      //   );
      //   await conn.execute(
      //     `
      //     INSERT INTO requirement_submissions
      //       (reservation_id, requirement_id, file_path, created_at)
      //     VALUES (?, ?, ?, NOW())
      //     `,
      //     [siblingReservationId, rid, filePath],
      //   );
      // }
    }

    // ✅ requirements_mode: only force online if may other files
    if (files.length > 0) {
      await conn.execute(
        `
        UPDATE schedule_reservations
        SET requirements_mode = 'online', updated_at = NOW()
        WHERE reservation_id = ?
        `,
        [reservationId],
      );

      // If you want Day2 requirements_mode to also be 'online':
      if (siblingReservationId) {
        await conn.execute(
          `
          UPDATE schedule_reservations
          SET requirements_mode = 'online', updated_at = NOW()
          WHERE reservation_id = ?
          `,
          [siblingReservationId],
        );
      }
    }

    await conn.commit();

    return res.json({
      status: "success",
      message: siblingReservationId
        ? "2x2 uploaded (applied to Day 1 + Day 2). Requirements uploaded."
        : "2x2 uploaded. Requirements uploaded.",
      data: {
        reservation_id: reservationId,
        sibling_reservation_id: siblingReservationId,
        picture_2x2: picturePath,
        uploaded_requirements: files.length,
      },
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    console.error("uploadRequirements error:", err);
    return res.status(500).json({
      status: "error",
      message: err.sqlMessage || err.message || "Upload failed",
    });
  } finally {
    conn.release();
  }
};

/**
 * GET /api/student/reservations/:reservationId/requirements
 * returns picture_2x2 + requirements list
 */
exports.listReservationRequirements = async (req, res) => {
  try {
    const userId = Number(req.session?.user_id);
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const reservationId = Number(req.params.reservationId);
    if (!Number.isFinite(reservationId) || reservationId < 1) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid reservation id" });
    }

    const [own] = await pool.execute(
      `
      SELECT reservation_id, picture_2x2
      FROM schedule_reservations
      WHERE reservation_id = ? AND student_id = ?
      LIMIT 1
      `,
      [reservationId, userId],
    );

    if (!own.length) {
      return res.status(403).json({ status: "error", message: "Not allowed" });
    }

    const [rows] = await pool.execute(
      `
      SELECT
        rs.submission_id,
        rs.requirement_id,
        rs.file_path,
        rs.created_at
      FROM requirement_submissions rs
      WHERE rs.reservation_id = ?
      ORDER BY rs.created_at DESC
      `,
      [reservationId],
    );

    return res.json({
      status: "success",
      data: {
        picture_2x2: own[0].picture_2x2 || null,
        requirements: rows,
      },
    });
  } catch (err) {
    console.error("listReservationRequirements error:", err);
    return res.status(500).json({
      status: "error",
      message: err.sqlMessage || err.message || "Failed to load requirements",
    });
  }
};
