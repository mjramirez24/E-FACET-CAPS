// backend/src/controllers/adminStudentsController.js
const pool = require("../config/database");

// ------------------------
// helpers
// ------------------------
function safeStr(v) {
  return String(v ?? "").trim();
}
function safeLike(v) {
  return String(v ?? "")
    .trim()
    .replace(/[%_]/g, (m) => "\\" + m);
}
function clampLimitOffset(page, limit) {
  const p = Math.max(1, parseInt(String(page ?? "1"), 10) || 1);
  const l = Math.min(
    200,
    Math.max(1, parseInt(String(limit ?? "50"), 10) || 50),
  );
  const offset = (p - 1) * l;
  return { page: p, limit: l, offset };
}
function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (!s) return null;
  if (s === "m" || s === "male" || s === "lalaki") return "male";
  if (s === "f" || s === "female" || s === "babae") return "female";
  return safeStr(v) || null;
}

const TRAINING_PURPOSE_NEW = "Application for new Driver's License";

const TRAINING_PURPOSE_ADDITIONAL = "Application for Additional DL Code";

function normalizeTrainingPurpose(value) {
  const s = safeStr(value);

  if (!s) return null;

  const upper = s.toUpperCase();

  if (upper === "NEW_DRIVER_LICENSE" || upper.includes("NEW DRIVER")) {
    return TRAINING_PURPOSE_NEW;
  }

  if (upper === "ADDITIONAL_DL_CODE" || upper.includes("ADDITIONAL")) {
    return TRAINING_PURPOSE_ADDITIONAL;
  }

  return null;
}

function isPdcCourseCode(courseCode) {
  return String(courseCode || "")
    .trim()
    .toUpperCase()
    .startsWith("PDC-");
}

function deriveDlCodeFromCourseCode(courseCode) {
  const code = String(courseCode || "")
    .trim()
    .toUpperCase();

  if (code === "PDC-A") return "A";
  if (code === "PDC-B") return "B";
  if (code === "PDC-AB") return "AB";

  return null;
}

const ADMIN_LATE_ADD_GRACE_HOURS = 8;

function isSupportedDrivingCourseCode(courseCode) {
  const code = String(courseCode || "")
    .trim()
    .toUpperCase();

  return (
    code === "TDC" || code === "PDC-A" || code === "PDC-B" || code === "PDC-AB"
  );
}

async function getTableColumns(tableName, db = pool) {
  const [rows] = await db.execute(
    `
    SELECT COLUMN_NAME AS name
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
    `,
    [tableName],
  );
  return new Set((rows || []).map((r) => r.name));
}

function dlCodeExprSql() {
  return `
    CASE
      WHEN c.course_code = 'PDC-A' THEN 'A'
      WHEN c.course_code = 'PDC-B' THEN 'B'
      WHEN c.course_code = 'PDC-AB' THEN 'AB'
      ELSE NULL
    END
  `;
}
function sourceExprSql() {
  return `
    CASE
      WHEN sr.reservation_source IS NULL OR sr.reservation_source = '' THEN 'online'
      ELSE LOWER(sr.reservation_source)
    END
  `;
}
function statusExprSql() {
  return `LOWER(sr.reservation_status)`;
}



// ------------------------
// INTERNAL: get course fee (peso) from courses table
// ------------------------
async function getCourseFeePeso(courseId, db = pool) {
  const cols = await getTableColumns("courses", db);

  // your schema shows course_fee, but keep fallback options just in case
  const feeCol = cols.has("course_fee")
    ? "course_fee"
    : cols.has("fee")
      ? "fee"
      : cols.has("amount")
        ? "amount"
        : null;

  if (!feeCol) return 0;

  const [rows] = await db.execute(
    `SELECT ${feeCol} AS fee FROM courses WHERE id = ? LIMIT 1`,
    [courseId],
  );

  const raw = rows?.[0]?.fee;

  // handle: number, string, "0.00"
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}


// ------------------------
// INTERNAL: username generator (unique)
// ------------------------
async function generateUniqueUsername(preferred, db = pool) {
  const basePref = safeStr(preferred);
  let base =
    basePref ||
    `walkin_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;

  if (!safeStr(base)) {
    base = `walkin_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  for (let i = 0; i < 10; i++) {
    const candidate =
      i === 0 ? base : `${base}_${Math.floor(Math.random() * 9000 + 1000)}`;
    const [rows] = await db.execute(
      `SELECT 1 FROM users WHERE username = ? LIMIT 1`,
      [candidate],
    );
    if (!rows?.length) return candidate;
  }

  return `walkin_${Date.now()}_${Math.floor(Math.random() * 900000 + 100000)}`;
}

