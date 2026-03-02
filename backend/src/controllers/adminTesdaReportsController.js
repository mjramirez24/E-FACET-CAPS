// backend/src/controllers/adminTesdaReportsController.js
const pool = require("../config/database.js");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// ------------------------
// helpers
// ------------------------
function toISODate(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
}

function getDateRange(req) {
  const from = toISODate(req.query.from);
  const to = toISODate(req.query.to);

  // fallback: this month
  if (!from || !to) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const a = new Date(y, m, 1);
    const b = new Date(y, m + 1, 1);
    return { from: toISODate(a), to: toISODate(b) };
  }

  // make "to" exclusive (+1 day)
  const toPlus = new Date(to);
  toPlus.setDate(toPlus.getDate() + 1);
  return { from, to: toISODate(toPlus) };
}

function safeInt(v, fallback = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function safeStr(v) {
  return String(v ?? "").trim();
}

function safeLike(v) {
  return String(v ?? "")
    .trim()
    .replace(/[%_]/g, (m) => "\\" + m);
}

function clampLimitOffset(page, limit) {
  const p = Math.max(1, safeInt(page, 1));
  const l = Math.min(200, Math.max(1, safeInt(limit, 20)));
  const offset = (p - 1) * l;
  return { page: p, limit: l, offset };
}

// TESDA done logic (no done_at column)
function isTesdaDoneConditionSql() {
  return `UPPER(tsr.reservation_status) IN ('DONE','COMPLETED','FINISHED')`;
}

// ------------------------
// EXPORT helpers
// ------------------------
function getExportFormat(req) {
  const f = safeStr(req.query.format).toLowerCase();
  if (f === "xlsx" || f === "csv" || f === "pdf") return f;
  return "xlsx";
}

function makeFileName(base, format) {
  const ts = new Date().toISOString().slice(0, 10);
  return `${base}-${ts}.${format}`;
}

function setDownloadHeaders(res, contentType, filename) {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
}

async function exportAsXlsx(res, sheetName, columns, rows, baseName) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);

  ws.columns = columns;
  ws.addRows(rows);

  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  setDownloadHeaders(
    res,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    makeFileName(baseName, "xlsx"),
  );

  await wb.xlsx.write(res);
  res.end();
}

