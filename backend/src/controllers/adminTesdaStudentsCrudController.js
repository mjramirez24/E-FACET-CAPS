const pool = require("../config/database");

// =====================================================
// HELPERS
// =====================================================

function safeStr(v) {
  return typeof v === "string" ? v.trim() : "";
}

function safeInt(v, def = null) {
  const n = Number(v);

  return Number.isInteger(n) && n > 0
    ? n
    : def;
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();

  if (s === "male" || s === "m") {
    return "Male";
  }

  if (s === "female" || s === "f") {
    return "Female";
  }

  return safeStr(v) || null;
}

function normalizeSource(v) {
  const s = safeStr(v)
    .toUpperCase()
    .replace(/\s+/g, "");

  if (s === "ONLINE") {
    return "ONLINE";
  }

  if (
    s === "WALKIN" ||
    s === "WALK-IN"
  ) {
    return "WALKIN";
  }

  return null;
}

function makeHttpError(
  statusCode,
  message,
) {
  const err = new Error(message);

  err.statusCode = statusCode;

  return err;
}

async function getTableColumns(
  tableName,
  db = pool,
) {
  const [rows] = await db.execute(
    `
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `,
    [tableName],
  );

  return new Set(
    rows.map((r) => r.COLUMN_NAME),
  );
}

async function generateUniqueUsername(
  preferred,
  db = pool,
) {
  let base = safeStr(preferred)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 30);

  if (!base) {
    base = "tesdastudent";
  }

  for (let i = 0; i < 100; i++) {
    const suffix =
      i === 0 ? "" : `_${i}`;

    const candidate =
      `${base}${suffix}`.slice(
        0,
        45,
      );

    const [rows] = await db.execute(
      `
      SELECT id
      FROM users
      WHERE username = ?
      LIMIT 1
      `,
      [candidate],
    );

    if (!rows.length) {
      return candidate;
    }
  }

  return `tesda_${Date.now()}`;
}

const ADMIN_LATE_ADD_GRACE_HOURS = 8;
const TESDA_TRAINING_HOURS_PER_DAY = 9;

function parseDurationHours(duration) {
  const match = String(duration || "").match(/(\d+(?:\.\d+)?)/);

  const hours = match ? Number(match[1]) : 0;

  return Number.isFinite(hours) ? hours : 0;
}

function tesdaTrainingDaysFromDuration(duration) {
  const hours = parseDurationHours(duration);

  if (hours <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(hours / TESDA_TRAINING_HOURS_PER_DAY));
}

function addTesdaTrainingDays(startYmd, additionalTrainingDays) {
  const parts = String(startYmd || "")
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return null;
  }

  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));

  let added = 0;

  while (added < additionalTrainingDays) {
    d.setUTCDate(d.getUTCDate() + 1);

    // Sunday = 0
    // TESDA training = Monday-Saturday
    if (d.getUTCDay() === 0) {
      continue;
    }

    added++;
  }

  return d.toISOString().slice(0, 10);
}

function getTesdaCourseEndDate(startYmd, duration) {
  const daysNeeded = tesdaTrainingDaysFromDuration(duration);

  return addTesdaTrainingDays(startYmd, Math.max(0, daysNeeded - 1));
}

function getPhilippineScheduleEndMs(dateYmd, endTime) {
  if (!dateYmd) {
    return NaN;
  }

  let time = String(endTime || "17:00:00").trim();

  if (/^\d{1,2}:\d{2}$/.test(time)) {
    time = `${time}:00`;
  }

  if (!/^\d{1,2}:\d{2}:\d{2}$/.test(time)) {
    time = "17:00:00";
  }

  return new Date(`${String(dateYmd).slice(0, 10)}T${time}+08:00`).getTime();
}

// Same statuses used by TESDA Schedule Management
// when calculating occupied slots.
const OCCUPYING_STATUSES = [
  "CONFIRMED",
  "APPROVED",
  "ACTIVE",
];

const EDITABLE_RESERVATION_STATUSES =
  new Set([
    "PENDING",
    "CONFIRMED",
    "APPROVED",
    "ACTIVE",
    "DONE",
    "CANCELLED",
    "CANCELED",
    "REJECTED",
  ]);