// ------------------------
// INTERNAL: mark paid (if tables/columns exist)
// ------------------------
async function applyPaidIfRequested({
  db = pool,
  track,
  srCols,
  spsCols,
  reservationId,
  scheduleId,
  studentId,
  courseId,
  payment_method,
  paid_amount_peso, // <-- NOW should come from courses.course_fee (unless overridden)
}) {
  const payMethod = safeStr(payment_method).toUpperCase() || "CASH";
  const now = new Date();

  // ✅ your rule: driving = auto paid, tesda = no auto paid by default
  const shouldPaid = track === "driving";
  if (!shouldPaid) return;

  // amount default from course_fee
  const peso = Number(paid_amount_peso || 0);
  const centavos = Number.isFinite(peso) ? Math.round(peso * 100) : 0;

  // 1) update schedule_reservations columns if present
  const sets = [];
  const params = [];

  if (srCols.has("payment_method")) {
    sets.push("payment_method = ?");
    params.push(payMethod);
  }
  if (srCols.has("updated_at")) {
    sets.push("updated_at = ?");
    params.push(now);
  }

  // optional: if your sr table has an amount column, fill it too
  if (srCols.has("amount_centavos")) {
    sets.push("amount_centavos = ?");
    params.push(centavos);
  } else if (srCols.has("amount")) {
    sets.push("amount = ?");
    params.push(peso);
  } else if (srCols.has("paid_amount")) {
    sets.push("paid_amount = ?");
    params.push(peso);
  }

  if (sets.length) {
    params.push(reservationId);
    await db.execute(
      `UPDATE schedule_reservations SET ${sets.join(", ")} WHERE reservation_id = ?`,
      params,
    );
  }

  // 2) insert into student_payment_submissions if table exists & columns match
  if (!spsCols || !spsCols.size) return;

  const insertCols = [];
  const insertVals = [];
  const p = [];

  // keys
  if (spsCols.has("schedule_id")) {
    insertCols.push("schedule_id");
    insertVals.push("?");
    p.push(scheduleId);
  }
  if (spsCols.has("student_id")) {
    insertCols.push("student_id");
    insertVals.push("?");
    p.push(studentId);
  }
  if (spsCols.has("course_id")) {
    insertCols.push("course_id");
    insertVals.push("?");
    p.push(courseId);
  }

  if (spsCols.has("payment_ref")) {
    insertCols.push("payment_ref");
    insertVals.push("?");
    p.push(`ADMIN-WALKIN-${Date.now()}`);
  }
  if (spsCols.has("status")) {
    insertCols.push("status");
    insertVals.push("?");
    p.push("VERIFIED");
  }
  if (spsCols.has("verified_at")) {
    insertCols.push("verified_at");
    insertVals.push("?");
    p.push(now);
  }
  if (spsCols.has("created_at")) {
    insertCols.push("created_at");
    insertVals.push("?");
    p.push(now);
  }
  if (spsCols.has("updated_at")) {
    insertCols.push("updated_at");
    insertVals.push("?");
    p.push(now);
  }

  // amount fields
  if (spsCols.has("amount_centavos")) {
    insertCols.push("amount_centavos");
    insertVals.push("?");
    p.push(centavos);
  } else if (spsCols.has("amount")) {
    insertCols.push("amount");
    insertVals.push("?");
    p.push(peso);
  } else if (spsCols.has("paid_amount")) {
    insertCols.push("paid_amount");
    insertVals.push("?");
    p.push(peso);
  }

  if (spsCols.has("currency")) {
    insertCols.push("currency");
    insertVals.push("?");
    p.push("PHP");
  }
  if (spsCols.has("payment_method")) {
    insertCols.push("payment_method");
    insertVals.push("?");
    p.push(payMethod);
  }

  const hasKeys =
    insertCols.includes("schedule_id") &&
    insertCols.includes("student_id") &&
    insertCols.includes("course_id");

  if (hasKeys) {
    await db.execute(
      `INSERT INTO student_payment_submissions (${insertCols.join(", ")}) VALUES (${insertVals.join(", ")})`,
      p,
    );
  }
}

