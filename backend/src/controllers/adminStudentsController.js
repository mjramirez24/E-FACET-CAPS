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
function toYMD(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (!s) return null;
  if (s === "m" || s === "male" || s === "lalaki") return "male";
  if (s === "f" || s === "female" || s === "babae") return "female";
  return safeStr(v) || null;
}

async function getTableColumns(tableName) {
  const [rows] = await pool.execute(
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
      WHEN c.course_code LIKE 'PDC-%' THEN SUBSTRING_INDEX(c.course_code, '-', -1)
      ELSE c.course_code
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

async function resolveInstructorIdOrDefault(instructor_name) {
  const name = safeStr(instructor_name);
  if (name) {
    const [rows] = await pool.execute(
      `SELECT instructor_id FROM instructors WHERE fullname = ? LIMIT 1`,
      [name],
    );
    if (rows?.[0]?.instructor_id) return Number(rows[0].instructor_id);
  }

  const [any] = await pool.execute(
    `SELECT instructor_id FROM instructors ORDER BY instructor_id ASC LIMIT 1`,
  );
  if (any?.[0]?.instructor_id) return Number(any[0].instructor_id);

  throw new Error("No instructors found. Add at least 1 instructor first.");
}

// ------------------------
// INTERNAL: get course fee (peso) from courses table
// ------------------------
async function getCourseFeePeso(courseId) {
  const cols = await getTableColumns("courses");

  // your schema shows course_fee, but keep fallback options just in case
  const feeCol = cols.has("course_fee")
    ? "course_fee"
    : cols.has("fee")
      ? "fee"
      : cols.has("amount")
        ? "amount"
        : null;

  if (!feeCol) return 0;

  const [rows] = await pool.execute(
    `SELECT ${feeCol} AS fee FROM courses WHERE id = ? LIMIT 1`,
    [courseId],
  );

  const raw = rows?.[0]?.fee;

  // handle: number, string, "0.00"
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

// ------------------------
// INTERNAL: resolve course
// ------------------------
async function resolveCourseId({ track, course_id, dl_code, course_name }) {
  if (course_id) return Number(course_id);

  const t = String(track || "").toLowerCase();

  if (t === "driving") {
    const code = safeStr(dl_code).toUpperCase();
    if (!code)
      throw new Error(
        "Driving DL Code is required (A/B/AB) or provide course_id.",
      );
    const wanted = `PDC-${code}`;
    const [rows] = await pool.execute(
      `SELECT id FROM courses WHERE course_code = ? LIMIT 1`,
      [wanted],
    );
    if (rows?.[0]?.id) return Number(rows[0].id);
    throw new Error(
      `No course found for ${wanted}. Create it in Courses first.`,
    );
  }

  const cn = safeStr(course_name);
  if (!cn)
    throw new Error("TESDA course_name is required or provide course_id.");

  const [rows] = await pool.execute(
    `SELECT id FROM courses WHERE course_name = ? LIMIT 1`,
    [cn],
  );
  if (rows?.[0]?.id) return Number(rows[0].id);

  // If you don't want auto-create TESDA courses, change this to throw
  const cols = await getTableColumns("courses");
  const insertCols = [];
  const insertVals = [];
  const params = [];

  if (cols.has("course_name")) {
    insertCols.push("course_name");
    insertVals.push("?");
    params.push(cn);
  }
  if (cols.has("course_code")) {
    insertCols.push("course_code");
    insertVals.push("?");
    params.push(`TESDA-${Date.now()}`);
  }

  if (!insertCols.length)
    throw new Error("courses table missing course_name/course_code.");

  const [ins] = await pool.execute(
    `INSERT INTO courses (${insertCols.join(", ")}) VALUES (${insertVals.join(", ")})`,
    params,
  );
  return Number(ins.insertId);
}

// ------------------------
// INTERNAL: schedule_id NOT NULL => create schedule if missing
// ------------------------
async function ensureScheduleId({
  schedule_id,
  courseId,
  course_start,
  instructor_name,
}) {
  if (schedule_id) return Number(schedule_id);

  const cols = await getTableColumns("schedules");
  const schedDate = toYMD(course_start) || toYMD(new Date());

  const insertCols = [];
  const insertVals = [];
  const params = [];

  if (cols.has("course_id")) {
    insertCols.push("course_id");
    insertVals.push("?");
    params.push(courseId);
  }
  if (cols.has("schedule_date")) {
    insertCols.push("schedule_date");
    insertVals.push("?");
    params.push(schedDate);
  }
  if (cols.has("start_time")) {
    insertCols.push("start_time");
    insertVals.push("?");
    params.push("08:00:00");
  }
  if (cols.has("end_time")) {
    insertCols.push("end_time");
    insertVals.push("?");
    params.push("17:00:00");
  }

  // instructor_id is NOT NULL in your DB => must provide
  if (cols.has("instructor_id")) {
    const instructorId = await resolveInstructorIdOrDefault(instructor_name);
    insertCols.push("instructor_id");
    insertVals.push("?");
    params.push(instructorId);
  }

  if (cols.has("status")) {
    insertCols.push("status");
    insertVals.push("?");
    params.push("OPEN");
  }

  if (!insertCols.length)
    throw new Error(
      "Cannot auto-create schedule: schedules table columns not recognized.",
    );

  const [ins] = await pool.execute(
    `INSERT INTO schedules (${insertCols.join(", ")}) VALUES (${insertVals.join(", ")})`,
    params,
  );
  return Number(ins.insertId);
}

// ------------------------
// INTERNAL: username generator (unique)
// ------------------------
async function generateUniqueUsername(preferred) {
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
    const [rows] = await pool.execute(
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
  if (srCols.has("reservation_status")) {
    sets.push("reservation_status = ?");
    params.push("DONE");
  }
  if (srCols.has("done_at")) {
    sets.push("done_at = ?");
    params.push(now);
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
    await pool.execute(
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
    await pool.execute(
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

    let where = `WHERE u.role = 'user'`;
    const params = [];

    if (track === "tesda") where += ` AND ${tesdaWhere}`;
    else where += ` AND ${drivingWhere}`;

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

        i.fullname AS instructor_name,

        ${sourceExprSql()} AS source,
        ${statusExprSql()} AS status,

        COALESCE(s.schedule_date, DATE(sr.created_at)) AS course_start,
        COALESCE(s.schedule_date, DATE(sr.created_at)) AS course_end,

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
// - DRIVING: auto PAID + DONE (walk-in)
// - TESDA: no auto payment by default
// ------------------------
exports.createStudent = async (req, res) => {
  const body = req.body || {};
  const track = safeStr(body.track || "driving").toLowerCase();

  try {
    // ✅ course selection required
    const courseId = await resolveCourseId({
      track,
      course_id: body.course_id,
      dl_code: body.dl_code,
      course_name: body.course_name,
    });

    const uCols = await getTableColumns("users");
    const srCols = await getTableColumns("schedule_reservations");

    const fullName = safeStr(body.full_name);
    if (!fullName) throw new Error("full_name is required");

    // ✅ email uniqueness: if provided email exists, reuse user
    const email = safeStr(body.email) || null;
    let studentId = null;

    if (email) {
      const [existing] = await pool.execute(
        `SELECT id FROM users WHERE email = ? LIMIT 1`,
        [email],
      );
      if (existing?.[0]?.id) studentId = Number(existing[0].id);
    }

    // if not found, create user
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

      // ✅ username uniqueness (your DB has unique username)
      if (uCols.has("username")) {
        const uname = await generateUniqueUsername(body.username);
        insertCols.push("username");
        insertVals.push("?");
        params.push(uname);
      }

      if (!insertCols.length)
        throw new Error("users table missing expected columns.");

      const [uIns] = await pool.execute(
        `INSERT INTO users (${insertCols.join(", ")}) VALUES (${insertVals.join(", ")})`,
        params,
      );
      studentId = Number(uIns.insertId);
    } else {
      // if user exists, allow updating gender/birthdate/fullname if provided
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
        await pool.execute(
          `UPDATE users SET ${uSets.join(", ")} WHERE id = ?`,
          uParams,
        );
      }
    }

    // ensure schedule_id (WALK-IN safe)
    const scheduleId = await ensureScheduleId({
      schedule_id: body.schedule_id,
      courseId,
      course_start: body.course_start,
      instructor_name: body.instructor_name,
    });

    // create reservation row
    const srInsertCols = [];
    const srInsertVals = [];
    const srParams = [];

    if (srCols.has("schedule_id")) {
      srInsertCols.push("schedule_id");
      srInsertVals.push("?");
      srParams.push(scheduleId);
    }
    if (srCols.has("student_id")) {
      srInsertCols.push("student_id");
      srInsertVals.push("?");
      srParams.push(studentId);
    }
    if (srCols.has("course_id")) {
      srInsertCols.push("course_id");
      srInsertVals.push("?");
      srParams.push(courseId);
    }

    if (srCols.has("lto_client_id")) {
      srInsertCols.push("lto_client_id");
      srInsertVals.push("?");
      srParams.push(body.client_id || null);
    }
    if (srCols.has("reservation_source")) {
      srInsertCols.push("reservation_source");
      srInsertVals.push("?");
      srParams.push(body.source || "walkin");
    }

    if (srCols.has("reservation_status")) {
      const initial = String(body.status || "CONFIRMED").toUpperCase();
      srInsertCols.push("reservation_status");
      srInsertVals.push("?");
      srParams.push(initial);
    }

    if (srCols.has("training_purpose")) {
      srInsertCols.push("training_purpose");
      srInsertVals.push("?");
      srParams.push(safeStr(body.training_purpose) || null);
    }

    // if your sr has payment_method, we can set now (driving auto paid also sets it)
    if (srCols.has("payment_method") && track === "driving") {
      srInsertCols.push("payment_method");
      srInsertVals.push("?");
      srParams.push(safeStr(body.payment_method).toUpperCase() || "CASH");
    }

    if (!srInsertCols.length) {
      throw new Error(
        "schedule_reservations table missing expected columns (schedule_id/student_id/course_id).",
      );
    }

    const [srIns] = await pool.execute(
      `INSERT INTO schedule_reservations (${srInsertCols.join(", ")}) VALUES (${srInsertVals.join(", ")})`,
      srParams,
    );

    const reservationId = Number(srIns.insertId);

    // ✅ AUTO PAID for DRIVING using courses.course_fee (not 0)
    // if request body provides paid_amount_peso, it can override; otherwise pull from course_fee
    const feePeso = await getCourseFeePeso(courseId);
    const paidPeso =
      body.paid_amount_peso !== undefined && body.paid_amount_peso !== null
        ? Number(body.paid_amount_peso)
        : feePeso;

    let spsCols = null;
    try {
      spsCols = await getTableColumns("student_payment_submissions");
    } catch {
      spsCols = null;
    }

    await applyPaidIfRequested({
      track,
      srCols,
      spsCols,
      reservationId,
      scheduleId,
      studentId,
      courseId,
      payment_method: body.payment_method,
      paid_amount_peso: paidPeso,
    });

    return res.json({
      status: "success",
      message: "Student created",
      data: {
        reservation_id: reservationId,
        student_id: studentId,
        schedule_id: scheduleId,
        course_id: courseId,
        paid_amount_peso: track === "driving" ? paidPeso : 0,
      },
    });
  } catch (err) {
    console.error("createStudent error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to create student",
      debug: err.sqlMessage || err.message,
    });
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
      `SELECT reservation_id, student_id, schedule_id, course_id FROM schedule_reservations WHERE reservation_id = ? LIMIT 1`,
      [reservationId],
    );
    const cur = curRows?.[0];
    if (!cur) throw new Error("Reservation not found");

    const courseId = await resolveCourseId({
      track,
      course_id: body.course_id || cur.course_id,
      dl_code: body.dl_code,
      course_name: body.course_name,
    });

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
    let scheduleId = cur.schedule_id;
    if (!scheduleId) {
      scheduleId = await ensureScheduleId({
        schedule_id: body.schedule_id,
        courseId,
        course_start: body.course_start,
        instructor_name: body.instructor_name,
      });
    }

    // update schedule date if provided
    const sCols = await getTableColumns("schedules");
    const newStart = toYMD(body.course_start);
    if (scheduleId && newStart && sCols.has("schedule_date")) {
      await pool.execute(
        `UPDATE schedules SET schedule_date = ? WHERE schedule_id = ?`,
        [newStart, scheduleId],
      );
    }

    // update schedule_reservations
    const srSets = [];
    const srParams = [];

    if (srCols.has("course_id")) {
      srSets.push("course_id = ?");
      srParams.push(courseId);
    }
    if (srCols.has("schedule_id")) {
      srSets.push("schedule_id = ?");
      srParams.push(scheduleId);
    }

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
      srParams.push(safeStr(body.training_purpose) || null);
    }

    if (srCols.has("payment_method") && body.payment_method !== undefined) {
      srSets.push("payment_method = ?");
      srParams.push(safeStr(body.payment_method).toUpperCase() || null);
    }

    if (srSets.length) {
      srParams.push(reservationId);
      await pool.execute(
        `UPDATE schedule_reservations SET ${srSets.join(", ")} WHERE reservation_id = ?`,
        srParams,
      );
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
  try {
    if (!reservationId) throw new Error("Invalid reservation_id");

    const [curRows] = await pool.execute(
      `SELECT reservation_id, schedule_id, student_id, course_id FROM schedule_reservations WHERE reservation_id = ? LIMIT 1`,
      [reservationId],
    );
    const cur = curRows?.[0];
    if (!cur) {
      return res.json({
        status: "success",
        message: "Student deleted (already removed)",
      });
    }

    try {
      const spsCols = await getTableColumns("student_payment_submissions");
      const hasKeys =
        spsCols.has("schedule_id") &&
        spsCols.has("student_id") &&
        spsCols.has("course_id");

      if (hasKeys) {
        await pool.execute(
          `DELETE FROM student_payment_submissions WHERE schedule_id = ? AND student_id = ? AND course_id = ?`,
          [cur.schedule_id, cur.student_id, cur.course_id],
        );
      }
    } catch {
      // ignore if table doesn't exist
    }

    await pool.execute(
      `DELETE FROM schedule_reservations WHERE reservation_id = ?`,
      [reservationId],
    );

    return res.json({
      status: "success",
      message: "Student deleted (reservation removed)",
    });
  } catch (err) {
    console.error("deleteStudent error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete student",
      debug: err.sqlMessage || err.message,
    });
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