// =====================================================
// POST /api/admin/tesda/students
//
// RULES:
// - Course comes from tesda_courses
// - Schedule comes from tesda_schedules
// - NO automatic schedule creation
// - NO manual trainer/date creation here
// - Schedule Management is the authority
// =====================================================

exports.createTesdaStudent = async (req, res) => {
  const body = req.body || {};

  const fullName = safeStr(body.full_name);

  const email = safeStr(body.email) || null;

  const courseId = safeInt(body.course_id);

  const scheduleId = safeInt(body.schedule_id);

  if (!fullName) {
    return res.status(400).json({
      status: "error",
      message: "Full name is required.",
    });
  }

  if (!courseId) {
    return res.status(400).json({
      status: "error",
      message: "Please select a valid TESDA course.",
    });
  }

  if (!scheduleId) {
    return res.status(400).json({
      status: "error",
      message: "Please select an available TESDA schedule.",
    });
  }

  let conn = null;

  try {
    conn = await pool.getConnection();

    await conn.beginTransaction();

    // =====================================================
    // 1. AUTHORITATIVE TESDA COURSE
    // =====================================================
    const [courseRows] = await conn.execute(
      `
        SELECT
          id,
          course_code,
          course_name,
          duration
        FROM tesda_courses
        WHERE id = ?
        LIMIT 1
        `,
      [courseId],
    );

    if (!courseRows.length) {
      throw makeHttpError(404, "Selected TESDA course not found.");
    }

    const selectedCourse = courseRows[0];

    // =====================================================
    // 2. AUTHORITATIVE TESDA SCHEDULE
    // =====================================================
    const [scheduleRows] = await conn.execute(
      `
        SELECT
          schedule_id,
          course_id,
          trainer_id,

          DATE_FORMAT(
            schedule_date,
            '%Y-%m-%d'
          ) AS schedule_date,

          start_time,
          end_time,
          total_slots,
          status

        FROM tesda_schedules

        WHERE schedule_id = ?

        LIMIT 1
        FOR UPDATE
        `,
      [scheduleId],
    );

    if (!scheduleRows.length) {
      throw makeHttpError(404, "Selected TESDA schedule not found.");
    }

    const selectedSchedule = scheduleRows[0];

    // =====================================================
    // Course must match selected schedule
    // =====================================================
    if (Number(selectedSchedule.course_id) !== Number(courseId)) {
      throw makeHttpError(
        400,
        "Selected TESDA schedule does not belong to the selected course.",
      );
    }

    // =====================================================
    // TBA is still NOT allowed
    // =====================================================
    if (!selectedSchedule.schedule_date) {
      throw makeHttpError(
        400,
        "TBA schedules cannot accept students yet. Set the schedule date first.",
      );
    }

    // =====================================================
    // 3. MANUAL STATUS CHECK
    //
    // DONE / COMPLETED / FINISHED are intentionally
    // NOT blocked here.
    //
    // Admin can still use them during the grace period.
    // =====================================================
    const rawScheduleStatus = safeStr(selectedSchedule.status).toLowerCase();

    if (
      ["closed", "cancelled", "canceled", "tba", "full"].includes(
        rawScheduleStatus,
      )
    ) {
      throw makeHttpError(
        400,
        "Selected TESDA schedule is closed, TBA, cancelled, or full.",
      );
    }

    // =====================================================
    // 4. CALCULATE TESDA LOGICAL COURSE END
    //
    // Example:
    //
    // Start = Sep 18
    // Duration = 181 Hours
    //
    // 181 / 9 hours/day
    // = 21 training days
    //
    // Sundays skipped.
    //
    // Admin grace starts AFTER final training day.
    // =====================================================
    const logicalCourseEndDate = getTesdaCourseEndDate(
      selectedSchedule.schedule_date,
      selectedCourse.duration,
    );

    if (!logicalCourseEndDate) {
      throw makeHttpError(
        400,
        "Unable to determine the TESDA course end date.",
      );
    }

    const logicalEndMs = getPhilippineScheduleEndMs(
      logicalCourseEndDate,

      selectedSchedule.end_time || "17:00:00",
    );

    if (!Number.isFinite(logicalEndMs)) {
      throw makeHttpError(
        400,
        "Unable to determine the TESDA schedule end time.",
      );
    }

    // =====================================================
    // 5. ADMIN LATE-ADD GRACE
    // =====================================================
    const graceMs = ADMIN_LATE_ADD_GRACE_HOURS * 60 * 60 * 1000;

    const latestAllowedMs = logicalEndMs + graceMs;

    if (Date.now() > latestAllowedMs) {
      throw makeHttpError(
        400,
        `This TESDA schedule is already too old. Admin late-add is allowed only up to ${ADMIN_LATE_ADD_GRACE_HOURS} hours after the course ends.`,
      );
    }

    // =====================================================
    // 6. CAPACITY CHECK
    // =====================================================
    const occPlaceholders = OCCUPYING_STATUSES.map(() => "?").join(",");

    const [usedRows] = await conn.execute(
      `
        SELECT
          COUNT(*) AS used

        FROM
          tesda_schedule_reservations

        WHERE
          schedule_id = ?

          AND UPPER(
            reservation_status
          ) IN (
            ${occPlaceholders}
          )
        `,
      [scheduleId, ...OCCUPYING_STATUSES],
    );

    const usedSlots = Number(usedRows?.[0]?.used || 0);

    const totalSlots = Number(selectedSchedule.total_slots || 0);

    if (totalSlots < 1 || usedSlots >= totalSlots) {
      throw makeHttpError(409, "Selected TESDA schedule is already full.");
    }

    // =====================================================
    // 7. USERS TABLE INFO
    // =====================================================
    const userCols = await getTableColumns("users", conn);

    let studentId = null;

    // =====================================================
    // 8. REUSE EXISTING USER BY EMAIL
    // =====================================================
    if (email) {
      const [existingUsers] = await conn.execute(
        `
          SELECT
            id,
            role

          FROM users

          WHERE email = ?

          LIMIT 1
          FOR UPDATE
          `,
        [email],
      );

      if (existingUsers.length) {
        const existingUser = existingUsers[0];

        const existingRole = safeStr(existingUser.role).toLowerCase();

        if (
          existingRole &&
          existingRole !== "user" &&
          existingRole !== "student"
        ) {
          throw makeHttpError(
            409,
            "This email belongs to a non-student account and cannot be reused.",
          );
        }

        studentId = Number(existingUser.id);
      }
    }

    // =====================================================
    // 9. CREATE NEW USER
    // =====================================================
    if (!studentId) {
      const insertCols = [];
      const insertVals = [];
      const insertParams = [];

      if (userCols.has("fullname")) {
        insertCols.push("fullname");

        insertVals.push("?");

        insertParams.push(fullName);
      }

      if (userCols.has("username")) {
        const preferredUsername =
          safeStr(body.username) || (email ? email.split("@")[0] : fullName);

        const username = await generateUniqueUsername(preferredUsername, conn);

        insertCols.push("username");

        insertVals.push("?");

        insertParams.push(username);
      }

      if (userCols.has("email")) {
        insertCols.push("email");

        insertVals.push("?");

        insertParams.push(email);
      }

      if (userCols.has("birthday")) {
        insertCols.push("birthday");

        insertVals.push("?");

        insertParams.push(body.birthdate || null);
      }

      if (userCols.has("gender")) {
        insertCols.push("gender");

        insertVals.push("?");

        insertParams.push(normalizeGender(body.sex));
      }

      if (userCols.has("role")) {
        insertCols.push("role");

        insertVals.push("?");

        insertParams.push("user");
      }

      // TESDA track
      if (userCols.has("track_id")) {
        insertCols.push("track_id");

        insertVals.push("?");

        insertParams.push(2);
      }

      if (userCols.has("created_at")) {
        insertCols.push("created_at");

        insertVals.push("NOW()");
      }

      if (!insertCols.length) {
        throw new Error("users table is missing expected columns.");
      }

      const [userResult] = await conn.execute(
        `
          INSERT INTO users
            (
              ${insertCols.join(", ")}
            )
          VALUES
            (
              ${insertVals.join(", ")}
            )
          `,
        insertParams,
      );

      studentId = Number(userResult.insertId);
    }

    // =====================================================
    // EXISTING USER
    // =====================================================
    else {
      const updates = [];
      const updateParams = [];

      if (userCols.has("fullname")) {
        updates.push("fullname = ?");

        updateParams.push(fullName);
      }

      if (userCols.has("birthday") && body.birthdate !== undefined) {
        updates.push("birthday = ?");

        updateParams.push(body.birthdate || null);
      }

      if (userCols.has("gender") && body.sex !== undefined) {
        updates.push("gender = ?");

        updateParams.push(normalizeGender(body.sex));
      }

      // Do not overwrite Driving track.
      if (userCols.has("track_id")) {
        updates.push(`
          track_id =
            CASE
              WHEN
                track_id IS NULL
                OR track_id = 0
              THEN 2
              ELSE track_id
            END
        `);
      }

      if (updates.length) {
        updateParams.push(studentId);

        await conn.execute(
          `
          UPDATE users

          SET
            ${updates.join(", ")}

          WHERE id = ?
          `,
          updateParams,
        );
      }
    }

    // =====================================================
    // 10. DUPLICATE CHECK
    // =====================================================
    const [existingReservations] = await conn.execute(
      `
        SELECT
          reservation_id,
          reservation_status

        FROM
          tesda_schedule_reservations

        WHERE
          schedule_id = ?

          AND student_id = ?

        LIMIT 1
        FOR UPDATE
        `,
      [scheduleId, studentId],
    );

    let reservationId = null;

    // =====================================================
    // REACTIVATE CANCELLED / REJECTED
    // =====================================================
    if (existingReservations.length) {
      const existing = existingReservations[0];

      const existingStatus = safeStr(existing.reservation_status).toUpperCase();

      if (["CANCELLED", "CANCELED", "REJECTED"].includes(existingStatus)) {
        await conn.execute(
          `
          UPDATE
            tesda_schedule_reservations

          SET
            reservation_status =
              'CONFIRMED',

            reservation_source =
              'WALKIN',

            updated_at =
              NOW()

          WHERE
            reservation_id = ?
          `,
          [existing.reservation_id],
        );

        reservationId = Number(existing.reservation_id);
      } else {
        throw makeHttpError(
          409,
          "This student already has a reservation for the selected TESDA schedule.",
        );
      }
    }

    // =====================================================
    // 11. CREATE NEW TESDA RESERVATION
    // =====================================================
    else {
      const [reservationResult] = await conn.execute(
        `
          INSERT INTO
            tesda_schedule_reservations
          (
            schedule_id,
            student_id,
            reservation_status,
            reservation_source,
            created_at
          )

          VALUES
          (
            ?,
            ?,
            'CONFIRMED',
            'WALKIN',
            NOW()
          )
          `,
        [scheduleId, studentId],
      );

      reservationId = Number(reservationResult.insertId);
    }

    // =====================================================
    // 12. COMMIT
    // =====================================================
    await conn.commit();

    return res.status(201).json({
      status: "success",

      message: "TESDA walk-in student added successfully.",

      data: {
        reservation_id: reservationId,

        student_id: studentId,

        course_id: courseId,

        schedule_id: scheduleId,

        course_code: selectedCourse.course_code,

        course_name: selectedCourse.course_name,

        schedule_date: selectedSchedule.schedule_date,

        logical_course_end: logicalCourseEndDate,

        trainer_id: selectedSchedule.trainer_id,

        status: "CONFIRMED",

        source: "WALKIN",
      },
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("createTesdaStudent rollback error:", rollbackErr);
      }
    }

    console.error("createTesdaStudent error:", err);

    const statusCode =
      Number(err.statusCode) || (err.code === "ER_DUP_ENTRY" ? 409 : 500);

    return res.status(statusCode).json({
      status: "error",

      message:
        statusCode >= 500 ? "Failed to create TESDA student" : err.message,

      debug: statusCode >= 500 ? err.sqlMessage || err.message : undefined,
    });
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

// =====================================================
// PUT /api/admin/tesda/students/:id
//
// Student Management must NEVER:
// - change course
// - move schedule
// - change schedule date
// - change trainer
//
// Those belong to TESDA Schedule Management.
// =====================================================

exports.updateTesdaStudent = async (
  req,
  res,
) => {
  const body = req.body || {};

  const reservationId =
    safeInt(req.params.id);

  if (!reservationId) {
    return res.status(400).json({
      status: "error",
      message:
        "Invalid reservation id.",
    });
  }

  let conn = null;

  try {
    conn =
      await pool.getConnection();

    await conn.beginTransaction();

    // =================================================
    // 1. LOAD CURRENT RESERVATION
    // =================================================

    const [reservationRows] =
      await conn.execute(
        `
        SELECT
          tsr.reservation_id,
          tsr.student_id,
          tsr.schedule_id,

          ts.course_id,
          ts.trainer_id,
          ts.schedule_date

        FROM
          tesda_schedule_reservations tsr

        JOIN tesda_schedules ts
          ON ts.schedule_id =
             tsr.schedule_id

        WHERE tsr.reservation_id = ?

        LIMIT 1
        FOR UPDATE
        `,
        [reservationId],
      );

    if (
      !reservationRows.length
    ) {
      throw makeHttpError(
        404,
        "TESDA reservation not found.",
      );
    }

    const current =
      reservationRows[0];

    // =================================================
    // 2. BLOCK COURSE CHANGE
    // =================================================

    if (
      body.course_id !==
        undefined &&
      body.course_id !== null &&
      body.course_id !== ""
    ) {
      const requestedCourseId =
        safeInt(body.course_id);

      if (
        !requestedCourseId ||
        requestedCourseId !==
          Number(
            current.course_id,
          )
      ) {
        throw makeHttpError(
          400,
          "Course cannot be changed from Students Management. Use TESDA Schedule Management.",
        );
      }
    }

    // =================================================
    // 3. BLOCK SCHEDULE CHANGE
    // =================================================

    if (
      body.schedule_id !==
        undefined &&
      body.schedule_id !== null &&
      body.schedule_id !== ""
    ) {
      const requestedScheduleId =
        safeInt(body.schedule_id);

      if (
        !requestedScheduleId ||
        requestedScheduleId !==
          Number(
            current.schedule_id,
          )
      ) {
        throw makeHttpError(
          400,
          "Schedule cannot be changed from Students Management. Use TESDA Schedule Management.",
        );
      }
    }

    // =================================================
    // 4. UPDATE USER PROFILE ONLY
    // =================================================

    const userCols =
      await getTableColumns(
        "users",
        conn,
      );

    const userUpdates = [];
    const userParams = [];

    if (
      userCols.has("fullname") &&
      body.full_name !== undefined
    ) {
      const fullName =
        safeStr(body.full_name);

      if (!fullName) {
        throw makeHttpError(
          400,
          "Full name is required.",
        );
      }

      userUpdates.push(
        "fullname = ?",
      );

      userParams.push(
        fullName,
      );
    }

    if (
      userCols.has("email") &&
      body.email !== undefined
    ) {
      const email =
        safeStr(body.email) ||
        null;

      if (email) {
        const [emailRows] =
          await conn.execute(
            `
            SELECT id
            FROM users
            WHERE email = ?
              AND id <> ?
            LIMIT 1
            `,
            [
              email,
              current.student_id,
            ],
          );

        if (emailRows.length) {
          throw makeHttpError(
            409,
            "Email is already used by another account.",
          );
        }
      }

      userUpdates.push(
        "email = ?",
      );

      userParams.push(
        email,
      );
    }

    if (
      userCols.has("birthday") &&
      body.birthdate !== undefined
    ) {
      userUpdates.push(
        "birthday = ?",
      );

      userParams.push(
        body.birthdate || null,
      );
    }

    if (
      userCols.has("gender") &&
      body.sex !== undefined
    ) {
      userUpdates.push(
        "gender = ?",
      );

      userParams.push(
        normalizeGender(
          body.sex,
        ),
      );
    }

    if (userUpdates.length) {
      userParams.push(
        Number(
          current.student_id,
        ),
      );

      await conn.execute(
        `
        UPDATE users

        SET
          ${userUpdates.join(
            ", ",
          )}

        WHERE id = ?
        `,
        userParams,
      );
    }

    // =================================================
    // 5. UPDATE RESERVATION METADATA ONLY
    // =================================================

    const reservationUpdates =
      [];

    const reservationParams =
      [];

    if (
      body.status !== undefined
    ) {
      const status =
        safeStr(
          body.status,
        ).toUpperCase();

      if (
        !EDITABLE_RESERVATION_STATUSES.has(
          status,
        )
      ) {
        throw makeHttpError(
          400,
          "Invalid TESDA reservation status.",
        );
      }

      reservationUpdates.push(
        "reservation_status = ?",
      );

      reservationParams.push(
        status,
      );
    }

    if (
      body.source !== undefined
    ) {
      const source =
        normalizeSource(
          body.source,
        );

      if (!source) {
        throw makeHttpError(
          400,
          "Reservation source must be ONLINE or WALKIN.",
        );
      }

      reservationUpdates.push(
        "reservation_source = ?",
      );

      reservationParams.push(
        source,
      );
    }

    if (
      reservationUpdates.length
    ) {
      reservationUpdates.push(
        "updated_at = NOW()",
      );

      reservationParams.push(
        reservationId,
      );

      await conn.execute(
        `
        UPDATE
          tesda_schedule_reservations

        SET
          ${reservationUpdates.join(
            ", ",
          )}

        WHERE reservation_id = ?
        `,
        reservationParams,
      );
    }

    // =================================================
    // 6. COMMIT
    // =================================================

    await conn.commit();

    return res.json({
      status: "success",

      message:
        "TESDA student updated successfully.",

      data: {
        reservation_id:
          reservationId,

        student_id:
          Number(
            current.student_id,
          ),

        schedule_id:
          Number(
            current.schedule_id,
          ),

        course_id:
          Number(
            current.course_id,
          ),
      },
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error(
          "updateTesdaStudent rollback error:",
          rollbackErr,
        );
      }
    }

    console.error(
      "updateTesdaStudent error:",
      err,
    );

    const statusCode =
      Number(err.statusCode) ||
      (err.code ===
      "ER_DUP_ENTRY"
        ? 409
        : 500);

    return res
      .status(statusCode)
      .json({
        status: "error",

        message:
          statusCode >= 500
            ? "Failed to update TESDA student"
            : err.message,

        debug:
          statusCode >= 500
            ? err.sqlMessage ||
              err.message
            : undefined,
      });
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

// =====================================================
// DELETE /api/admin/tesda/students/:id
//
// Removes TESDA enrollment/reservation only.
// Does NOT delete users account.
// =====================================================

exports.deleteTesdaStudent = async (
  req,
  res,
) => {
  const reservationId =
    safeInt(req.params.id);

  if (!reservationId) {
    return res.status(400).json({
      status: "error",
      message:
        "Invalid reservation id.",
    });
  }

  let conn = null;

  try {
    conn =
      await pool.getConnection();

    await conn.beginTransaction();

    // =================================================
    // 1. LOAD RESERVATION
    // =================================================

    const [rows] =
      await conn.execute(
        `
        SELECT
          reservation_id,
          student_id,
          schedule_id

        FROM
          tesda_schedule_reservations

        WHERE reservation_id = ?

        LIMIT 1
        FOR UPDATE
        `,
        [reservationId],
      );

    if (!rows.length) {
      await conn.rollback();

      return res.json({
        status: "success",
        message:
          "TESDA reservation is already removed.",
      });
    }

    // =================================================
    // 2. DELETE ENROLLMENT
    // =================================================

    await conn.execute(
      `
      DELETE FROM
        tesda_schedule_reservations

      WHERE reservation_id = ?
      `,
      [reservationId],
    );

    // =================================================
    // 3. COMMIT
    // =================================================

    await conn.commit();

    return res.json({
      status: "success",

      message:
        "TESDA student enrollment deleted successfully.",

      data: {
        reservation_id:
          reservationId,

        student_id:
          Number(
            rows[0].student_id,
          ),

        schedule_id:
          Number(
            rows[0].schedule_id,
          ),
      },
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error(
          "deleteTesdaStudent rollback error:",
          rollbackErr,
        );
      }
    }

    console.error(
      "deleteTesdaStudent error:",
      err,
    );

    // Attendance / certificate / other FK exists.
    if (
      err.code ===
        "ER_ROW_IS_REFERENCED_2" ||
      err.errno === 1451
    ) {
      return res.status(409).json({
        status: "error",

        message:
          "This TESDA enrollment already has related records such as attendance or certificates and cannot be deleted.",
      });
    }

    return res.status(500).json({
      status: "error",

      message:
        "Failed to delete TESDA student",

      debug:
        err.sqlMessage ||
        err.message,
    });
  } finally {
    if (conn) {
      conn.release();
    }
  }
};