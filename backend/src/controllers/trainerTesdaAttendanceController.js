// backend/src/controllers/trainerTesdaAttendanceController.js
const pool = require("../config/database");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const ASSIGN_TABLE = "tesda_course_trainers";

// ------------------------ helpers ------------------------
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
    Math.max(1, parseInt(String(limit ?? "20"), 10) || 20),
  );
  const offset = (p - 1) * l;
  return { page: p, limit: l, offset };
}
function getSessionUserId(req) {
  const v =
    req.user?.user_id ??
    req.user?.id ??
    req.session?.user_id ??
    req.session?.user?.user_id ??
    req.session?.user?.id;

  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
async function resolveTrainerIdFromUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT trainer_id FROM trainers WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  return rows.length ? Number(rows[0].trainer_id) : null;
}
function toYMD(v) {
  if (!v) return null;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
function normalizeAttendanceStatus(s) {
  const v = String(s || "")
    .toLowerCase()
    .trim();
  if (v === "present" || v === "late" || v === "absent" || v === "unmarked")
    return v;
  return "unmarked";
}

// ------------------------ TESDA training date helpers ------------------------
function parseDurationHours(duration) {
  const m = String(duration || "").match(/(\d+(?:\.\d+)?)/);
  const n = m ? Number(m[1]) : 0;
  return Number.isFinite(n) ? n : 0;
}

function tesdaDaysFromDuration(duration) {
  const TESDA_HOURS_PER_DAY = 9;
  const hours = parseDurationHours(duration);

  return hours > 0 ? Math.max(1, Math.ceil(hours / TESDA_HOURS_PER_DAY)) : 1;
}

function addDaysSkipSundays(startYmd, addTrainingDays) {
  const [y, m, d] = String(startYmd).split("-").map(Number);

  let date = new Date(y, m - 1, d);
  let added = 0;

  while (added < addTrainingDays) {
    date.setDate(date.getDate() + 1);

    // Sunday = 0
    if (date.getDay() !== 0) {
      added++;
    }
  }

  const pad = (n) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

function computeTesdaEndDate(startYmd, duration) {
  if (!startYmd) return null;

  const daysNeeded = tesdaDaysFromDuration(duration);

  if (daysNeeded <= 1) {
    return startYmd;
  }

  return addDaysSkipSundays(startYmd, daysNeeded - 1);
}

function isAttendanceDateAllowed(attendanceDate, scheduleDate, duration) {
  if (!attendanceDate || !scheduleDate) return false;

  const selected = String(attendanceDate);
  const start = String(scheduleDate);

  // Attendance is not allowed on Sunday.
  const selectedDate = new Date(`${selected}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime()) || selectedDate.getDay() === 0) {
    return false;
  }

  const end = computeTesdaEndDate(start, duration);
  if (!end) return false;

  return selected >= start && selected <= end;
}

// ------------------------ SHARED: eligible students for selected attendance date ------------------------
async function getEligibleStudentsForDate({
  trainerId,
  date,
  q = "",
  courseId,
}) {
  const where = [
    `cta.trainer_id = ?`,
    `u.role = 'user'`,
    `UPPER(tr.reservation_status) IN ('CONFIRMED', 'APPROVED', 'ACTIVE')`,
    `ts.schedule_date IS NOT NULL`,
    `YEAR(ts.schedule_date) <> 0`,
  ];

  const params = [trainerId];

  if (Number.isFinite(courseId) && courseId > 0) {
    where.push(`ts.course_id = ?`);
    params.push(courseId);
  }

  if (q) {
    const like = `%${safeLike(q)}%`;

    where.push(
      `(u.fullname LIKE ? OR u.email LIKE ? OR CAST(u.id AS CHAR) LIKE ?)`,
    );

    params.push(like, like, like);
  }

  const [rows] = await pool.execute(
    `
    SELECT
      tr.reservation_id,
      tr.student_id,

      u.fullname,
      u.username,
      u.email,

      ts.schedule_id,
      ts.course_id,

      tc.course_name,
      tc.course_code,
      tc.duration,

      DATE_FORMAT(
        ts.schedule_date,
        '%Y-%m-%d'
      ) AS schedule_date,

      tr.created_at,
      tr.updated_at

    FROM tesda_schedule_reservations tr

    JOIN tesda_schedules ts
      ON ts.schedule_id = tr.schedule_id

    JOIN tesda_courses tc
      ON tc.id = ts.course_id

    JOIN ${ASSIGN_TABLE} cta
      ON cta.course_id = ts.course_id

    JOIN users u
      ON u.id = tr.student_id

    WHERE ${where.join(" AND ")}

    ORDER BY
      COALESCE(
        tr.updated_at,
        tr.created_at
      ) DESC,
      tr.reservation_id DESC
    `,
    params,
  );

  const seen = new Set();
  const eligible = [];

  for (const r of rows || []) {
    if (
      !isAttendanceDateAllowed(
        date,
        r.schedule_date,
        r.duration,
      )
    ) {
      continue;
    }

    const scheduleId = Number(r.schedule_id);
    const studentId = Number(r.student_id);

    if (
      !Number.isFinite(scheduleId) ||
      scheduleId <= 0
    ) {
      continue;
    }

    if (
      !Number.isFinite(studentId) ||
      studentId <= 0
    ) {
      continue;
    }

    // Shared attendance identity
    const rowKey =
      `${scheduleId}:${studentId}`;

    if (seen.has(rowKey)) {
      continue;
    }

    seen.add(rowKey);

    eligible.push({
      row_key: rowKey,
      schedule_id: scheduleId,
      student_id: studentId,

      fullname: r.fullname,
      username: r.username,
      email: r.email,

      course_id:
        Number(r.course_id) || null,

      course_name: r.course_name,
      course_code: r.course_code,

      enrollmentDate: r.created_at,

      schedule_date:
        r.schedule_date,

      training_end_date:
        computeTesdaEndDate(
          r.schedule_date,
          r.duration,
        ),
    });
  }

  eligible.sort((a, b) => {
    const nameCompare =
      String(a.fullname || "")
        .localeCompare(
          String(b.fullname || ""),
        );

    if (nameCompare) {
      return nameCompare;
    }

    return (
      Number(a.schedule_id) -
      Number(b.schedule_id)
    );
  });

  return eligible;
}


// ------------------------ eligible lookup ------------------------

function buildEligibleLookup(students) {
  const byKey = new Map();
  const byStudent = new Map();

  for (const s of students || []) {
    const key =
      `${Number(s.schedule_id)}:${Number(s.student_id)}`;

    byKey.set(key, s);

    const studentId =
      Number(s.student_id);

    if (!byStudent.has(studentId)) {
      byStudent.set(
        studentId,
        [],
      );
    }

    byStudent
      .get(studentId)
      .push(s);
  }

  return {
    byKey,
    byStudent,
  };
}


function resolveEligibleRow(
  payloadRow,
  lookup,
) {
  const studentId =
    Number(payloadRow?.student_id);

  if (
    !Number.isFinite(studentId) ||
    studentId <= 0
  ) {
    return null;
  }

  const scheduleId =
    Number(payloadRow?.schedule_id);

  // New frontend
  if (
    Number.isFinite(scheduleId) &&
    scheduleId > 0
  ) {
    return (
      lookup.byKey.get(
        `${scheduleId}:${studentId}`,
      ) || null
    );
  }

  // Temporary backward compatibility
  // habang hindi pa natin napapalitan frontend.
  const candidates =
    lookup.byStudent.get(studentId) || [];

  return candidates.length === 1
    ? candidates[0]
    : null;
}


// ------------------------ current eligible students ------------------------

async function listStudentsSnapshotForTrainer({
  trainerId,
  q,
  courseId,
  date,
}) {
  return getEligibleStudentsForDate({
    trainerId,
    date,
    q,
    courseId,
  });
}


// ------------------------ shared saved attendance ------------------------

async function getAccessibleAttendanceRows({
  trainerId,
  date,
  courseId,
}) {
  const params = [
    trainerId,
    date,
  ];

  let courseFilter = "";

  if (
    Number.isFinite(courseId) &&
    courseId > 0
  ) {
    courseFilter =
      `AND a.course_id = ?`;

    params.push(courseId);
  }

  const [rows] = await pool.execute(
    `
    SELECT
      a.schedule_id,
      a.student_id,
      a.course_id,
      a.course_name,
      a.course_code,

      a.status,
      a.remarks,

      a.trainer_id,
      a.updated_by_trainer_id,

      a.created_at,
      a.updated_at,

      recorded_user.fullname
        AS recorded_by_name,

      updated_user.fullname
        AS updated_by_name

    FROM tesda_trainer_attendance a

    JOIN ${ASSIGN_TABLE} cta
      ON cta.course_id = a.course_id
     AND cta.trainer_id = ?

    LEFT JOIN trainers recorded_trainer
      ON recorded_trainer.trainer_id =
         a.trainer_id

    LEFT JOIN users recorded_user
      ON recorded_user.id =
         recorded_trainer.user_id

    LEFT JOIN trainers updated_trainer
      ON updated_trainer.trainer_id =
         a.updated_by_trainer_id

    LEFT JOIN users updated_user
      ON updated_user.id =
         updated_trainer.user_id

    WHERE a.attendance_date = ?
      ${courseFilter}

    ORDER BY
      a.created_at ASC
    `,
    params,
  );

  return rows || [];
}


// ------------------------ attendance record metadata ------------------------

function buildRecordMeta(rows) {
  if (!rows || !rows.length) {
    return {
      existing: false,

      recorded_by_trainer_id: null,
      recorded_by_name: "",

      last_updated_by_trainer_id: null,
      last_updated_by_name: "",

      created_at: null,
      updated_at: null,
    };
  }

  const recorderIds = [
    ...new Set(
      rows
        .map((r) => Number(r.trainer_id))
        .filter(
          (v) =>
            Number.isFinite(v) &&
            v > 0,
        ),
    ),
  ];

  const recorderNames = [
    ...new Set(
      rows
        .map((r) =>
          safeStr(r.recorded_by_name),
        )
        .filter(Boolean),
    ),
  ];

  const updaterIds = [
    ...new Set(
      rows
        .map((r) =>
          Number(
            r.updated_by_trainer_id,
          ),
        )
        .filter(
          (v) =>
            Number.isFinite(v) &&
            v > 0,
        ),
    ),
  ];

  const updaterNames = [
    ...new Set(
      rows
        .map((r) =>
          safeStr(r.updated_by_name),
        )
        .filter(Boolean),
    ),
  ];

  let createdAt = null;
  let updatedAt = null;

  for (const r of rows) {
    if (
      r.created_at &&
      (
        !createdAt ||
        new Date(r.created_at) <
          new Date(createdAt)
      )
    ) {
      createdAt = r.created_at;
    }

    if (
      r.updated_at &&
      (
        !updatedAt ||
        new Date(r.updated_at) >
          new Date(updatedAt)
      )
    ) {
      updatedAt = r.updated_at;
    }
  }

  return {
    existing: true,

    recorded_by_trainer_id:
      recorderIds.length === 1
        ? recorderIds[0]
        : null,

    recorded_by_name:
      recorderNames.length === 1
        ? recorderNames[0]
        : recorderNames.length > 1
          ? "Multiple trainers"
          : "Trainer",

    last_updated_by_trainer_id:
      updaterIds.length === 1
        ? updaterIds[0]
        : null,

    last_updated_by_name:
      updaterNames.length === 1
        ? updaterNames[0]
        : updaterNames.length > 1
          ? "Multiple trainers"
          : "",

    created_at: createdAt,
    updated_at: updatedAt,
  };
}

/**
 * GET /api/trainer/tesda/attendance?date=YYYY-MM-DD&q=&course_id=
 */
exports.getAttendanceSheet = async (req, res) => {
  try {
    const userId = getSessionUserId(req);

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const trainerId = await resolveTrainerIdFromUserId(userId);

    if (!trainerId) {
      return res.status(403).json({
        status: "error",
        message: "Trainer not mapped.",
      });
    }

    const date = toYMD(req.query.date) || toYMD(new Date());

    const q = safeStr(req.query.q);

    const courseId = Number(req.query.course_id);

    const students = await listStudentsSnapshotForTrainer({
      trainerId,
      q,
      courseId,
      date,
    });

    // Shared attendance records
    const attRows = await getAccessibleAttendanceRows({
      trainerId,
      date,
      courseId,
    });

    const attendanceMap = {};

    for (const student of students) {
      const exact = attRows.find(
        (r) =>
          Number(r.schedule_id) === Number(student.schedule_id) &&
          Number(r.student_id) === Number(student.student_id),
      );

      // Support old attendance rows
      // where schedule_id was still NULL.
      const legacy = exact
        ? null
        : attRows.find(
            (r) =>
              !r.schedule_id &&
              Number(r.student_id) === Number(student.student_id) &&
              Number(r.course_id) === Number(student.course_id),
          );

      const saved = exact || legacy;

      attendanceMap[student.row_key] = {
        status: normalizeAttendanceStatus(saved?.status || "unmarked"),

        remarks: saved?.remarks || "",
      };
    }

    const stats = {
      present: 0,
      late: 0,
      absent: 0,
      unmarked: 0,
    };

    for (const student of students) {
      const row = attendanceMap[student.row_key] || {
        status: "unmarked",
      };

      const status = normalizeAttendanceStatus(row.status);

      stats[status] = (stats[status] || 0) + 1;
    }

    const recordMeta = buildRecordMeta(attRows);

    return res.json({
      status: "success",

      data: {
        date,
        students,
        attendanceMap,
        stats,

        // Frontend will use this
        // for read-only/edit confirmation.
        recordMeta,
      },
    });
  } catch (err) {
    console.error("getAttendanceSheet error:", err);

    return res.status(500).json({
      status: "error",
      message: "Failed to load attendance sheet",
      debug: err.sqlMessage || err.message,
    });
  }
};

/**
 * POST /api/trainer/tesda/attendance
 * Body: { date, rows: [{student_id,status,remarks,course_id,course_name,course_code}] }
 */
exports.saveAttendance = async (req, res) => {
  let conn = null;

  try {
    const userId = getSessionUserId(req);

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const trainerId = await resolveTrainerIdFromUserId(userId);

    if (!trainerId) {
      return res.status(403).json({
        status: "error",
        message: "Trainer not mapped.",
      });
    }

    const date = toYMD(req.body?.date) || toYMD(new Date());

    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];

    // False on normal save.
    // True only after user clicks
    // "Edit Attendance".
    const allowEdit = req.body?.allow_edit === true;

    if (!rows.length) {
      return res.status(400).json({
        status: "error",
        message: "rows is required",
      });
    }

    // Server decides which students/schedules
    // this trainer is really allowed to access.
    const eligibleStudents = await getEligibleStudentsForDate({
      trainerId,
      date,
    });

    const lookup = buildEligibleLookup(eligibleStudents);

    const cleaned = rows
      .map((r) => {
        const eligible = resolveEligibleRow(r, lookup);

        if (!eligible) {
          return null;
        }

        return {
          schedule_id: Number(eligible.schedule_id),

          student_id: Number(eligible.student_id),

          course_id: Number(eligible.course_id),

          course_name: safeStr(eligible.course_name).slice(0, 255) || null,

          course_code: safeStr(eligible.course_code).slice(0, 100) || null,

          status: normalizeAttendanceStatus(r.status),

          remarks: safeStr(r.remarks).slice(0, 255) || null,
        };
      })
      .filter(Boolean);

    if (!cleaned.length) {
      return res.status(403).json({
        status: "error",

        message:
          "No valid rows to save. Student must be active, the trainer must be assigned to the course, and the date must be within the TESDA training period.",
      });
    }

    // Check shared attendance,
    // regardless of which assigned trainer
    // originally recorded it.
    const existingRows = await getAccessibleAttendanceRows({
      trainerId,
      date,
    });

    const hasExisting = cleaned.some((r) =>
      existingRows.some((old) => {
        const exact =
          Number(old.schedule_id) === r.schedule_id &&
          Number(old.student_id) === r.student_id;

        const legacy =
          !old.schedule_id &&
          Number(old.student_id) === r.student_id &&
          Number(old.course_id) === r.course_id;

        return exact || legacy;
      }),
    );

    // This is what frontend will use
    // for:
    //
    // [Cancel] [Edit Attendance]
    if (hasExisting && !allowEdit) {
      return res.status(409).json({
        status: "error",

        code: "ATTENDANCE_EXISTS",

        message: "Attendance for this date has already been recorded.",

        data: {
          date,

          recordMeta: buildRecordMeta(existingRows),
        },
      });
    }

    conn = await pool.getConnection();

    await conn.beginTransaction();

    let inserted = 0;
    let updated = 0;

    for (const r of cleaned) {
      // Check exact shared attendance record.
      const [exactRows] = await conn.execute(
        `
          SELECT 1
          FROM tesda_trainer_attendance

          WHERE schedule_id = ?
            AND student_id = ?
            AND attendance_date = ?

          LIMIT 1
          `,
        [r.schedule_id, r.student_id, date],
      );

      if (exactRows.length) {
        // IMPORTANT:
        // trainer_id is NOT changed here.
        //
        // trainer_id remains:
        // "Recorded by"
        //
        // updated_by_trainer_id becomes:
        // "Last updated by"
        await conn.execute(
          `
          UPDATE tesda_trainer_attendance

          SET
            course_id = ?,
            course_name = ?,
            course_code = ?,

            status = ?,
            remarks = ?,

            updated_by_trainer_id = ?,
            updated_at = CURRENT_TIMESTAMP

          WHERE schedule_id = ?
            AND student_id = ?
            AND attendance_date = ?
          `,
          [
            r.course_id,
            r.course_name,
            r.course_code,

            r.status,
            r.remarks,

            trainerId,

            r.schedule_id,
            r.student_id,
            date,
          ],
        );

        updated++;
        continue;
      }

      // Compatibility with OLD attendance
      // records where schedule_id = NULL.
      const [legacyUpdate] = await conn.execute(
        `
          UPDATE tesda_trainer_attendance

          SET
            schedule_id = ?,
            course_name = ?,
            course_code = ?,

            status = ?,
            remarks = ?,

            updated_by_trainer_id = ?,
            updated_at = CURRENT_TIMESTAMP

          WHERE schedule_id IS NULL
            AND student_id = ?
            AND course_id = ?
            AND attendance_date = ?

          LIMIT 1
          `,
        [
          r.schedule_id,
          r.course_name,
          r.course_code,

          r.status,
          r.remarks,

          trainerId,

          r.student_id,
          r.course_id,
          date,
        ],
      );

      if (legacyUpdate.affectedRows > 0) {
        updated++;
        continue;
      }

      // Brand-new shared attendance.
      await conn.execute(
        `
        INSERT INTO tesda_trainer_attendance
        (
          trainer_id,
          updated_by_trainer_id,

          student_id,
          course_id,
          schedule_id,

          course_name,
          course_code,

          attendance_date,
          status,
          remarks
        )

        VALUES
        (
          ?,
          NULL,

          ?,
          ?,
          ?,

          ?,
          ?,

          ?,
          ?,
          ?
        )
        `,
        [
          // Original recorder
          trainerId,

          r.student_id,
          r.course_id,
          r.schedule_id,

          r.course_name,
          r.course_code,

          date,
          r.status,
          r.remarks,
        ],
      );

      inserted++;
    }

    await conn.commit();

    const afterRows = await getAccessibleAttendanceRows({
      trainerId,
      date,
    });

    return res.json({
      status: "success",

      message: updated > 0 ? "Attendance updated" : "Attendance saved",

      data: {
        date,

        saved: cleaned.length,

        inserted,
        updated,

        recordMeta: buildRecordMeta(afterRows),
      },
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch {}
    }

    console.error("saveAttendance error:", err);

    return res.status(500).json({
      status: "error",
      message: "Failed to save attendance",

      debug: err.sqlMessage || err.message,
    });
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

/**
 * GET /api/trainer/tesda/attendance/history?page=&limit=&q=
 * ✅ returns YYYY-MM-DD string (no timezone)
 */
exports.listAttendanceHistory = async (req, res) => {
  try {
    const userId = getSessionUserId(req);

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const trainerId = await resolveTrainerIdFromUserId(userId);

    if (!trainerId) {
      return res.status(403).json({
        status: "error",
        message: "Trainer not mapped.",
      });
    }

    const q = safeStr(req.query.q);

    const { page, limit, offset } = clampLimitOffset(
      req.query.page,
      req.query.limit,
    );

    const where = [`cta.trainer_id = ?`];

    const params = [trainerId];

    if (q) {
      where.push(
        `DATE_FORMAT(
          a.attendance_date,
          '%Y-%m-%d'
        ) LIKE ?`,
      );

      params.push(`%${safeLike(q)}%`);
    }

    // Count shared attendance dates
    const [countRows] = await pool.execute(
      `
        SELECT
          COUNT(
            DISTINCT a.attendance_date
          ) AS total

        FROM tesda_trainer_attendance a

        JOIN ${ASSIGN_TABLE} cta
          ON cta.course_id =
             a.course_id

        WHERE ${where.join(" AND ")}
        `,
      params,
    );

    const total = Number(countRows?.[0]?.total || 0);

    // Shared attendance history
    const [rows] = await pool.execute(
      `
        SELECT
          DATE_FORMAT(
            a.attendance_date,
            '%Y-%m-%d'
          ) AS attendance_date,

          SUM(
            a.status = 'present'
          ) AS present,

          SUM(
            a.status = 'late'
          ) AS late,

          SUM(
            a.status = 'absent'
          ) AS absent,

          SUM(
            a.status = 'unmarked'
          ) AS unmarked,

          COUNT(*) AS total_rows,

          COUNT(
            DISTINCT a.course_id
          ) AS courses_count,

          COUNT(
            DISTINCT a.schedule_id
          ) AS schedules_count

        FROM tesda_trainer_attendance a

        JOIN ${ASSIGN_TABLE} cta
          ON cta.course_id =
             a.course_id

        WHERE ${where.join(" AND ")}

        GROUP BY
          a.attendance_date

        ORDER BY
          a.attendance_date DESC

        LIMIT ${limit}
        OFFSET ${offset}
        `,
      params,
    );

    return res.json({
      status: "success",

      data: rows || [],

      meta: {
        page,
        limit,
        total,

        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("listAttendanceHistory error:", err);

    return res.status(500).json({
      status: "error",

      message: "Failed to load attendance history",

      debug: err.sqlMessage || err.message,
    });
  }
};

/**
 * GET /api/trainer/tesda/attendance/history/:date
 * ✅ expects date = YYYY-MM-DD
 */
exports.getAttendanceByDate = async (req, res) => {
  try {
    const userId = getSessionUserId(req);

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const trainerId = await resolveTrainerIdFromUserId(userId);

    if (!trainerId) {
      return res.status(403).json({
        status: "error",
        message: "Trainer not mapped.",
      });
    }

    const date = toYMD(req.params.date);

    if (!date) {
      return res.status(400).json({
        status: "error",
        message: "Invalid date",
      });
    }

    const [rows] = await pool.execute(
      `
        SELECT
          a.attendance_id,

          a.schedule_id,
          a.student_id,
          a.course_id,

          u.fullname,
          u.username,
          u.email,

          a.course_name,
          a.course_code,

          a.status,
          a.remarks,

          a.trainer_id
            AS recorded_by_trainer_id,

          a.updated_by_trainer_id,

          recorded_user.fullname
            AS recorded_by_name,

          updated_user.fullname
            AS updated_by_name,

          a.created_at,
          a.updated_at

        FROM tesda_trainer_attendance a

        JOIN ${ASSIGN_TABLE} cta
          ON cta.course_id =
             a.course_id
         AND cta.trainer_id = ?

        JOIN users u
          ON u.id =
             a.student_id

        LEFT JOIN trainers recorded_trainer
          ON recorded_trainer.trainer_id =
             a.trainer_id

        LEFT JOIN users recorded_user
          ON recorded_user.id =
             recorded_trainer.user_id

        LEFT JOIN trainers updated_trainer
          ON updated_trainer.trainer_id =
             a.updated_by_trainer_id

        LEFT JOIN users updated_user
          ON updated_user.id =
             updated_trainer.user_id

        WHERE a.attendance_date = ?

        ORDER BY
          a.course_name ASC,
          u.fullname ASC
        `,
      [trainerId, date],
    );

    const recordMeta = buildRecordMeta(rows);

    return res.json({
      status: "success",

      date,

      data: rows || [],

      recordMeta,
    });
  } catch (err) {
    console.error("getAttendanceByDate error:", err);

    return res.status(500).json({
      status: "error",

      message: "Failed to load attendance date",

      debug: err.sqlMessage || err.message,
    });
  }
};

// ------------------------ EXPORT: Excel ------------------------
exports.exportAttendanceExcel = async (req, res) => {
  try {
    const userId = getSessionUserId(req);

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const trainerId = await resolveTrainerIdFromUserId(userId);

    if (!trainerId) {
      return res.status(403).json({
        status: "error",
        message: "Trainer not mapped.",
      });
    }

    const date = toYMD(req.query.date) || toYMD(new Date());

    const [rows] = await pool.execute(
      `
      SELECT
        u.fullname,
        u.username,
        u.email,

        a.course_name,
        a.course_code,

        a.status,
        a.remarks,

        DATE_FORMAT(
          a.attendance_date,
          '%Y-%m-%d'
        ) AS attendance_date,

        recorded_user.fullname
          AS recorded_by,

        updated_user.fullname
          AS last_updated_by

      FROM tesda_trainer_attendance a

      JOIN ${ASSIGN_TABLE} cta
        ON cta.course_id = a.course_id
       AND cta.trainer_id = ?

      JOIN users u
        ON u.id = a.student_id

      LEFT JOIN trainers recorded_trainer
        ON recorded_trainer.trainer_id =
           a.trainer_id

      LEFT JOIN users recorded_user
        ON recorded_user.id =
           recorded_trainer.user_id

      LEFT JOIN trainers updated_trainer
        ON updated_trainer.trainer_id =
           a.updated_by_trainer_id

      LEFT JOIN users updated_user
        ON updated_user.id =
           updated_trainer.user_id

      WHERE a.attendance_date = ?

      ORDER BY
        a.course_name ASC,
        u.fullname ASC
      `,
      [trainerId, date],
    );

    const wb = new ExcelJS.Workbook();

    const ws = wb.addWorksheet("Attendance");

    ws.columns = [
      {
        header: "Date",
        key: "attendance_date",
        width: 14,
      },
      {
        header: "Student Name",
        key: "fullname",
        width: 28,
      },
      {
        header: "Username",
        key: "username",
        width: 16,
      },
      {
        header: "Email",
        key: "email",
        width: 26,
      },
      {
        header: "Course",
        key: "course_name",
        width: 28,
      },
      {
        header: "Code",
        key: "course_code",
        width: 14,
      },
      {
        header: "Status",
        key: "status",
        width: 12,
      },
      {
        header: "Remarks",
        key: "remarks",
        width: 30,
      },
      {
        header: "Recorded By",
        key: "recorded_by",
        width: 22,
      },
      {
        header: "Last Updated By",
        key: "last_updated_by",
        width: 22,
      },
    ];

    ws.getRow(1).font = {
      bold: true,
    };

    for (const r of rows || []) {
      ws.addRow({
        ...r,

        recorded_by: r.recorded_by || "Trainer",

        last_updated_by: r.last_updated_by || r.recorded_by || "Trainer",
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance_${date}.xlsx"`,
    );

    await wb.xlsx.write(res);

    res.end();
  } catch (err) {
    console.error("exportAttendanceExcel error:", err);

    return res.status(500).json({
      status: "error",
      message: "Failed to export excel",
    });
  }
};

// ------------------------ EXPORT: PDF ------------------------
exports.exportAttendancePdf = async (req, res) => {
  try {
    const userId = getSessionUserId(req);

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const trainerId = await resolveTrainerIdFromUserId(userId);

    if (!trainerId) {
      return res.status(403).json({
        status: "error",
        message: "Trainer not mapped.",
      });
    }

    const date = toYMD(req.query.date) || toYMD(new Date());

    const [rows] = await pool.execute(
      `
        SELECT
          u.fullname,
          u.username,
          u.email,

          a.course_name,
          a.course_code,

          a.status,
          a.remarks,

          DATE_FORMAT(
            a.attendance_date,
            '%Y-%m-%d'
          ) AS attendance_date,

          recorded_user.fullname
            AS recorded_by,

          updated_user.fullname
            AS last_updated_by

        FROM tesda_trainer_attendance a

        JOIN ${ASSIGN_TABLE} cta
          ON cta.course_id =
             a.course_id
         AND cta.trainer_id = ?

        JOIN users u
          ON u.id =
             a.student_id

        LEFT JOIN trainers recorded_trainer
          ON recorded_trainer.trainer_id =
             a.trainer_id

        LEFT JOIN users recorded_user
          ON recorded_user.id =
             recorded_trainer.user_id

        LEFT JOIN trainers updated_trainer
          ON updated_trainer.trainer_id =
             a.updated_by_trainer_id

        LEFT JOIN users updated_user
          ON updated_user.id =
             updated_trainer.user_id

        WHERE a.attendance_date = ?

        ORDER BY
          a.course_name ASC,
          u.fullname ASC
        `,
      [trainerId, date],
    );

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance_${date}.pdf"`,
    );

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
    });

    doc.pipe(res);

    doc.fontSize(16).text("TESDA Attendance", {
      align: "left",
    });

    doc.moveDown(0.3);

    doc.fontSize(11).fillColor("#374151").text(`Date: ${date}`);

    if (rows.length) {
      const recordedBy = rows[0].recorded_by || "Trainer";

      const updatedBy = rows
        .map((r) => r.last_updated_by)
        .filter(Boolean)
        .pop();

      doc.text(`Recorded by: ${recordedBy}`);

      if (updatedBy) {
        doc.text(`Last updated by: ${updatedBy}`);
      }
    }

    doc.moveDown(1);

    doc.fillColor("#111827").fontSize(10);

    const startX = 40;
    let y = doc.y;

    const col = {
      name: startX,
      course: startX + 170,
      status: startX + 360,
      remarks: startX + 430,
    };

    doc.text("Student", col.name, y);

    doc.text("Course", col.course, y);

    doc.text("Status", col.status, y);

    doc.text("Remarks", col.remarks, y);

    y += 14;

    doc.moveTo(startX, y).lineTo(555, y).stroke();

    y += 8;

    for (const r of rows || []) {
      if (y > 770) {
        doc.addPage();
        y = 60;
      }

      doc.fontSize(9).fillColor("#111827");

      doc.text(r.fullname || "—", col.name, y, {
        width: 160,
      });

      doc.text(r.course_name || "—", col.course, y, {
        width: 180,
      });

      doc.text(String(r.status || "unmarked"), col.status, y, {
        width: 60,
      });

      doc.text(r.remarks || "", col.remarks, y, {
        width: 120,
      });

      y += 16;
    }

    doc.end();
  } catch (err) {
    console.error("exportAttendancePdf error:", err);

    return res.status(500).json({
      status: "error",
      message: "Failed to export pdf",
    });
  }
};
