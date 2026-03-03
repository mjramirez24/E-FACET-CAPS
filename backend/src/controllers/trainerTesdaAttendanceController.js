// backend/src/controllers/trainerTesdaAttendanceController.js
const pool = require("../config/database");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

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

// ------------------------ INTERNAL: allowed student ids for this trainer ------------------------
async function getAllowedStudentIds(trainerId) {
  const [rows] = await pool.execute(
    `
    SELECT DISTINCT tr.student_id
    FROM tesda_schedule_reservations tr
    JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
    JOIN users u ON u.id = tr.student_id
    WHERE ts.trainer_id = ?
      AND u.role = 'user'
    `,
    [trainerId],
  );
  return new Set((rows || []).map((r) => Number(r.student_id)));
}

// ------------------------ INTERNAL: student snapshot list ------------------------
async function listStudentsSnapshotForTrainer({ trainerId, q, courseId }) {
  const where = [`ts.trainer_id = ?`];
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

  // ROW_NUMBER => MySQL 8+
  const [rows] = await pool.execute(
    `
    SELECT
      b.student_id,
      MAX(b.fullname) AS fullname,
      MAX(b.username) AS username,
      MAX(b.email) AS email,

      MAX(CASE WHEN b.rn = 1 THEN b.course_id END) AS course_id,
      MAX(CASE WHEN b.rn = 1 THEN b.course_name END) AS course_name,
      MAX(CASE WHEN b.rn = 1 THEN b.course_code END) AS course_code,

      MAX(CASE WHEN b.rn = 1 THEN b.created_at END) AS enrollmentDate
    FROM (
      SELECT
        tr.reservation_id,
        tr.student_id,
        u.fullname,
        u.username,
        u.email,
        ts.course_id,
        tc.course_name,
        tc.course_code,
        tr.created_at,
        ROW_NUMBER() OVER (
          PARTITION BY tr.student_id
          ORDER BY COALESCE(tr.updated_at, tr.created_at) DESC, tr.reservation_id DESC
        ) AS rn
      FROM tesda_schedule_reservations tr
      JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
      JOIN tesda_courses tc ON tc.id = ts.course_id
      JOIN users u ON u.id = tr.student_id
      WHERE ${where.join(" AND ")}
    ) b
    GROUP BY b.student_id
    ORDER BY fullname ASC
    `,
    params,
  );

  return rows || [];
}

/**
 * GET /api/trainer/tesda/attendance?date=YYYY-MM-DD&q=&course_id=
 */
exports.getAttendanceSheet = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const trainerId = await resolveTrainerIdFromUserId(userId);
    if (!trainerId)
      return res
        .status(403)
        .json({ status: "error", message: "Trainer not mapped." });

    const date = toYMD(req.query.date) || toYMD(new Date());
    const q = safeStr(req.query.q);
    const courseId = Number(req.query.course_id);

    const students = await listStudentsSnapshotForTrainer({
      trainerId,
      q,
      courseId,
    });

    const [attRows] = await pool.execute(
      `
      SELECT student_id, status, remarks
      FROM tesda_trainer_attendance
      WHERE trainer_id = ?
        AND attendance_date = ?
      `,
      [trainerId, date],
    );

    const attendanceMap = {};
    for (const r of attRows || []) {
      attendanceMap[String(r.student_id)] = {
        status: normalizeAttendanceStatus(r.status),
        remarks: r.remarks || "",
      };
    }

    const stats = { present: 0, late: 0, absent: 0, unmarked: 0 };
    for (const s of students) {
      const row = attendanceMap[String(s.student_id)] || { status: "unmarked" };
      const st = normalizeAttendanceStatus(row.status);
      stats[st] = (stats[st] || 0) + 1;
    }

    return res.json({
      status: "success",
      data: { date, students, attendanceMap, stats },
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
  try {
    const userId = getSessionUserId(req);
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const trainerId = await resolveTrainerIdFromUserId(userId);
    if (!trainerId)
      return res
        .status(403)
        .json({ status: "error", message: "Trainer not mapped." });

    const date = toYMD(req.body?.date) || toYMD(new Date());
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];

    if (!rows.length) {
      return res
        .status(400)
        .json({ status: "error", message: "rows is required" });
    }

    const allowedIds = await getAllowedStudentIds(trainerId);

    const cleaned = rows
      .map((r) => {
        const sid = Number(r.student_id);
        if (!Number.isFinite(sid) || sid <= 0) return null;
        if (!allowedIds.has(sid)) return null;

        return {
          student_id: sid,
          status: normalizeAttendanceStatus(r.status),
          remarks: safeStr(r.remarks).slice(0, 255) || null,
          course_id: Number.isFinite(Number(r.course_id))
            ? Number(r.course_id)
            : null,
          course_name: safeStr(r.course_name).slice(0, 255) || null,
          course_code: safeStr(r.course_code).slice(0, 100) || null,
        };
      })
      .filter(Boolean);

    if (!cleaned.length) {
      return res.status(403).json({
        status: "error",
        message:
          "No valid rows to save (students must belong to this trainer).",
      });
    }

    let saved = 0;

    for (const r of cleaned) {
      // ✅ works ONLY if unique key exists on (trainer_id, student_id, attendance_date)
      await pool.execute(
        `
        INSERT INTO tesda_trainer_attendance
          (trainer_id, student_id, course_id, course_name, course_code, attendance_date, status, remarks)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          course_id = VALUES(course_id),
          course_name = VALUES(course_name),
          course_code = VALUES(course_code),
          status = VALUES(status),
          remarks = VALUES(remarks),
          updated_at = CURRENT_TIMESTAMP
        `,
        [
          trainerId,
          r.student_id,
          r.course_id,
          r.course_name,
          r.course_code,
          date,
          r.status,
          r.remarks,
        ],
      );
      saved += 1;
    }

    return res.json({
      status: "success",
      message: "Attendance saved",
      data: { date, saved },
    });
  } catch (err) {
    console.error("saveAttendance error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to save attendance",
      debug: err.sqlMessage || err.message,
    });
  }
};