// ------------------------
// GET /api/admin/students
// ------------------------
exports.listStudents = async (req, res) => {
  try {
    const track = safeStr(req.query.track || "driving").toLowerCase();
    const q = safeStr(req.query.q);
    const source = safeStr(req.query.source || "all").toLowerCase();
    const status = safeStr(req.query.status || "all").toLowerCase();
    const { page, limit, offset } = clampLimitOffset(
      req.query.page,
      req.query.limit,
    );

    const srCols = await getTableColumns("schedule_reservations");

    const drivingWhere = `(c.course_name LIKE '%Driving%' OR c.course_code LIKE 'PDC-%')`;
    const tesdaWhere = `NOT ${drivingWhere}`;

    let where = `
      WHERE u.role = 'user'
        AND COALESCE(sr.is_historical, 0) = 0
    `;

    const params = [];

    if (track === "tesda") {
      where += ` AND ${tesdaWhere}`;
    } else {
      where += ` AND ${drivingWhere}`;

      // Sa multi-day Driving schedules (PDC-AB / TDC),
      // Day 1 lang ang ipapakita sa Students Management.
      where += `
        AND (
          s.schedule_group_id IS NULL
          OR s.session_no = 1
        )
      `;
    }

    if (source === "online" || source === "walkin") {
      where += ` AND ${sourceExprSql()} = ?`;
      params.push(source);
    }

    const allowedReservationStatuses = new Set([
      "pending",
      "confirmed",
      "approved",
      "active",
      "done",
      "completed",
      "finished",
      "cancelled",
      "canceled",
      "rejected",
    ]);
    if (status !== "all" && allowedReservationStatuses.has(status)) {
      where += ` AND ${statusExprSql()} = ?`;
      params.push(status);
    }

    if (q) {
      const like = `%${safeLike(q)}%`;
      where += `
        AND (
          u.fullname LIKE ? OR
          u.email LIKE ? OR
          CAST(sr.student_id AS CHAR) LIKE ? OR
          sr.lto_client_id LIKE ? OR
          c.course_name LIKE ? OR
          c.course_code LIKE ? OR
          i.fullname LIKE ?
        )
      `;
      params.push(like, like, like, like, like, like, like);
    }

    const [countRows] = await pool.execute(
      `
      SELECT COUNT(*) AS total
      FROM schedule_reservations sr
      LEFT JOIN users u ON u.id = sr.student_id
      LEFT JOIN courses c ON c.id = sr.course_id
      LEFT JOIN schedules s ON s.schedule_id = sr.schedule_id
      LEFT JOIN instructors i ON i.instructor_id = s.instructor_id
      ${where}
      `,
      params,
    );
    const total = parseInt(countRows?.[0]?.total ?? 0, 10) || 0;

    const trainingPurposeSelect = srCols.has("training_purpose")
      ? `sr.training_purpose AS training_purpose`
      : `NULL AS training_purpose`;

    const sql = `
      SELECT
        sr.reservation_id,
        sr.schedule_id,
        sr.student_id,

        sr.lto_client_id AS client_id,
        u.fullname AS full_name,
        u.email,
        u.birthday AS birthdate,
        u.gender AS sex,

        c.id AS course_id,
        c.course_name,
        c.course_code,

        ${dlCodeExprSql()} AS dl_code,

        s.schedule_date,
        s.start_time,
        s.end_time,
        s.schedule_group_id,
        s.session_no,

        i.fullname AS instructor_name,

        ${sourceExprSql()} AS source,
        ${statusExprSql()} AS status,

        COALESCE(
          CASE
            WHEN s.schedule_group_id IS NOT NULL THEN (
              SELECT MIN(sg.schedule_date)
              FROM schedules sg
              WHERE sg.schedule_group_id = s.schedule_group_id
            )
            ELSE s.schedule_date
          END,
          DATE(sr.created_at)
        ) AS course_start,

        COALESCE(
          CASE
            WHEN s.schedule_group_id IS NOT NULL THEN (
              SELECT MAX(sg.schedule_date)
              FROM schedules sg
              WHERE sg.schedule_group_id = s.schedule_group_id
            )
            ELSE s.schedule_date
          END,
          DATE(sr.created_at)
        ) AS course_end,

        ${trainingPurposeSelect},

        sr.created_at AS enrollmentDate

      FROM schedule_reservations sr
      LEFT JOIN users u ON u.id = sr.student_id
      LEFT JOIN courses c ON c.id = sr.course_id
      LEFT JOIN schedules s ON s.schedule_id = sr.schedule_id
      LEFT JOIN instructors i ON i.instructor_id = s.instructor_id

      ${where}

      ORDER BY sr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await pool.execute(sql, params);

    return res.json({
      status: "success",
      data: rows,
      meta: {
        track,
        source,
        status,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("listStudents error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch students",
      debug: err.sqlMessage || err.message,
    });
  }
};

// ------------------------
// POST /api/admin/students
// - DRIVING: auto VERIFIED payment for walk-in
// - reservation remains CONFIRMED until training completion
// - TESDA: no auto payment by default
// ------------------------
exports.createStudent = async (req, res) => {
  const body = req.body || {};
  const track = safeStr(body.track || "driving").toLowerCase();

  const fail = (statusCode, message) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
  };

  const courseId = Number(body.course_id);
  const requestedScheduleId = Number(body.schedule_id);

  if (!["driving", "tesda"].includes(track)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid student track.",
    });
  }

  if (!Number.isInteger(courseId) || courseId < 1) {
    return res.status(400).json({
      status: "error",
      message: "Please select a valid course.",
    });
  }

  if (!Number.isInteger(requestedScheduleId) || requestedScheduleId < 1) {
    return res.status(400).json({
      status: "error",
      message: "Please select an available schedule.",
    });
  }

  const fullName = safeStr(body.full_name);

  if (!fullName) {
    return res.status(400).json({
      status: "error",
      message: "Full name is required.",
    });
  }

  const paymentMethod = safeStr(body.payment_method).toUpperCase() || "CASH";

  if (track === "driving" && !["CASH", "GCASH"].includes(paymentMethod)) {
    return res.status(400).json({
      status: "error",
      message: "Payment method must be CASH or GCASH.",
    });
  }

  let conn = null;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // =====================================================
    // 1. AUTHORITATIVE COURSE
    // =====================================================
    const [courseRows] = await conn.execute(
      `
      SELECT
        id,
        course_code,
        course_name,
        course_fee
      FROM courses
      WHERE id = ?
      LIMIT 1
      `,
      [courseId],
    );

    if (!courseRows.length) {
      throw fail(404, "Selected course not found.");
    }

    const selectedCourseRecord = courseRows[0];

    if (
      track === "driving" &&
      !isSupportedDrivingCourseCode(selectedCourseRecord.course_code)
    ) {
      throw fail(400, "Selected course is not a valid Driving course.");
    }

    const derivedDlCode = deriveDlCodeFromCourseCode(
      selectedCourseRecord.course_code,
    );

    const isPdc = track === "driving" && derivedDlCode !== null;

    let normalizedTrainingPurpose = null;

    if (isPdc) {
      normalizedTrainingPurpose = normalizeTrainingPurpose(
        body.training_purpose,
      );

      if (!normalizedTrainingPurpose) {
        throw fail(400, "Training purpose is required for PDC.");
      }
    }

    // =====================================================
    // 2. LOCK + VALIDATE SELECTED SCHEDULE
    //
    // ADMIN LATE-ADD RULE:
    //
    // normal/current schedule:
    //   allowed
    //
    // recently finished:
    //   allowed up to 8 hours
    //
    // TDC / PDC-AB:
    //   8-hour countdown starts after FINAL session
    //
    // manually CLOSED:
    //   blocked
    //
    // FULL:
    //   blocked later by slot checking
    // =====================================================
    const [scheduleRows] = await conn.execute(
      `
        SELECT
          schedule_id,
          schedule_group_id,
          session_no,
          course_id,
          schedule_date,
          start_time,
          end_time,
          total_slots,
          status
        FROM schedules
        WHERE schedule_id = ?
        LIMIT 1
        FOR UPDATE
        `,
      [requestedScheduleId],
    );

    if (!scheduleRows.length) {
      throw fail(404, "Selected schedule not found.");
    }

    const selectedSchedule = scheduleRows[0];

    if (Number(selectedSchedule.course_id) !== Number(courseId)) {
      throw fail(
        400,
        "Selected schedule does not belong to the selected course.",
      );
    }

    const selectedRawStatus = String(
      selectedSchedule.status || "",
    ).toLowerCase();

    // Important:
    // Schedule Management may DISPLAY it as Done/Closed
    // because the time passed.
    //
    // We only block it here when the stored schedule
    // was explicitly/manual closed.
    if (["closed", "cancelled", "canceled"].includes(selectedRawStatus)) {
      throw fail(
        400,
        "Selected schedule was manually closed and cannot accept students.",
      );
    }

    if (
      selectedSchedule.schedule_group_id &&
      Number(selectedSchedule.session_no) !== 1
    ) {
      throw fail(
        400,
        "Please select the first session of the schedule package.",
      );
    }

    // =====================================================
    // 3. LOAD + LOCK ALL PACKAGE SESSIONS
    // =====================================================
    let reservationSchedules = [selectedSchedule];

    if (selectedSchedule.schedule_group_id) {
      const [groupRows] = await conn.execute(
        `
          SELECT
            schedule_id,
            schedule_group_id,
            session_no,
            course_id,
            schedule_date,
            start_time,
            end_time,
            total_slots,
            status
          FROM schedules
          WHERE schedule_group_id = ?
          ORDER BY
            schedule_date ASC,
            session_no ASC
          FOR UPDATE
          `,
        [selectedSchedule.schedule_group_id],
      );

      if (!groupRows.length) {
        throw fail(400, "Schedule package has no sessions.");
      }

      reservationSchedules = groupRows;
    }

    // =====================================================
    // CHECK ALL PACKAGE MEMBERS
    // =====================================================
    for (const sched of reservationSchedules) {
      if (Number(sched.course_id) !== Number(courseId)) {
        throw fail(400, "Schedule package contains a different course.");
      }

      const rawStatus = String(sched.status || "").toLowerCase();

      if (["closed", "cancelled", "canceled"].includes(rawStatus)) {
        throw fail(400, "One of the schedule sessions was manually closed.");
      }
    }

    // =====================================================
    // ADMIN LATE-ADD WINDOW
    //
    // SINGLE-DAY:
    // schedule end + 8 hours
    //
    // MULTI-DAY:
    // FINAL session end + 8 hours
    //
    // Uses Philippine time:
    // UTC + 8
    // =====================================================
    const scheduleIds = reservationSchedules
      .map((s) => Number(s.schedule_id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (!scheduleIds.length) {
      throw fail(400, "Schedule package has no valid sessions.");
    }

    const latePlaceholders = scheduleIds.map(() => "?").join(",");

    const [lateRows] = await conn.execute(
      `
        SELECT
          MAX(
            TIMESTAMP(
              schedule_date,
              COALESCE(
                end_time,
                '23:59:59'
              )
            )
          ) AS logical_end,

          CASE
            WHEN DATE_ADD(
              MAX(
                TIMESTAMP(
                  schedule_date,
                  COALESCE(
                    end_time,
                    '23:59:59'
                  )
                )
              ),
              INTERVAL ${ADMIN_LATE_ADD_GRACE_HOURS} HOUR
            )
            >=
            DATE_ADD(
              UTC_TIMESTAMP(),
              INTERVAL 8 HOUR
            )
            THEN 1
            ELSE 0
          END AS can_admin_add

        FROM schedules
        WHERE schedule_id
          IN (${latePlaceholders})
        `,
      scheduleIds,
    );

    const canAdminAdd = Number(lateRows?.[0]?.can_admin_add || 0) === 1;

    if (!canAdminAdd) {
      throw fail(
        400,
        `This schedule is already too old. Admin late-add is allowed only up to ${ADMIN_LATE_ADD_GRACE_HOURS} hours after the final session ends.`,
      );
    }

    // =====================================================
    // 4. TABLE METADATA
    // =====================================================
    const uCols = await getTableColumns("users", conn);

    const srCols = await getTableColumns("schedule_reservations", conn);

    if (
      !srCols.has("schedule_id") ||
      !srCols.has("student_id") ||
      !srCols.has("course_id")
    ) {
      throw new Error(
        "schedule_reservations table is missing required columns.",
      );
    }

    // =====================================================
    // 5. CREATE / REUSE STUDENT USER
    // =====================================================
    const email = safeStr(body.email) || null;

    let studentId = null;

    if (email) {
      const [existing] = await conn.execute(
        `
          SELECT id
          FROM users
          WHERE email = ?
          LIMIT 1
          FOR UPDATE
          `,
        [email],
      );

      if (existing?.[0]?.id) {
        studentId = Number(existing[0].id);
      }
    }

    // =====================================================
    // NEW USER
    // =====================================================
    if (!studentId) {
      const insertCols = [];
      const insertVals = [];
      const params = [];

      if (uCols.has("fullname")) {
        insertCols.push("fullname");

        insertVals.push("?");

        params.push(fullName);
      }

      if (uCols.has("email")) {
        insertCols.push("email");

        insertVals.push("?");

        params.push(email);
      }

      if (uCols.has("birthday")) {
        insertCols.push("birthday");

        insertVals.push("?");

        params.push(body.birthdate || null);
      }

      if (uCols.has("gender")) {
        insertCols.push("gender");

        insertVals.push("?");

        params.push(normalizeGender(body.sex));
      }

      if (uCols.has("role")) {
        insertCols.push("role");

        insertVals.push("?");

        params.push("user");
      }

      if (uCols.has("username")) {
        const uname = await generateUniqueUsername(body.username, conn);

        insertCols.push("username");

        insertVals.push("?");

        params.push(uname);
      }

      if (!insertCols.length) {
        throw new Error("users table missing expected columns.");
      }

      const [uIns] = await conn.execute(
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
        params,
      );

      studentId = Number(uIns.insertId);
    }

    // =====================================================
    // EXISTING USER
    // =====================================================
    else {
      const uSets = [];
      const uParams = [];

      if (uCols.has("fullname") && body.full_name !== undefined) {
        uSets.push("fullname = ?");

        uParams.push(safeStr(body.full_name) || null);
      }

      if (uCols.has("birthday") && body.birthdate !== undefined) {
        uSets.push("birthday = ?");

        uParams.push(body.birthdate || null);
      }

      if (uCols.has("gender") && body.sex !== undefined) {
        uSets.push("gender = ?");

        uParams.push(normalizeGender(body.sex));
      }

      if (uSets.length) {
        uParams.push(studentId);

        await conn.execute(
          `
          UPDATE users
          SET
            ${uSets.join(", ")}
          WHERE id = ?
          `,
          uParams,
        );
      }
    }

    // =====================================================
    // 6. CAPACITY + DUPLICATE VALIDATION
    // =====================================================
    const occupyingStatuses = [
      "PENDING",
      "CONFIRMED",
      "APPROVED",
      "ACTIVE",
      "DONE",
    ];

    const placeholders = occupyingStatuses.map(() => "?").join(",");

    for (const sched of reservationSchedules) {
      // ===============================================
      // SLOT CHECK
      // ===============================================
      const [usedRows] = await conn.execute(
        `
          SELECT
            COUNT(*) AS used
          FROM
            schedule_reservations
          WHERE
            schedule_id = ?
            AND UPPER(
              reservation_status
            ) IN (
              ${placeholders}
            )
          `,
        [Number(sched.schedule_id), ...occupyingStatuses],
      );

      const used = Number(usedRows?.[0]?.used || 0);

      const totalSlots = Number(sched.total_slots || 0);

      if (used >= totalSlots) {
        throw fail(409, `Schedule on ${sched.schedule_date} is already full.`);
      }

      // ===============================================
      // DUPLICATE CHECK
      // ===============================================
      const [duplicateRows] = await conn.execute(
        `
          SELECT
            reservation_id
          FROM
            schedule_reservations
          WHERE
            schedule_id = ?
            AND student_id = ?
          LIMIT 1
          `,
        [Number(sched.schedule_id), studentId],
      );

      if (duplicateRows.length) {
        throw fail(
          409,
          "This student already has a reservation for the selected schedule.",
        );
      }
    }

    // =====================================================
    // 7. CREATE ALL RESERVATION SESSIONS
    // =====================================================
    const reservationIds = [];

    for (const sched of reservationSchedules) {
      const srInsertCols = [];
      const srInsertVals = [];
      const srParams = [];

      // schedule
      srInsertCols.push("schedule_id");

      srInsertVals.push("?");

      srParams.push(Number(sched.schedule_id));

      // student
      srInsertCols.push("student_id");

      srInsertVals.push("?");

      srParams.push(studentId);

      // course
      srInsertCols.push("course_id");

      srInsertVals.push("?");

      srParams.push(courseId);

      // LTO client ID
      if (srCols.has("lto_client_id")) {
        srInsertCols.push("lto_client_id");

        srInsertVals.push("?");

        srParams.push(body.client_id || null);
      }

      // source
      if (srCols.has("reservation_source")) {
        srInsertCols.push("reservation_source");

        srInsertVals.push("?");

        srParams.push("walkin");
      }

      // status
      if (srCols.has("reservation_status")) {
        srInsertCols.push("reservation_status");

        srInsertVals.push("?");

        // Even for late add:
        // student starts as CONFIRMED,
        // NOT automatically DONE.
        srParams.push("CONFIRMED");
      }

      // training purpose
      if (srCols.has("training_purpose")) {
        srInsertCols.push("training_purpose");

        srInsertVals.push("?");

        srParams.push(isPdc ? normalizedTrainingPurpose : null);
      }

      // payment method
      if (srCols.has("payment_method") && track === "driving") {
        srInsertCols.push("payment_method");

        srInsertVals.push("?");

        srParams.push(paymentMethod);
      }

      // historical
      if (srCols.has("is_historical")) {
        srInsertCols.push("is_historical");

        srInsertVals.push("?");

        srParams.push(0);
      }

      const [srIns] = await conn.execute(
        `
          INSERT INTO
            schedule_reservations
            (
              ${srInsertCols.join(", ")}
            )
          VALUES
            (
              ${srInsertVals.join(", ")}
            )
          `,
        srParams,
      );

      reservationIds.push({
        reservation_id: Number(srIns.insertId),

        schedule_id: Number(sched.schedule_id),
      });
    }

    if (!reservationIds.length) {
      throw new Error("No reservation was created.");
    }

    // =====================================================
    // REPRESENTATIVE / DAY 1
    // =====================================================
    const reservationId = reservationIds[0].reservation_id;

    const scheduleId = reservationIds[0].schedule_id;

    // =====================================================
    // 8. AUTHORITATIVE COURSE FEE
    // ONE PAYMENT ONLY
    // =====================================================
    const feePeso = await getCourseFeePeso(courseId, conn);

    let spsCols = null;

    try {
      spsCols = await getTableColumns("student_payment_submissions", conn);
    } catch {
      spsCols = null;
    }

    await applyPaidIfRequested({
      db: conn,

      track,

      srCols,

      spsCols,

      reservationId,

      scheduleId,

      studentId,

      courseId,

      payment_method: paymentMethod,

      paid_amount_peso: feePeso,
    });

    // =====================================================
    // 9. COMMIT
    // =====================================================
    await conn.commit();

    return res.json({
      status: "success",

      message: "Student created",

      data: {
        reservation_id: reservationId,

        reservation_ids: reservationIds.map((r) => r.reservation_id),

        student_id: studentId,

        schedule_id: scheduleId,

        schedule_ids: reservationIds.map((r) => r.schedule_id),

        course_id: courseId,

        paid_amount_peso: track === "driving" ? feePeso : 0,
      },
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("createStudent rollback error:", rollbackErr);
      }
    }

    console.error("createStudent error:", err);

    const statusCode =
      Number(err.statusCode) || (err.code === "ER_DUP_ENTRY" ? 409 : 500);

    return res.status(statusCode).json({
      status: "error",

      message: statusCode >= 500 ? "Failed to create student" : err.message,

      debug: statusCode >= 500 ? err.sqlMessage || err.message : undefined,
    });
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

// ------------------------
// PUT /api/admin/students/:reservationId
// ------------------------
exports.updateStudent = async (req, res) => {
  const reservationId = Number(req.params.reservationId);
  const body = req.body || {};
  const track = safeStr(body.track || "driving").toLowerCase();

  try {
    if (!reservationId) throw new Error("Invalid reservation_id");

    const [curRows] = await pool.execute(
      `
      SELECT
        sr.reservation_id,
        sr.student_id,
        sr.schedule_id,
        sr.course_id,
        s.schedule_group_id,
        s.session_no
      FROM schedule_reservations sr
      LEFT JOIN schedules s
        ON s.schedule_id = sr.schedule_id
      WHERE sr.reservation_id = ?
      LIMIT 1
      `,
      [reservationId],
    );
    const cur = curRows?.[0];
    if (!cur) throw new Error("Reservation not found");

    // ✅ Course assignment cannot be changed from Students Management
    const courseId = Number(cur.course_id);

    if (!Number.isInteger(courseId) || courseId < 1) {
      return res.status(400).json({
        status: "error",
        message: "Student reservation has no valid course.",
      });
    }

    // ✅ Get authoritative course information
    const [editCourseRows] = await pool.execute(
      `
  SELECT
    id,
    course_code,
    course_name
  FROM courses
  WHERE id = ?
  LIMIT 1
  `,
      [courseId],
    );

    if (!editCourseRows.length) {
      return res.status(404).json({
        status: "error",
        message: "Assigned course no longer exists.",
      });
    }

    const editCourse = editCourseRows[0];

    const editIsPdc =
      track === "driving" && isPdcCourseCode(editCourse.course_code);

    let editTrainingPurpose = null;

    // Validate only when training_purpose is being updated
    if (editIsPdc && body.training_purpose !== undefined) {
      editTrainingPurpose = normalizeTrainingPurpose(body.training_purpose);

      if (!editTrainingPurpose) {
        return res.status(400).json({
          status: "error",
          message: "Training purpose is required for PDC.",
        });
      }
    }

    const uCols = await getTableColumns("users");
    const srCols = await getTableColumns("schedule_reservations");

    // update users
    const uSets = [];
    const uParams = [];
    if (uCols.has("fullname") && body.full_name !== undefined) {
      uSets.push("fullname = ?");
      uParams.push(safeStr(body.full_name) || null);
    }
    if (uCols.has("birthday") && body.birthdate !== undefined) {
      uSets.push("birthday = ?");
      uParams.push(body.birthdate || null);
    }
    if (uCols.has("gender") && body.sex !== undefined) {
      uSets.push("gender = ?");
      uParams.push(normalizeGender(body.sex));
    }

    // email unique handling: only update if not used by another user
    if (uCols.has("email") && body.email !== undefined) {
      const newEmail = safeStr(body.email) || null;
      if (newEmail) {
        const [dupe] = await pool.execute(
          `SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1`,
          [newEmail, cur.student_id],
        );
        if (dupe?.[0]?.id)
          throw new Error("Email already used by another user.");
      }
      uSets.push("email = ?");
      uParams.push(newEmail);
    }

    if (uSets.length) {
      uParams.push(cur.student_id);
      await pool.execute(
        `UPDATE users SET ${uSets.join(", ")} WHERE id = ?`,
        uParams,
      );
    }

    // ensure schedule_id if null
    // ✅ Schedule assignment is controlled only by Schedule Management
    const scheduleId = Number(cur.schedule_id);

    if (!Number.isInteger(scheduleId) || scheduleId < 1) {
      return res.status(400).json({
        status: "error",
        message: "Student reservation has no valid schedule.",
      });
    }

    const [existingScheduleRows] = await pool.execute(
      `
        SELECT
          schedule_id,
          course_id,
          schedule_group_id,
          session_no
        FROM schedules
        WHERE schedule_id = ?
        LIMIT 1
        `,
      [scheduleId],
    );

    if (!existingScheduleRows.length) {
      return res.status(404).json({
        status: "error",
        message: "Assigned schedule no longer exists.",
      });
    }

    if (Number(existingScheduleRows[0].course_id) !== courseId) {
      return res.status(400).json({
        status: "error",
        message: "Reservation course does not match its assigned schedule.",
      });
    }

    // update schedule_reservations
    const srSets = [];
    const srParams = [];

    if (srCols.has("lto_client_id") && body.client_id !== undefined) {
      srSets.push("lto_client_id = ?");
      srParams.push(body.client_id || null);
    }
    if (srCols.has("reservation_source") && body.source !== undefined) {
      srSets.push("reservation_source = ?");
      srParams.push(body.source || null);
    }
    if (srCols.has("reservation_status") && body.status !== undefined) {
      srSets.push("reservation_status = ?");
      srParams.push(String(body.status || "").toUpperCase());
    }

    if (srCols.has("training_purpose") && body.training_purpose !== undefined) {
      srSets.push("training_purpose = ?");

      srParams.push(editIsPdc ? editTrainingPurpose : null);
    }

    if (srCols.has("payment_method") && body.payment_method !== undefined) {
      srSets.push("payment_method = ?");
      srParams.push(safeStr(body.payment_method).toUpperCase() || null);
    }

    if (srSets.length) {
      // ✅ Multi-day package:
      // update ALL reservation sessions of this student
      if (cur.schedule_group_id) {
        srParams.push(Number(cur.student_id), cur.schedule_group_id);

        await pool.execute(
          `
          UPDATE schedule_reservations sr
          JOIN schedules s
            ON s.schedule_id = sr.schedule_id
          SET ${srSets.join(", ")}
          WHERE sr.student_id = ?
            AND s.schedule_group_id = ?
          `,
          srParams,
        );
      } else {
        // ✅ Single-day / legacy reservation
        srParams.push(reservationId);

        await pool.execute(
          `
          UPDATE schedule_reservations
          SET ${srSets.join(", ")}
          WHERE reservation_id = ?
          `,
          srParams,
        );
      }
    }

    return res.json({ status: "success", message: "Student updated" });
  } catch (err) {
    console.error("updateStudent error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to update student",
      debug: err.sqlMessage || err.message,
    });
  }
};

// ------------------------
// DELETE /api/admin/students/:reservationId
// - also tries to delete linked payment submission rows to avoid FK issues
// ------------------------
exports.deleteStudent = async (req, res) => {
  const reservationId = Number(req.params.reservationId);

  if (!Number.isInteger(reservationId) || reservationId < 1) {
    return res.status(400).json({
      status: "error",
      message: "Invalid reservation_id",
    });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Get selected reservation + schedule group
    const [curRows] = await conn.execute(
      `
      SELECT
        sr.reservation_id,
        sr.schedule_id,
        sr.student_id,
        sr.course_id,
        s.schedule_group_id,
        s.session_no
      FROM schedule_reservations sr
      LEFT JOIN schedules s
        ON s.schedule_id = sr.schedule_id
      WHERE sr.reservation_id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [reservationId],
    );

    const cur = curRows?.[0];

    if (!cur) {
      await conn.rollback();

      return res.json({
        status: "success",
        message: "Student deleted (already removed)",
      });
    }

    let targetReservations = [];

    // =====================================================
    // ✅ MULTI-DAY PACKAGE
    // Delete all reservation sessions of this student
    // =====================================================
    if (cur.schedule_group_id) {
      const [groupRows] = await conn.execute(
        `
        SELECT
          sr.reservation_id,
          sr.schedule_id
        FROM schedule_reservations sr
        JOIN schedules s
          ON s.schedule_id = sr.schedule_id
        WHERE sr.student_id = ?
          AND sr.course_id = ?
          AND s.schedule_group_id = ?
        FOR UPDATE
        `,
        [Number(cur.student_id), Number(cur.course_id), cur.schedule_group_id],
      );

      targetReservations = groupRows;
    } else {
      // Single-day / legacy reservation
      targetReservations = [
        {
          reservation_id: Number(cur.reservation_id),
          schedule_id: Number(cur.schedule_id),
        },
      ];
    }

    if (!targetReservations.length) {
      throw new Error("No reservation records found for deletion.");
    }

    const reservationIds = targetReservations
      .map((r) => Number(r.reservation_id))
      .filter((id) => Number.isInteger(id) && id > 0);

    const scheduleIds = targetReservations
      .map((r) => Number(r.schedule_id))
      .filter((id) => Number.isInteger(id) && id > 0);

    // =====================================================
    // ✅ Delete linked payment submissions first
    // Payment is recorded only once per logical enrollment
    // =====================================================
    try {
      const spsCols = await getTableColumns("student_payment_submissions");

      const hasRequiredKeys =
        spsCols.has("schedule_id") &&
        spsCols.has("student_id") &&
        spsCols.has("course_id");

      if (hasRequiredKeys && scheduleIds.length) {
        const schedulePlaceholders = scheduleIds.map(() => "?").join(",");

        await conn.execute(
          `
          DELETE FROM student_payment_submissions
          WHERE student_id = ?
            AND course_id = ?
            AND schedule_id IN (${schedulePlaceholders})
          `,
          [Number(cur.student_id), Number(cur.course_id), ...scheduleIds],
        );
      }
    } catch (paymentErr) {
      // Ignore only if payment table/columns are unavailable
      console.warn("Payment cleanup skipped:", paymentErr.message);
    }

    // =====================================================
    // ✅ Delete all reservation rows of logical enrollment
    // =====================================================
    const reservationPlaceholders = reservationIds.map(() => "?").join(",");

    await conn.execute(
      `
      DELETE FROM schedule_reservations
      WHERE reservation_id IN (${reservationPlaceholders})
      `,
      reservationIds,
    );

    await conn.commit();

    return res.json({
      status: "success",
      message:
        targetReservations.length > 1
          ? "Student enrollment and all schedule sessions deleted."
          : "Student reservation deleted.",
      data: {
        deleted_reservations: targetReservations.length,
      },
    });
  } catch (err) {
    await conn.rollback();

    console.error("deleteStudent error:", err);

    return res.status(500).json({
      status: "error",
      message: "Failed to delete student",
      debug: err.sqlMessage || err.message,
    });
  } finally {
    conn.release();
  }
};