function exportAsCsv(res, columns, rows, baseName) {
  const headers = columns.map((c) => c.header);
  const keys = columns.map((c) => c.key);

  const esc = (val) => {
    const s = String(val ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [];
  lines.push(headers.map(esc).join(","));
  for (const r of rows) lines.push(keys.map((k) => esc(r[k])).join(","));

  setDownloadHeaders(
    res,
    "text/csv; charset=utf-8",
    makeFileName(baseName, "csv"),
  );
  res.send(lines.join("\n"));
}

function exportAsPdfSimple(res, title, columns, rows, baseName) {
  setDownloadHeaders(res, "application/pdf", makeFileName(baseName, "pdf"));

  const doc = new PDFDocument({ size: "A4", margin: 36 });
  doc.pipe(res);

  doc.fontSize(14).text(title);
  doc.moveDown(0.75);

  doc.fontSize(9).text(columns.map((c) => c.header).join(" | "));
  doc.moveDown(0.25);
  doc.text("-".repeat(110));
  doc.moveDown(0.25);

  const keys = columns.map((c) => c.key);
  doc.fontSize(9);

  for (const r of rows) {
    const line = keys.map((k) => String(r[k] ?? "")).join(" | ");
    doc.text(line);
  }

  doc.end();
}

// ------------------------
// CONTROLLERS (TESDA)
// ------------------------

// GET /api/admin/tesda-reports/detailed?from&to&course_id&trainer_id&gender&status&page&limit&q
exports.getDetailed = async (req, res) => {
  try {
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const trainerId = safeStr(req.query.trainer_id);
    const gender = safeStr(req.query.gender).toLowerCase();
    const status = safeStr(req.query.status).toLowerCase(); // done / pending
    const q = safeStr(req.query.q);

    const source = safeStr(req.query.source).toUpperCase(); // ONLINE/WALKIN

    const { page, limit, offset } = clampLimitOffset(
      req.query.page,
      req.query.limit,
    );

    // use tsr.created_at for filtering (pwede mo palitan to ts.schedule_date if gusto mo by schedule date)
    let where = `WHERE tsr.created_at >= ? AND tsr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND ts.course_id = ?`;
      params.push(courseId);
    }

    if (trainerId) {
      where += ` AND ts.trainer_id = ?`;
      params.push(trainerId);
    }

    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }

    if (status === "done") where += ` AND ${isTesdaDoneConditionSql()}`;
    else if (status === "pending")
      where += ` AND NOT ${isTesdaDoneConditionSql()}`;

    if (source === "ONLINE" || source === "WALKIN") {
      where += ` AND UPPER(tsr.reservation_source) = ?`;
      params.push(source);
    }

    if (q) {
      const like = `%${safeLike(q)}%`;
      where += `
        AND (
          u.fullname LIKE ? OR
          CAST(tsr.student_id AS CHAR) LIKE ? OR
          tc.course_name LIKE ? OR
          tc.course_code LIKE ? OR
          CAST(tsr.schedule_id AS CHAR) LIKE ?
        )
      `;
      params.push(like, like, like, like, like);
    }

    const [countRows] = await pool.execute(
      `
      SELECT COUNT(*) AS total
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      LEFT JOIN trainers tr ON tr.trainer_id = ts.trainer_id
      ${where}
      `,
      params,
    );

    const total = safeInt(countRows?.[0]?.total, 0);

    const sql = `
      SELECT
        tsr.reservation_id,
        tsr.schedule_id,
        tsr.student_id,
        tsr.reservation_source,
        tsr.reservation_status,
        tsr.notes,
        tsr.created_at,
        tsr.updated_at,
        tsr.batch_id,

        u.fullname,
        u.gender,
        u.birthday,

        ts.course_id,
        ts.trainer_id,
        ts.schedule_date,
        ts.schedule_date AS course_start,
        ts.schedule_date AS course_end,
        ts.start_time,
        ts.end_time,
        ts.total_slots,
        ts.status AS schedule_status,

        tc.course_code,
        tc.course_name,
        tc.duration,
        tc.course_fee,

        CONCAT_WS(' ', tr.firstname, tr.lastname) AS trainer_name,

        CASE WHEN ${isTesdaDoneConditionSql()} THEN 'DONE' ELSE 'PENDING' END AS derived_status

      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      LEFT JOIN trainers tr ON tr.trainer_id = ts.trainer_id
      ${where}
      ORDER BY tsr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await pool.execute(sql, params);

    return res.json({
      status: "success",
      data: rows,
      meta: {
        from,
        to,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("TESDA getDetailed error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load TESDA detailed report",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/tesda-reports/summary?from&to&course_id&trainer_id&gender
exports.getSummary = async (req, res) => {
  try {
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const trainerId = safeStr(req.query.trainer_id);
    const gender = safeStr(req.query.gender).toLowerCase();

    let where = `WHERE tsr.created_at >= ? AND tsr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND ts.course_id = ?`;
      params.push(courseId);
    }
    if (trainerId) {
      where += ` AND ts.trainer_id = ?`;
      params.push(trainerId);
    }
    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }

    const [[{ totalEnrolled }]] = await pool.execute(
      `
      SELECT COUNT(*) AS totalEnrolled
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      ${where}
      `,
      params,
    );

    const [[{ doneCount }]] = await pool.execute(
      `
      SELECT COUNT(*) AS doneCount
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      ${where} AND ${isTesdaDoneConditionSql()}
      `,
      params,
    );

    const [popularRows] = await pool.execute(
      `
      SELECT tc.course_name AS name, COUNT(*) AS cnt
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      ${where}
      GROUP BY ts.course_id
      ORDER BY cnt DESC
      LIMIT 1
      `,
      params,
    );

    const mostPopularCourse = popularRows.length ? popularRows[0].name : "";

    // Simple revenue estimate: sum course_fee for DONE (since no payments table)
    const [revRows] = await pool.execute(
      `
      SELECT
        COALESCE(SUM(COALESCE(tc.course_fee, 0)), 0) AS totalRevenuePeso
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      ${where} AND ${isTesdaDoneConditionSql()}
      `,
      params,
    );

    const totalRevenuePeso = Number(revRows?.[0]?.totalRevenuePeso || 0);
    const completionRate =
      totalEnrolled > 0
        ? Math.round((safeInt(doneCount, 0) / safeInt(totalEnrolled, 1)) * 100)
        : 0;

    return res.json({
      status: "success",
      data: {
        from,
        to,
        totalEnrolled: safeInt(totalEnrolled, 0),
        mostPopularCourse,
        doneCount: safeInt(doneCount, 0),
        completionRate, // %
        certIssued: 0, // (placeholder)
        totalRevenuePeso,
      },
    });
  } catch (err) {
    console.error("TESDA getSummary error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load TESDA summary report",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/tesda-reports/trend?from&to&period=day|week|month&course_id&trainer_id&gender
exports.getTrend = async (req, res) => {
  try {
    const { from, to } = getDateRange(req);

    const period = safeStr(req.query.period || "month").toLowerCase();
    const courseId = safeStr(req.query.course_id);
    const trainerId = safeStr(req.query.trainer_id);
    const gender = safeStr(req.query.gender).toLowerCase();

    let where = `WHERE tsr.created_at >= ? AND tsr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND ts.course_id = ?`;
      params.push(courseId);
    }
    if (trainerId) {
      where += ` AND ts.trainer_id = ?`;
      params.push(trainerId);
    }
    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }

    let labelExpr = `DATE_FORMAT(tsr.created_at, '%Y-%m')`;
    if (period === "day") labelExpr = `DATE_FORMAT(tsr.created_at, '%Y-%m-%d')`;
    if (period === "week") {
      labelExpr = `CONCAT(YEAR(tsr.created_at), '-W', LPAD(WEEK(tsr.created_at, 1), 2, '0'))`;
    }

    const [rows] = await pool.execute(
      `
      SELECT ${labelExpr} AS label, COUNT(*) AS cnt
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      ${where}
      GROUP BY label
      ORDER BY label ASC
      `,
      params,
    );

    return res.json({
      status: "success",
      data: {
        from,
        to,
        period,
        labels: rows.map((r) => String(r.label)),
        values: rows.map((r) => safeInt(r.cnt, 0)),
      },
    });
  } catch (err) {
    console.error("TESDA getTrend error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load TESDA trend report",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/tesda-reports/top-courses?from&to&course_id&trainer_id&gender
exports.getTopCourses = async (req, res) => {
  try {
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const trainerId = safeStr(req.query.trainer_id);
    const gender = safeStr(req.query.gender).toLowerCase();

    let where = `WHERE tsr.created_at >= ? AND tsr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND ts.course_id = ?`;
      params.push(courseId);
    }
    if (trainerId) {
      where += ` AND ts.trainer_id = ?`;
      params.push(trainerId);
    }
    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }

    const [rows] = await pool.execute(
      `
      SELECT tc.course_name AS name, COUNT(*) AS students
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      ${where}
      GROUP BY ts.course_id
      ORDER BY students DESC
      LIMIT 10
      `,
      params,
    );

    return res.json({
      status: "success",
      data: {
        labels: rows.map((r) => r.name),
        values: rows.map((r) => safeInt(r.students, 0)),
      },
    });
  } catch (err) {
    console.error("TESDA getTopCourses error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load TESDA top courses chart",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/tesda-reports/gender-breakdown?from&to&course_id&trainer_id
exports.getGenderBreakdown = async (req, res) => {
  try {
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const trainerId = safeStr(req.query.trainer_id);

    let where = `WHERE tsr.created_at >= ? AND tsr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND ts.course_id = ?`;
      params.push(courseId);
    }
    if (trainerId) {
      where += ` AND ts.trainer_id = ?`;
      params.push(trainerId);
    }

    const [rows] = await pool.execute(
      `
      SELECT
        SUM(CASE WHEN LOWER(u.gender) = 'male' THEN 1 ELSE 0 END) AS maleCount,
        SUM(CASE WHEN LOWER(u.gender) = 'female' THEN 1 ELSE 0 END) AS femaleCount
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      ${where}
      `,
      params,
    );

    const male = safeInt(rows?.[0]?.maleCount, 0);
    const female = safeInt(rows?.[0]?.femaleCount, 0);

    return res.json({
      status: "success",
      data: { labels: ["Male", "Female"], values: [male, female] },
    });
  } catch (err) {
    console.error("TESDA getGenderBreakdown error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load TESDA gender breakdown",
      debug: err.sqlMessage || err.message,
    });
  }
};

// ------------------------
// EXPORT CONTROLLERS (TESDA)
// ------------------------

// GET /api/admin/tesda-reports/export/overview?from&to&course_id&trainer_id&gender&format
exports.exportOverview = async (req, res) => {
  try {
    const format = getExportFormat(req);
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const trainerId = safeStr(req.query.trainer_id);
    const gender = safeStr(req.query.gender).toLowerCase();

    // reuse summary logic quickly by querying again
    let where = `WHERE tsr.created_at >= ? AND tsr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND ts.course_id = ?`;
      params.push(courseId);
    }
    if (trainerId) {
      where += ` AND ts.trainer_id = ?`;
      params.push(trainerId);
    }
    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }

    const [[{ totalEnrolled }]] = await pool.execute(
      `
      SELECT COUNT(*) AS totalEnrolled
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      ${where}
      `,
      params,
    );

    const [[{ doneCount }]] = await pool.execute(
      `
      SELECT COUNT(*) AS doneCount
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      ${where} AND ${isTesdaDoneConditionSql()}
      `,
      params,
    );

    const [popularRows] = await pool.execute(
      `
      SELECT tc.course_name AS name, COUNT(*) AS cnt
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      ${where}
      GROUP BY ts.course_id
      ORDER BY cnt DESC
      LIMIT 1
      `,
      params,
    );
    const mostPopularCourse = popularRows.length ? popularRows[0].name : "";

    const [revRows] = await pool.execute(
      `
      SELECT COALESCE(SUM(COALESCE(tc.course_fee, 0)), 0) AS totalRevenuePeso
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      ${where} AND ${isTesdaDoneConditionSql()}
      `,
      params,
    );

    const columns = [
      { header: "Metric", key: "metric", width: 28 },
      { header: "Value", key: "value", width: 40 },
    ];

    const rows = [
      { metric: "From", value: from },
      { metric: "To (exclusive)", value: to },
      { metric: "Course ID", value: courseId || "All" },
      { metric: "Trainer ID", value: trainerId || "All" },
      { metric: "Gender", value: gender || "All" },
      { metric: "Total Enrolled", value: safeInt(totalEnrolled, 0) },
      { metric: "Done Count", value: safeInt(doneCount, 0) },
      { metric: "Most Popular Course", value: mostPopularCourse || "-" },
      {
        metric: "Total Revenue (Estimated)",
        value: Number(revRows?.[0]?.totalRevenuePeso || 0),
      },
    ];

    if (format === "csv")
      return exportAsCsv(res, columns, rows, "tesda-overview");
    if (format === "pdf")
      return exportAsPdfSimple(
        res,
        "TESDA Overview Export",
        columns,
        rows,
        "tesda-overview",
      );
    return await exportAsXlsx(res, "Overview", columns, rows, "tesda-overview");
  } catch (err) {
    console.error("TESDA exportOverview error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to export TESDA overview",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/tesda-reports/export/top-courses?from&to&course_id&trainer_id&gender&format
exports.exportTopCourses = async (req, res) => {
  try {
    const format = getExportFormat(req);
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const trainerId = safeStr(req.query.trainer_id);
    const gender = safeStr(req.query.gender).toLowerCase();

    let where = `WHERE tsr.created_at >= ? AND tsr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND ts.course_id = ?`;
      params.push(courseId);
    }
    if (trainerId) {
      where += ` AND ts.trainer_id = ?`;
      params.push(trainerId);
    }
    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }

    const [rows] = await pool.execute(
      `
      SELECT tc.course_name AS course_name, COUNT(*) AS students
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      ${where}
      GROUP BY ts.course_id
      ORDER BY students DESC
      LIMIT 50
      `,
      params,
    );

    const columns = [
      { header: "Course", key: "course_name", width: 35 },
      { header: "Enrollments", key: "students", width: 14 },
    ];

    const out = rows.map((r) => ({
      course_name: r.course_name,
      students: safeInt(r.students, 0),
    }));

    if (format === "csv")
      return exportAsCsv(res, columns, out, "tesda-top-courses");
    if (format === "pdf")
      return exportAsPdfSimple(
        res,
        "TESDA Top Courses Export",
        columns,
        out,
        "tesda-top-courses",
      );
    return await exportAsXlsx(
      res,
      "TopCourses",
      columns,
      out,
      "tesda-top-courses",
    );
  } catch (err) {
    console.error("TESDA exportTopCourses error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to export TESDA top courses",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/tesda-reports/export/course-monthly?from&to&course_id&trainer_id&format
exports.exportCourseMonthly = async (req, res) => {
  try {
    const format = getExportFormat(req);
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const trainerId = safeStr(req.query.trainer_id);

    let where = `WHERE tsr.created_at >= ? AND tsr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND ts.course_id = ?`;
      params.push(courseId);
    }
    if (trainerId) {
      where += ` AND ts.trainer_id = ?`;
      params.push(trainerId);
    }

    const [rows] = await pool.execute(
      `
      SELECT
        DATE_FORMAT(tsr.created_at, '%Y-%m') AS month_label,
        tc.course_name,
        COUNT(*) AS count
      FROM tesda_schedule_reservations tsr
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      ${where}
      GROUP BY month_label, ts.course_id
      ORDER BY month_label DESC, count DESC
      `,
      params,
    );

    const columns = [
      { header: "Month", key: "month_label", width: 14 },
      { header: "Course", key: "course_name", width: 36 },
      { header: "Enrollments", key: "count", width: 14 },
    ];

    const out = rows.map((r) => ({
      month_label: r.month_label,
      course_name: r.course_name,
      count: safeInt(r.count, 0),
    }));

    if (format === "csv")
      return exportAsCsv(res, columns, out, "tesda-course-monthly");
    if (format === "pdf")
      return exportAsPdfSimple(
        res,
        "TESDA Course Monthly Export",
        columns,
        out,
        "tesda-course-monthly",
      );
    return await exportAsXlsx(
      res,
      "CourseMonthly",
      columns,
      out,
      "tesda-course-monthly",
    );
  } catch (err) {
    console.error("TESDA exportCourseMonthly error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to export TESDA course monthly",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/tesda-reports/export/detailed?from&to&course_id&trainer_id&gender&status&format&q
exports.exportDetailed = async (req, res) => {
  try {
    const format = getExportFormat(req);
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const trainerId = safeStr(req.query.trainer_id);
    const gender = safeStr(req.query.gender).toLowerCase();
    const status = safeStr(req.query.status).toLowerCase();
    const q = safeStr(req.query.q);

    let where = `WHERE tsr.created_at >= ? AND tsr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND ts.course_id = ?`;
      params.push(courseId);
    }
    if (trainerId) {
      where += ` AND ts.trainer_id = ?`;
      params.push(trainerId);
    }
    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }
    if (status === "done") where += ` AND ${isTesdaDoneConditionSql()}`;
    else if (status === "pending")
      where += ` AND NOT ${isTesdaDoneConditionSql()}`;

    if (source === "ONLINE" || source === "WALKIN") {
      where += ` AND UPPER(tsr.reservation_source) = ?`;
      params.push(source);
    }

    if (q) {
      const like = `%${safeLike(q)}%`;
      where += `
        AND (
          u.fullname LIKE ? OR
          CAST(tsr.student_id AS CHAR) LIKE ? OR
          tc.course_name LIKE ? OR
          tc.course_code LIKE ? OR
          CAST(tsr.schedule_id AS CHAR) LIKE ?
        )
      `;
      params.push(like, like, like, like, like);
    }

    const [rows] = await pool.execute(
      `
      SELECT
        tsr.reservation_id,
        tsr.schedule_id,
        tsr.student_id,
        u.fullname,
        u.gender,
        u.birthday,

        tc.course_code,
        tc.course_name,
        tc.duration,
        tc.course_fee,

        ts.trainer_id,
        CONCAT_WS(' ', tr.firstname, tr.lastname) AS trainer_name,
        ts.schedule_date,
        ts.schedule_date AS course_start,
        ts.schedule_date AS course_end,
        ts.start_time,
        ts.end_time,

        tsr.reservation_source,
        tsr.reservation_status,
        CASE WHEN ${isTesdaDoneConditionSql()} THEN 'DONE' ELSE 'PENDING' END AS derived_status,
        tsr.batch_id,
        tsr.notes,
        tsr.created_at,
        tsr.updated_at

      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      LEFT JOIN trainers tr ON tr.trainer_id = ts.trainer_id
      ${where}
      ORDER BY tsr.created_at DESC
      LIMIT 10000
      `,
      params,
    );

    const columns = [
      { header: "Reservation ID", key: "reservation_id", width: 14 },
      { header: "Schedule ID", key: "schedule_id", width: 12 },
      { header: "Student ID", key: "student_id", width: 10 },
      { header: "Full Name", key: "fullname", width: 26 },
      { header: "Gender", key: "gender", width: 8 },
      { header: "Birthdate", key: "birthday", width: 12 },
      { header: "Course Code", key: "course_code", width: 14 },
      { header: "Course", key: "course_name", width: 26 },
      { header: "Duration", key: "duration", width: 12 },
      { header: "Fee", key: "course_fee", width: 10 },
      { header: "Trainer ID", key: "trainer_id", width: 10 },
      { header: "Trainer", key: "trainer_name", width: 22 },
      { header: "Schedule Date", key: "schedule_date", width: 14 },
      { header: "Start", key: "start_time", width: 10 },
      { header: "End", key: "end_time", width: 10 },
      { header: "Source", key: "reservation_source", width: 10 },
      { header: "Status", key: "reservation_status", width: 12 },
      { header: "Derived", key: "derived_status", width: 10 },
      { header: "Batch ID", key: "batch_id", width: 10 },
      { header: "Notes", key: "notes", width: 26 },
      { header: "Created At", key: "created_at", width: 16 },
      { header: "Updated At", key: "updated_at", width: 16 },
    ];

    const out = rows.map((r) => ({
      reservation_id: r.reservation_id,
      schedule_id: r.schedule_id,
      student_id: r.student_id,
      fullname: r.fullname || "",
      gender: r.gender || "",
      birthday: r.birthday ? toISODate(r.birthday) : "",
      course_code: r.course_code || "",
      course_name: r.course_name || "",
      duration: r.duration || "",
      course_fee: Number(r.course_fee || 0),
      trainer_id: r.trainer_id || "",
      trainer_name: r.trainer_name || "",
      schedule_date: r.schedule_date ? toISODate(r.schedule_date) : "",
      start_time: r.start_time || "",
      end_time: r.end_time || "",
      reservation_source: r.reservation_source || "",
      reservation_status: r.reservation_status || "",
      derived_status: r.derived_status || "",
      batch_id: r.batch_id || "",
      notes: r.notes || "",
      created_at: r.created_at ? toISODate(r.created_at) : "",
      updated_at: r.updated_at ? toISODate(r.updated_at) : "",
    }));

    if (format === "csv")
      return exportAsCsv(res, columns, out, "tesda-detailed");
    if (format === "pdf")
      return exportAsPdfSimple(
        res,
        "TESDA Detailed Export",
        columns,
        out,
        "tesda-detailed",
      );
    return await exportAsXlsx(res, "Detailed", columns, out, "tesda-detailed");
  } catch (err) {
    console.error("TESDA exportDetailed error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to export TESDA detailed",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/tesda-reports/export/all?from&to&course_id&trainer_id&format=xlsx
exports.exportAll = async (req, res) => {
  try {
    const format = getExportFormat(req);
    if (format !== "xlsx") return exports.exportOverview(req, res);

    const { from, to } = getDateRange(req);
    const courseId = safeStr(req.query.course_id);
    const trainerId = safeStr(req.query.trainer_id);

    let where = `WHERE tsr.created_at >= ? AND tsr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND ts.course_id = ?`;
      params.push(courseId);
    }
    if (trainerId) {
      where += ` AND ts.trainer_id = ?`;
      params.push(trainerId);
    }

    // overview metrics
    const [[{ totalEnrolled }]] = await pool.execute(
      `
      SELECT COUNT(*) AS totalEnrolled
      FROM tesda_schedule_reservations tsr
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      ${where}
      `,
      params,
    );

    const [[{ doneCount }]] = await pool.execute(
      `
      SELECT COUNT(*) AS doneCount
      FROM tesda_schedule_reservations tsr
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      ${where} AND ${isTesdaDoneConditionSql()}
      `,
      params,
    );

    const [popularRows] = await pool.execute(
      `
      SELECT tc.course_name AS name, COUNT(*) AS cnt
      FROM tesda_schedule_reservations tsr
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      ${where}
      GROUP BY ts.course_id
      ORDER BY cnt DESC
      LIMIT 1
      `,
      params,
    );
    const mostPopularCourse = popularRows.length ? popularRows[0].name : "";

    const [revRows] = await pool.execute(
      `
      SELECT COALESCE(SUM(COALESCE(tc.course_fee, 0)), 0) AS totalRevenuePeso
      FROM tesda_schedule_reservations tsr
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      ${where} AND ${isTesdaDoneConditionSql()}
      `,
      params,
    );

    // Top courses
    const [topRows] = await pool.execute(
      `
      SELECT tc.course_name AS course_name, COUNT(*) AS students
      FROM tesda_schedule_reservations tsr
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      ${where}
      GROUP BY ts.course_id
      ORDER BY students DESC
      LIMIT 50
      `,
      params,
    );

    // Monthly
    const [monthlyRows] = await pool.execute(
      `
      SELECT
        DATE_FORMAT(tsr.created_at, '%Y-%m') AS month_label,
        tc.course_name,
        COUNT(*) AS count
      FROM tesda_schedule_reservations tsr
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      ${where}
      GROUP BY month_label, ts.course_id
      ORDER BY month_label DESC, count DESC
      `,
      params,
    );

    // Detailed
    const [detailedRows] = await pool.execute(
      `
      SELECT
        tsr.reservation_id,
        tsr.schedule_id,
        tsr.student_id,
        u.fullname,
        u.gender,
        u.birthday,
        tc.course_code,
        tc.course_name,
        ts.trainer_id,
        CONCAT_WS(' ', tr.firstname, tr.lastname) AS trainer_name,
        ts.schedule_date,
        ts.schedule_date AS course_start,
        ts.schedule_date AS course_end,
        ts.start_time,
        ts.end_time,
        tsr.reservation_source,
        tsr.reservation_status,
        CASE WHEN ${isTesdaDoneConditionSql()} THEN 'DONE' ELSE 'PENDING' END AS derived_status,
        tsr.batch_id,
        tsr.created_at
      FROM tesda_schedule_reservations tsr
      LEFT JOIN users u ON u.id = tsr.student_id
      LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
      LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
      LEFT JOIN trainers tr ON tr.trainer_id = ts.trainer_id
      ${where}
      ORDER BY tsr.created_at DESC
      LIMIT 10000
      `,
      params,
    );

    const wb = new ExcelJS.Workbook();

    // Overview
    const s1 = wb.addWorksheet("Overview");
    s1.columns = [
      { header: "Metric", key: "metric", width: 28 },
      { header: "Value", key: "value", width: 40 },
    ];
    s1.addRows([
      { metric: "From", value: from },
      { metric: "To (exclusive)", value: to },
      { metric: "Course ID", value: courseId || "All" },
      { metric: "Trainer ID", value: trainerId || "All" },
      { metric: "Total Enrolled", value: safeInt(totalEnrolled, 0) },
      { metric: "Done Count", value: safeInt(doneCount, 0) },
      { metric: "Most Popular Course", value: mostPopularCourse || "-" },
      {
        metric: "Total Revenue (Estimated)",
        value: Number(revRows?.[0]?.totalRevenuePeso || 0),
      },
    ]);
    s1.getRow(1).font = { bold: true };
    s1.views = [{ state: "frozen", ySplit: 1 }];

    // TopCourses
    const s2 = wb.addWorksheet("TopCourses");
    s2.columns = [
      { header: "Course", key: "course_name", width: 35 },
      { header: "Enrollments", key: "students", width: 14 },
    ];
    s2.addRows(
      topRows.map((r) => ({
        course_name: r.course_name,
        students: safeInt(r.students, 0),
      })),
    );
    s2.getRow(1).font = { bold: true };
    s2.views = [{ state: "frozen", ySplit: 1 }];

    // CourseMonthly
    const s3 = wb.addWorksheet("CourseMonthly");
    s3.columns = [
      { header: "Month", key: "month_label", width: 14 },
      { header: "Course", key: "course_name", width: 36 },
      { header: "Enrollments", key: "count", width: 14 },
    ];
    s3.addRows(
      monthlyRows.map((r) => ({
        month_label: r.month_label,
        course_name: r.course_name,
        count: safeInt(r.count, 0),
      })),
    );
    s3.getRow(1).font = { bold: true };
    s3.views = [{ state: "frozen", ySplit: 1 }];

    // Detailed
    const s4 = wb.addWorksheet("Detailed");
    s4.columns = [
      { header: "Reservation ID", key: "reservation_id", width: 14 },
      { header: "Schedule ID", key: "schedule_id", width: 12 },
      { header: "Student ID", key: "student_id", width: 10 },
      { header: "Full Name", key: "fullname", width: 26 },
      { header: "Gender", key: "gender", width: 8 },
      { header: "Birthdate", key: "birthday", width: 12 },
      { header: "Course Code", key: "course_code", width: 14 },
      { header: "Course", key: "course_name", width: 26 },
      { header: "Trainer", key: "trainer_name", width: 22 },
      { header: "Schedule Date", key: "schedule_date", width: 14 },
      { header: "Start", key: "start_time", width: 10 },
      { header: "End", key: "end_time", width: 10 },
      { header: "Source", key: "reservation_source", width: 10 },
      { header: "Status", key: "reservation_status", width: 12 },
      { header: "Derived", key: "derived_status", width: 10 },
      { header: "Batch ID", key: "batch_id", width: 10 },
      { header: "Created At", key: "created_at", width: 16 },
    ];
    s4.addRows(
      detailedRows.map((r) => ({
        reservation_id: r.reservation_id,
        schedule_id: r.schedule_id,
        student_id: r.student_id,
        fullname: r.fullname || "",
        gender: r.gender || "",
        birthday: r.birthday ? toISODate(r.birthday) : "",
        course_code: r.course_code || "",
        course_name: r.course_name || "",
        trainer_name: r.trainer_name || "",
        schedule_date: r.schedule_date ? toISODate(r.schedule_date) : "",
        start_time: r.start_time || "",
        end_time: r.end_time || "",
        reservation_source: r.reservation_source || "",
        reservation_status: r.reservation_status || "",
        derived_status: r.derived_status || "",
        batch_id: r.batch_id || "",
        created_at: r.created_at ? toISODate(r.created_at) : "",
      })),
    );
    s4.getRow(1).font = { bold: true };
    s4.views = [{ state: "frozen", ySplit: 1 }];

    setDownloadHeaders(
      res,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      makeFileName("tesda-reports-all", "xlsx"),
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("TESDA exportAll error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to export TESDA all",
      debug: err.sqlMessage || err.message,
    });
  }
};
