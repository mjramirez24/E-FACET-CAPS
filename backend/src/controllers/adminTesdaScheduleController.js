// backend/src/controllers/adminTesdaScheduleController.js
const pool = require("../config/database");

function timeToMinutes(t) {
  if (!t) return null;
  const s = String(t).trim();
  const parts = s.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function toYMD(dateLike) {
  if (!dateLike) return null;
  const s = String(dateLike);
  return s.includes("T") ? s.split("T")[0] : s;
}

const OPEN_TIME = "08:00";
const CLOSE_TIME = "17:00";

// statuses that occupy a slot (same as student side)
const OCCUPYING = ["CONFIRMED", "APPROVED", "ACTIVE"];

function ph(arr) {
  return arr.map(() => "?").join(",");
}

/* =========================================================
   ✅ TESDA CLASS RULES (ADMIN SIDE)
   - Monday to Saturday only (NO SUNDAY)
   - 08:00 to 17:00 only
   ========================================================= */

function isMonToSat(dateYMD) {
  if (!dateYMD) return false;
  const d = new Date(`${dateYMD}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const day = d.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  return day >= 1 && day <= 6;
}

function isTimeWithin8to5(startHHmm, endHHmm) {
  const s = timeToMinutes(startHHmm);
  const e = timeToMinutes(endHHmm);
  const open = timeToMinutes(OPEN_TIME);
  const close = timeToMinutes(CLOSE_TIME);
  if (s == null || e == null || open == null || close == null) return false;
  if (e <= s) return false;
  return s >= open && e <= close;
}

/* =========================================================
   ✅ TRAINER AUTO-PICK (FROM tesda_course_trainers)
   - UI no longer selects trainer for TESDA schedules
   - DB trainer_id is NOT NULL -> we must always set trainer_id
   ========================================================= */

async function pickAssignedTrainer(courseId) {
  if (!courseId) return null;
  const [rows] = await pool.execute(
    `
    SELECT trainer_id
    FROM tesda_course_trainers
    WHERE course_id=?
    ORDER BY id ASC
    LIMIT 1
    `,
    [Number(courseId)],
  );
  return rows.length ? Number(rows[0].trainer_id) : null;
}

async function ensureAssignment(courseId, trainerId) {
  if (!courseId || !trainerId) return;

  const [arows] = await pool.execute(
    `SELECT id FROM tesda_course_trainers WHERE course_id=? AND trainer_id=? LIMIT 1`,
    [Number(courseId), Number(trainerId)],
  );
  if (arows.length) return;

  await pool.execute(
    `INSERT INTO tesda_course_trainers (course_id, trainer_id, created_at)
     VALUES (?, ?, NOW())`,
    [Number(courseId), Number(trainerId)],
  );
}

/**
 * GET /api/admin/tesda/schedules
 * Optional query:
 *  - course_id
 *  - date_from (YYYY-MM-DD)
 *  - date_to (YYYY-MM-DD)
 */
exports.getTesdaSchedules = async (req, res) => {
  try {
    const { course_id, date_from, date_to } = req.query;

    const where = [];
    const params = [];

    if (course_id) {
      where.push("s.course_id = ?");
      params.push(Number(course_id));
    }

    // ✅ only filter by date range when schedule_date is not null
    if (date_from) {
      where.push("(s.schedule_date IS NOT NULL AND s.schedule_date >= ?)");
      params.push(date_from);
    }
    if (date_to) {
      where.push("(s.schedule_date IS NOT NULL AND s.schedule_date <= ?)");
      params.push(date_to);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.execute(
      `
      SELECT
        s.schedule_id AS id,
        s.course_id,
        c.course_name AS course,
        c.duration AS duration,

        -- keep same keys used by driving template
        s.trainer_id AS instructor_id,
        CONCAT(t.firstname, ' ', t.lastname) AS instructor,

        -- ✅ allow NULL schedule_date/time for TBA
        DATE_FORMAT(s.schedule_date, '%Y-%m-%d') AS date,
        DATE_FORMAT(s.schedule_date, '%a') AS day,

        TIME_FORMAT(s.start_time, '%H:%i') AS startTime,
        TIME_FORMAT(s.end_time, '%H:%i') AS endTime,

        s.total_slots AS totalSlots,
        s.status AS scheduleStatus,

        COALESCE(rc.reservedCount, 0) AS reservedCount,
        GREATEST(s.total_slots - COALESCE(rc.reservedCount, 0), 0) AS availableSlots,

        CASE
          WHEN LOWER(COALESCE(s.status,'')) = 'tba' THEN 'TBA'
          WHEN LOWER(COALESCE(s.status,'')) = 'closed' THEN 'Closed'
          WHEN s.total_slots <= 0 THEN 'Full'
          WHEN GREATEST(s.total_slots - COALESCE(rc.reservedCount, 0), 0) = 0 THEN 'Full'
          ELSE 'Open'
        END AS computedStatus,

        s.created_at,
        s.updated_at
      FROM tesda_schedules s
      JOIN tesda_courses c ON c.id = s.course_id
      LEFT JOIN trainers t ON t.trainer_id = s.trainer_id

      LEFT JOIN (
        SELECT schedule_id, COUNT(*) AS reservedCount
        FROM tesda_schedule_reservations
        WHERE UPPER(reservation_status) IN (${ph(OCCUPYING)})
        GROUP BY schedule_id
      ) rc ON rc.schedule_id = s.schedule_id

      ${whereSql}

      ORDER BY
        (s.schedule_date IS NULL) DESC,
        s.schedule_date DESC,
        s.start_time DESC,
        s.schedule_id DESC
      `,
      [...OCCUPYING, ...params],
    );

    return res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("getTesdaSchedules error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

/**
 * POST /api/admin/tesda/schedules
 * ✅ Supports TBA batch creation
 * ✅ trainer auto-picks from course assignment ALWAYS (because DB trainer_id NOT NULL)
 */
exports.createTesdaSchedule = async (req, res) => {
  try {
    const {
      course_id,
      trainer_id, // optional (but DB needs non-null)
      schedule_date,
      start_time,
      end_time,
      total_slots,
      status,
    } = req.body;

    const cid = Number(course_id);
    const slots = Number(total_slots);

    if (!cid || !Number.isFinite(cid) || cid < 1) {
      return res
        .status(400)
        .json({ status: "error", message: "course_id is required" });
    }

    if (!Number.isFinite(slots) || slots < 1) {
      return res
        .status(400)
        .json({ status: "error", message: "total_slots must be >= 1" });
    }

    // validate course exists
    const [cRows] = await pool.execute(
      `SELECT id FROM tesda_courses WHERE id=? LIMIT 1`,
      [cid],
    );
    if (!cRows.length) {
      return res
        .status(404)
        .json({ status: "error", message: "TESDA course not found" });
    }

    const ymd = toYMD(schedule_date);

    // ✅ ALWAYS resolve trainer id (db cannot be null)
    let tId = trainer_id ? Number(trainer_id) : null;
    if (!tId) tId = await pickAssignedTrainer(cid);

    if (!tId || !Number.isFinite(tId) || tId < 1) {
      return res.status(400).json({
        status: "error",
        message:
          "No assigned trainer found for this TESDA course. Please assign a trainer in TESDA Course Trainer Assignment.",
      });
    }

    // validate trainer exists
    const [tRows] = await pool.execute(
      `SELECT trainer_id FROM trainers WHERE trainer_id=? LIMIT 1`,
      [tId],
    );
    if (!tRows.length) {
      return res
        .status(404)
        .json({ status: "error", message: "Trainer not found" });
    }

    // ✅ TBA MODE (no date/time)
    if (!ymd) {
      const [result] = await pool.execute(
        `
        INSERT INTO tesda_schedules
          (course_id, trainer_id, schedule_date, start_time, end_time, total_slots, status)
        VALUES (?, ?, NULL, NULL, NULL, ?, 'tba')
        `,
        [cid, tId, slots],
      );

      await ensureAssignment(cid, tId);

      return res.status(201).json({
        status: "success",
        message: "TESDA batch created (TBA)",
        data: { schedule_id: result.insertId },
      });
    }

    // ✅ NORMAL MODE (with schedule_date)
    if (!isMonToSat(ymd)) {
      return res.status(400).json({
        status: "error",
        message: "TESDA classes are Monday to Saturday only. (No Sunday)",
      });
    }

    const st = String(start_time || OPEN_TIME).slice(0, 5);
    const et = String(end_time || CLOSE_TIME).slice(0, 5);

    if (String(st) >= String(et) || timeToMinutes(et) <= timeToMinutes(st)) {
      return res.status(400).json({
        status: "error",
        message: "End time must be after start time",
      });
    }

    if (!isTimeWithin8to5(st, et)) {
      return res.status(400).json({
        status: "error",
        message: "TESDA class time must be within 08:00 to 17:00 only.",
      });
    }

    const normalizedStatus = ["open", "closed", "full", "tba"].includes(
      String(status || "open").toLowerCase(),
    )
      ? String(status || "open").toLowerCase()
      : "open";

    const [result] = await pool.execute(
      `
      INSERT INTO tesda_schedules
        (course_id, trainer_id, schedule_date, start_time, end_time, total_slots, status)
      VALUES (?,?,?,?,?,?,?)
      `,
      [cid, tId, ymd, st, et, slots, normalizedStatus],
    );

    await ensureAssignment(cid, tId);

    return res.status(201).json({
      status: "success",
      message: "TESDA schedule created",
      data: { schedule_id: result.insertId },
    });
  } catch (err) {
    console.error("createTesdaSchedule error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

/**
 * PUT /api/admin/tesda/schedules/:id
 * ✅ allows updating TBA -> scheduled
 * ✅ trainer auto-picks from assignment if schedule_date is set and trainer_id not provided
 * ✅ never forces trainer_id to null unless you explicitly send trainer_id=null
 */
exports.updateTesdaSchedule = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid schedule id" });
    }

    const {
      course_id,
      trainer_id, // optional
      schedule_date,
      start_time,
      end_time,
      total_slots,
      status,
    } = req.body;

    const cid =
      course_id === undefined
        ? undefined
        : course_id
          ? Number(course_id)
          : null;

    const tIdRaw =
      trainer_id === undefined
        ? undefined
        : trainer_id
          ? Number(trainer_id)
          : null;

    const slots =
      total_slots === undefined
        ? undefined
        : total_slots === null
          ? null
          : Number(total_slots);

    const ymd = schedule_date === undefined ? undefined : toYMD(schedule_date);

    if (
      cid !== undefined &&
      cid !== null &&
      (!Number.isFinite(cid) || cid < 1)
    ) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid course_id" });
    }
    if (
      tIdRaw !== undefined &&
      tIdRaw !== null &&
      (!Number.isFinite(tIdRaw) || tIdRaw < 1)
    ) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid trainer_id" });
    }
    if (
      slots !== undefined &&
      slots !== null &&
      (!Number.isFinite(slots) || slots < 1)
    ) {
      return res
        .status(400)
        .json({ status: "error", message: "Total slots must be >= 1" });
    }

    if (ymd !== undefined && ymd !== null) {
      if (!isMonToSat(ymd)) {
        return res.status(400).json({
          status: "error",
          message: "TESDA classes are Monday to Saturday only. (No Sunday)",
        });
      }
    }

    // validate course if provided
    if (cid !== undefined && cid !== null) {
      const [cRows] = await pool.execute(
        `SELECT id FROM tesda_courses WHERE id=? LIMIT 1`,
        [cid],
      );
      if (!cRows.length) {
        return res
          .status(404)
          .json({ status: "error", message: "TESDA course not found" });
      }
    }

    // validate trainer if provided
    if (tIdRaw !== undefined && tIdRaw !== null) {
      const [tRows] = await pool.execute(
        `SELECT trainer_id FROM trainers WHERE trainer_id=? LIMIT 1`,
        [tIdRaw],
      );
      if (!tRows.length) {
        return res
          .status(404)
          .json({ status: "error", message: "Trainer not found" });
      }
    }

    const hasStart =
      start_time !== undefined &&
      start_time !== null &&
      String(start_time).trim() !== "";
    const hasEnd =
      end_time !== undefined &&
      end_time !== null &&
      String(end_time).trim() !== "";

    let st = null;
    let et = null;

    if (hasStart || hasEnd) {
      if (!hasStart || !hasEnd) {
        return res.status(400).json({
          status: "error",
          message:
            "Both start_time and end_time are required when updating time",
        });
      }
      st = String(start_time).slice(0, 5);
      et = String(end_time).slice(0, 5);

      if (String(st) >= String(et) || timeToMinutes(et) <= timeToMinutes(st)) {
        return res
          .status(400)
          .json({
            status: "error",
            message: "End time must be after start time",
          });
      }

      if (!isTimeWithin8to5(st, et)) {
        return res.status(400).json({
          status: "error",
          message: "TESDA class time must be within 08:00 to 17:00 only.",
        });
      }
    }

    const normalizedStatus =
      status === undefined
        ? undefined
        : ["open", "closed", "full", "tba"].includes(
              String(status).toLowerCase(),
            )
          ? String(status).toLowerCase()
          : "open";

    // ✅ if setting schedule_date (not null) and trainer_id not provided => auto pick
    let effectiveTrainerId = tIdRaw; // undefined keep, null set null (but DB may reject), or number set
    if (ymd !== undefined && ymd !== null && tIdRaw === undefined) {
      let finalCourseId = cid !== undefined ? cid : null;
      if (!finalCourseId) {
        const [srows] = await pool.execute(
          `SELECT course_id FROM tesda_schedules WHERE schedule_id=? LIMIT 1`,
          [id],
        );
        if (!srows.length) {
          return res
            .status(404)
            .json({ status: "error", message: "TESDA schedule not found" });
        }
        finalCourseId = Number(srows[0].course_id);
      }

      const picked = await pickAssignedTrainer(finalCourseId);
      if (!picked) {
        return res.status(400).json({
          status: "error",
          message:
            "No assigned trainer found for this TESDA course. Please assign a trainer in TESDA Course Trainer Assignment.",
        });
      }
      effectiveTrainerId = picked;
    }

    // ⚠️ DB trainer_id cannot be null. So block explicit null update.
    if (effectiveTrainerId === null) {
      return res.status(400).json({
        status: "error",
        message:
          "trainer_id cannot be null (DB constraint). Assign a trainer to the course instead.",
      });
    }

    const trainerSql = effectiveTrainerId === undefined ? "trainer_id" : "?";
    const courseSql =
      cid === undefined ? "course_id" : "COALESCE(?, course_id)";
    const scheduleDateSql = ymd === undefined ? "schedule_date" : "?";
    const startSql = hasStart || hasEnd ? "?" : "start_time";
    const endSql = hasStart || hasEnd ? "?" : "end_time";
    const slotsSql =
      slots === undefined ? "total_slots" : "COALESCE(?, total_slots)";
    const statusSql = normalizedStatus === undefined ? "status" : "?";

    const sql = `
      UPDATE tesda_schedules
      SET
        course_id     = ${courseSql},
        trainer_id    = ${trainerSql},
        schedule_date = ${scheduleDateSql},
        start_time    = ${startSql},
        end_time      = ${endSql},
        total_slots   = ${slotsSql},
        status        = ${statusSql},
        updated_at    = NOW()
      WHERE schedule_id=?
    `;

    const params = [];

    if (cid !== undefined) params.push(cid);
    if (effectiveTrainerId !== undefined) params.push(effectiveTrainerId);
    if (ymd !== undefined) params.push(ymd);
    if (hasStart || hasEnd) params.push(st, et);
    if (slots !== undefined) params.push(slots);
    if (normalizedStatus !== undefined) params.push(normalizedStatus);
    params.push(id);

    const [result] = await pool.execute(sql, params);

    if (!result.affectedRows) {
      return res
        .status(404)
        .json({ status: "error", message: "TESDA schedule not found" });
    }

    // ensure assignment exists (use current values after update)
    const [srows2] = await pool.execute(
      `SELECT course_id, trainer_id FROM tesda_schedules WHERE schedule_id=? LIMIT 1`,
      [id],
    );
    if (srows2.length) {
      const c2 = Number(srows2[0].course_id);
      const t2 = Number(srows2[0].trainer_id);
      if (c2 && t2) await ensureAssignment(c2, t2);
    }

    return res.json({ status: "success", message: "TESDA schedule updated" });
  } catch (err) {
    console.error("updateTesdaSchedule error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

/**
 * DELETE /api/admin/tesda/schedules/:id
 */
exports.deleteTesdaSchedule = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid schedule id" });
    }

    const [result] = await pool.execute(
      `DELETE FROM tesda_schedules WHERE schedule_id=?`,
      [id],
    );

    if (!result.affectedRows) {
      return res
        .status(404)
        .json({ status: "error", message: "TESDA schedule not found" });
    }

    return res.json({ status: "success", message: "TESDA schedule deleted" });
  } catch (err) {
    console.error("deleteTesdaSchedule error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};