// Legacy endpoint
exports.listDrivingStudentsConfirmed = async (req, res) => {
  try {
    const q = safeStr(req.query.q);
    const like = `%${safeLike(q)}%`;

    const sql = `
      SELECT
        u.id AS id,
        u.fullname AS name,
        u.email AS email,
        c.course_name AS course,
        MAX(sr.created_at) AS enrollmentDate
      FROM schedule_reservations sr
      JOIN users u ON u.id = sr.student_id
      JOIN courses c ON c.id = sr.course_id
      WHERE UPPER(sr.reservation_status) = 'CONFIRMED'
        AND (c.course_name LIKE '%Driving%' OR c.course_code LIKE 'PDC-%')
        AND u.role = 'user'
        AND (
          ? = '' OR
          u.fullname LIKE ? OR
          u.email LIKE ? OR
          CAST(u.id AS CHAR) LIKE ? OR
          sr.lto_client_id LIKE ?
        )
      GROUP BY u.id, u.fullname, u.email, c.course_name
      ORDER BY enrollmentDate DESC
    `;

    const [rows] = await pool.execute(sql, [q, like, like, like, like]);
    return res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("listDrivingStudentsConfirmed error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch driving confirmed students",
      debug: err.sqlMessage || err.message,
    });
  }
};

exports.listTesdaStudents = async (req, res) => {
  req.query.track = "tesda";
  return exports.listStudents(req, res);
};