/**
 * GET /api/trainer/tesda/attendance/history?page=&limit=&q=
 * ✅ returns YYYY-MM-DD string (no timezone)
 */
exports.listAttendanceHistory = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const trainerId = await resolveTrainerIdFromUserId(userId);
    if (!trainerId)
      return res
        .status(403)
        .json({ status: "error", message: "Trainer not mapped." });

    const q = safeStr(req.query.q);
    const { page, limit, offset } = clampLimitOffset(
      req.query.page,
      req.query.limit,
    );

    const where = [`trainer_id = ?`];
    const params = [trainerId];

    if (q) {
      where.push(`DATE_FORMAT(attendance_date, '%Y-%m-%d') LIKE ?`);
      params.push(`%${safeLike(q)}%`);
    }

    const [countRows] = await pool.execute(
      `
      SELECT COUNT(DISTINCT attendance_date) AS total
      FROM tesda_trainer_attendance
      WHERE ${where.join(" AND ")}
      `,
      params,
    );
    const total = Number(countRows?.[0]?.total || 0);

    const [rows] = await pool.execute(
      `
      SELECT
        DATE_FORMAT(attendance_date, '%Y-%m-%d') AS attendance_date,
        SUM(status='present') AS present,
        SUM(status='late') AS late,
        SUM(status='absent') AS absent,
        SUM(status='unmarked') AS unmarked,
        COUNT(*) AS total_rows
      FROM tesda_trainer_attendance
      WHERE ${where.join(" AND ")}
      GROUP BY attendance_date
      ORDER BY attendance_date DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      params,
    );

    return res.json({
      status: "success",
      data: rows || [],
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
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
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const trainerId = await resolveTrainerIdFromUserId(userId);
    if (!trainerId)
      return res
        .status(403)
        .json({ status: "error", message: "Trainer not mapped." });

    const date = toYMD(req.params.date);
    if (!date)
      return res.status(400).json({ status: "error", message: "Invalid date" });

    const [rows] = await pool.execute(
      `
      SELECT
        a.student_id,
        u.fullname,
        u.username,
        u.email,
        a.course_name,
        a.course_code,
        a.status,
        a.remarks,
        a.updated_at
      FROM tesda_trainer_attendance a
      JOIN users u ON u.id = a.student_id
      WHERE a.trainer_id = ?
        AND a.attendance_date = ?
      ORDER BY u.fullname ASC
      `,
      [trainerId, date],
    );

    return res.json({ status: "success", date, data: rows || [] });
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
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const trainerId = await resolveTrainerIdFromUserId(userId);
    if (!trainerId)
      return res
        .status(403)
        .json({ status: "error", message: "Trainer not mapped." });

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
        DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date
      FROM tesda_trainer_attendance a
      JOIN users u ON u.id = a.student_id
      WHERE a.trainer_id = ?
        AND a.attendance_date = ?
      ORDER BY u.fullname ASC
      `,
      [trainerId, date],
    );

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Attendance");

    ws.columns = [
      { header: "Date", key: "attendance_date", width: 14 },
      { header: "Student Name", key: "fullname", width: 28 },
      { header: "Username", key: "username", width: 16 },
      { header: "Email", key: "email", width: 26 },
      { header: "Course", key: "course_name", width: 28 },
      { header: "Code", key: "course_code", width: 14 },
      { header: "Status", key: "status", width: 12 },
      { header: "Remarks", key: "remarks", width: 30 },
    ];

    ws.getRow(1).font = { bold: true };

    for (const r of rows || []) ws.addRow(r);

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
    return res
      .status(500)
      .json({ status: "error", message: "Failed to export excel" });
  }
};

// ------------------------ EXPORT: PDF ------------------------
exports.exportAttendancePdf = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const trainerId = await resolveTrainerIdFromUserId(userId);
    if (!trainerId)
      return res
        .status(403)
        .json({ status: "error", message: "Trainer not mapped." });

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
        DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date
      FROM tesda_trainer_attendance a
      JOIN users u ON u.id = a.student_id
      WHERE a.trainer_id = ?
        AND a.attendance_date = ?
      ORDER BY u.fullname ASC
      `,
      [trainerId, date],
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance_${date}.pdf"`,
    );

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    doc.fontSize(16).text("Trainer Attendance", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#374151").text(`Date: ${date}`);
    doc.moveDown(1);

    // Table headers
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
      doc.text(r.fullname || "—", col.name, y, { width: 160 });
      doc.text(r.course_name || "—", col.course, y, { width: 180 });
      doc.text(String(r.status || "unmarked"), col.status, y, { width: 60 });
      doc.text(r.remarks || "", col.remarks, y, { width: 120 });

      y += 16;
    }

    doc.end();
  } catch (err) {
    console.error("exportAttendancePdf error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to export pdf" });
  }
};
