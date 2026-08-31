// backend/src/controllers/adminReportsController.js
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

// ------------------------
// Report mode helpers (Driving vs TESDA)
// ------------------------
function getReportMode(req) {
  const raw = String(
    req.query.report_mode || req.query.mode || "driving",
  ).toLowerCase();
  return raw === "tesda" ? "tesda" : "driving";
}

function enrolledStatuses() {
  return ["CONFIRMED", "APPROVED", "ACTIVE", "DONE", "COMPLETED", "FINISHED"];
}

function sqlInPlaceholders(arr) {
  return arr.map(() => "?").join(",");
}

function isDoneConditionSql() {
  return `(sr.done_at IS NOT NULL OR UPPER(sr.reservation_status) IN ('DONE','COMPLETED','FINISHED'))`;
}

/**
 * DL code derived from course_code:
 * - PDC-A  => A
 * - PDC-B  => B
 * - PDC-AB => AB
 * - else fallback to course_code
 */
function dlCodeExprSql() {
  return `
    CASE
      WHEN c.course_code LIKE 'PDC-%' THEN SUBSTRING_INDEX(c.course_code, '-', -1)
      ELSE c.course_code
    END
  `;
}

/**
 * Join latest payment submission per tuple (schedule_id, student_id, course_id)
 * to avoid duplicate rows.
 */
function latestSubmissionJoinSql() {
  return `
    LEFT JOIN (
      SELECT schedule_id, student_id, course_id, MAX(id) AS last_id
      FROM student_payment_submissions
      GROUP BY schedule_id, student_id, course_id
    ) sps_last
      ON sps_last.schedule_id = sr.schedule_id
     AND sps_last.student_id = sr.student_id
     AND sps_last.course_id = sr.course_id
    LEFT JOIN student_payment_submissions sps
      ON sps.id = sps_last.last_id
  `;
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
  for (const r of rows) {
    lines.push(keys.map((k) => esc(r[k])).join(","));
  }

  setDownloadHeaders(
    res,
    "text/csv; charset=utf-8",
    makeFileName(baseName, "csv"),
  );
  res.send(lines.join("\n"));
}

function exportAsPdfSimple(res, title, columns, rows, baseName) {
  setDownloadHeaders(res, "application/pdf", makeFileName(baseName, "pdf"));

  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 24,
  });

  doc.pipe(res);

  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startX = doc.page.margins.left;
  const bottomY = doc.page.height - doc.page.margins.bottom;

  const headerFontSize = 8;
  const bodyFontSize = 7;
  const cellPadX = 4;
  const cellPadY = 4;
  const minRowHeight = 18;

  const totalWeight = columns.reduce(
    (sum, c) => sum + (Number(c.width) || 10),
    0,
  );

  const colWidths = columns.map((c) => {
    const weight = Number(c.width) || 10;
    return Math.max(42, (weight / totalWeight) * pageWidth);
  });

  function cleanText(v) {
    return String(v ?? "")
      .replace(/\r?\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function drawReportHeader() {
    doc.font("Helvetica-Bold").fontSize(14).text(title, startX, doc.y, {
      width: pageWidth,
      align: "center",
    });

    doc.moveDown(0.2);

    doc
      .font("Helvetica")
      .fontSize(8)
      .text(`Generated: ${new Date().toLocaleString()}`, startX, doc.y, {
        width: pageWidth,
        align: "right",
      });

    doc.moveDown(0.5);
  }

  function getRowHeight(row, isHeader = false) {
    doc.font(isHeader ? "Helvetica-Bold" : "Helvetica");
    doc.fontSize(isHeader ? headerFontSize : bodyFontSize);

    let maxHeight = minRowHeight;

    columns.forEach((col, i) => {
      const txt = isHeader ? col.header : cleanText(row[col.key]);
      const h = doc.heightOfString(txt, {
        width: colWidths[i] - cellPadX * 2,
        align: "left",
      });
      maxHeight = Math.max(maxHeight, h + cellPadY * 2);
    });

    return maxHeight;
  }

  function drawTableHeader(y) {
    const rowHeight = getRowHeight({}, true);
    let x = startX;

    doc.font("Helvetica-Bold").fontSize(headerFontSize);

    columns.forEach((col, i) => {
      const w = colWidths[i];

      doc.rect(x, y, w, rowHeight).stroke();
      doc.text(col.header, x + cellPadX, y + cellPadY, {
        width: w - cellPadX * 2,
        align: "left",
      });

      x += w;
    });

    return y + rowHeight;
  }

  function addPageWithHeader() {
    doc.addPage({ size: "A4", layout: "landscape", margin: 24 });
    drawReportHeader();
    return drawTableHeader(doc.y);
  }

  drawReportHeader();
  let y = drawTableHeader(doc.y);

  doc.font("Helvetica").fontSize(bodyFontSize);

  if (!rows.length) {
    doc.moveDown(1);
    doc.fontSize(9).text("No data available.", startX, doc.y);
    doc.end();
    return;
  }

  for (const row of rows) {
    const rowHeight = getRowHeight(row, false);

    if (y + rowHeight > bottomY) {
      y = addPageWithHeader();
    }

    let x = startX;

    columns.forEach((col, i) => {
      const w = colWidths[i];
      const txt = cleanText(row[col.key]);

      doc.rect(x, y, w, rowHeight).stroke();
      doc.text(txt, x + cellPadX, y + cellPadY, {
        width: w - cellPadX * 2,
        align: "left",
      });

      x += w;
    });

    y += rowHeight;
  }

  doc.end();
}

// ------------------------
// CONTROLLERS
// ------------------------

// GET /api/admin/reports/detailed?from&to&course_id&gender&payment_method&status&page&limit&q
exports.getDetailed = async (req, res) => {
  try {
    const mode = getReportMode(req);
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const gender = safeStr(req.query.gender).toLowerCase();
    const paymentMethod = safeStr(req.query.payment_method).toUpperCase();
    const status = safeStr(req.query.status).toLowerCase();
    const q = safeStr(req.query.q);

    if (mode === "tesda") {
      const { page, limit, offset } = clampLimitOffset(
        req.query.page,
        req.query.limit,
      );
      const enrolled = enrolledStatuses();

      const safeLimit = Number.isFinite(limit) ? limit : 20;
      const safeOffset = Number.isFinite(offset) ? offset : 0;

      let where = `WHERE tsr.created_at >= ? AND tsr.created_at < ? AND tsr.reservation_status IN (${sqlInPlaceholders(enrolled)})`;
      const params = [from, to, ...enrolled];

      if (courseId) {
        where += ` AND ts.course_id = ?`;
        params.push(courseId);
      }

      if (gender === "male" || gender === "female") {
        where += ` AND LOWER(u.gender) = ?`;
        params.push(gender);
      }

      if (status) {
        where += ` AND LOWER(tsr.reservation_status) = ?`;
        params.push(status);
      }

      if (q) {
        const like = `%${safeLike(q)}%`;
        where += `
          AND (
            u.fullname LIKE ? OR
            CAST(tsr.student_id AS CHAR) LIKE ? OR
            tc.course_name LIKE ? OR
            tc.course_code LIKE ? OR
            CAST(tsr.reservation_id AS CHAR) LIKE ?
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

      const [rows] = await pool.execute(
        `
        SELECT
          tsr.reservation_id,
          tsr.schedule_id,
          tsr.student_id,
          NULL AS lto_client_id,
          ts.course_id,
          tsr.reservation_source,
          tsr.reservation_status,
          NULL AS payment_method,
          NULL AS fee_option_code,
          tsr.created_at,

          u.fullname,
          u.gender,
          u.birthday,

          tc.course_code,
          tc.course_name,
          tc.course_fee,
          tc.duration,

          NULL AS dl_code,

          ts.schedule_date AS schedule_date,
          ts.schedule_date AS course_start,
          ts.schedule_date AS course_end,
          ts.start_time,
          ts.end_time,

          ts.trainer_id,
          CONCAT_WS(' ', tr.firstname, tr.lastname) AS trainer_name,
          CONCAT_WS(' ', tr.firstname, tr.lastname) AS instructor_name
        FROM tesda_schedule_reservations tsr
        LEFT JOIN users u ON u.id = tsr.student_id
        LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
        LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
        LEFT JOIN trainers tr ON tr.trainer_id = ts.trainer_id
        ${where}
        ORDER BY tsr.created_at DESC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
        `,
        params,
      );

      return res.json({
        status: "success",
        data: rows,
        meta: { from, to, total, page, limit },
      });
    }

    const { page, limit, offset } = clampLimitOffset(
      req.query.page,
      req.query.limit,
    );

    let where = `
      WHERE sr.created_at >= ?
        AND sr.created_at < ?
        AND COALESCE(sr.is_historical, 0) = 0
    `;

    const params = [from, to];

    if (courseId) {
      where += ` AND sr.course_id = ?`;
      params.push(courseId);
    }

    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }

    if (paymentMethod === "CASH" || paymentMethod === "GCASH") {
      where += ` AND UPPER(sr.payment_method) = ?`;
      params.push(paymentMethod);
    }

    if (status === "done") where += ` AND ${isDoneConditionSql()}`;
    else if (status === "pending") where += ` AND NOT ${isDoneConditionSql()}`;

    if (q) {
      const like = `%${safeLike(q)}%`;
      where += `
        AND (
          u.fullname LIKE ? OR
          CAST(sr.student_id AS CHAR) LIKE ? OR
          sr.lto_client_id LIKE ? OR
          c.course_name LIKE ? OR
          c.course_code LIKE ? OR
          sps.payment_ref LIKE ?
        )
      `;
      params.push(like, like, like, like, like, like);
    }

    const [countRows] = await pool.execute(
      `
      SELECT COUNT(*) AS total
      FROM schedule_reservations sr
      LEFT JOIN users u ON u.id = sr.student_id
      LEFT JOIN courses c ON c.id = sr.course_id
      LEFT JOIN schedules s ON s.schedule_id = sr.schedule_id
      LEFT JOIN instructors i ON i.instructor_id = s.instructor_id
      ${latestSubmissionJoinSql()}
      ${where}
      `,
      params,
    );

    const total = safeInt(countRows?.[0]?.total, 0);

    const sql = `
      SELECT
        sr.reservation_id,
        sr.schedule_id,
        sr.student_id,
        sr.lto_client_id,
        sr.course_id,
        sr.reservation_source,
        sr.reservation_status,

        sr.payment_method,
        sr.fee_option_code,

        sr.created_by,
        sr.created_at,
        sr.updated_at,
        sr.requirements_mode,
        sr.expires_at,
        sr.done_at,

        u.fullname,
        u.gender,
        u.birthday,

        u.nationality,
        u.civil_status,
        u.address,

        c.course_name,
        c.course_fee,

        ${dlCodeExprSql()} AS dl_code,

        s.schedule_date,
        s.start_time,
        s.end_time,
        s.instructor_id,
        i.fullname AS instructor_name,

        sps.payment_ref,
        sps.status AS submission_status,
        sps.verified_at,
        sps.amount_centavos,
        sps.currency,

        COALESCE(s.schedule_date, DATE(sr.created_at)) AS course_start,
        COALESCE(s.schedule_date, DATE(sr.created_at)) AS course_end,

        sr.training_purpose,

        CASE WHEN ${isDoneConditionSql()} THEN 'DONE' ELSE 'PENDING' END AS derived_status

      FROM schedule_reservations sr
      LEFT JOIN users u ON u.id = sr.student_id
      LEFT JOIN courses c ON c.id = sr.course_id
      LEFT JOIN schedules s ON s.schedule_id = sr.schedule_id
      LEFT JOIN instructors i ON i.instructor_id = s.instructor_id
      ${latestSubmissionJoinSql()}
      ${where}
      ORDER BY sr.created_at DESC
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
    console.error("getDetailed error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load detailed report",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/reports/summary?from&to&course_id&gender
exports.getSummary = async (req, res) => {
  try {
    const mode = getReportMode(req);
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const gender = safeStr(req.query.gender).toLowerCase();

    const enrolled = enrolledStatuses();

    let where = `WHERE sr.created_at >= ? AND sr.created_at < ? AND sr.reservation_status IN (${sqlInPlaceholders(enrolled)})`;
    const params = [from, to, ...enrolled];

    if (courseId) {
      where += ` AND sr.course_id = ?`;
      params.push(courseId);
    }
    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }

    if (mode === "tesda") {
      let whereTesda = `WHERE sr.created_at >= ? AND sr.created_at < ? AND sr.reservation_status IN (${sqlInPlaceholders(enrolled)})`;
      const paramsTesda = [from, to, ...enrolled];

      if (courseId) {
        whereTesda += ` AND s.course_id = ?`;
        paramsTesda.push(courseId);
      }
      if (gender === "male" || gender === "female") {
        whereTesda += ` AND LOWER(u.gender) = ?`;
        paramsTesda.push(gender);
      }

      const [[{ totalEnrolled }]] = await pool.execute(
        `
        SELECT COUNT(*) AS totalEnrolled
        FROM tesda_schedule_reservations sr
        LEFT JOIN tesda_schedules s ON s.schedule_id = sr.schedule_id
        LEFT JOIN users u ON u.id = sr.student_id
        ${whereTesda}
        `,
        paramsTesda,
      );

      const [popularRows] = await pool.execute(
        `
        SELECT c.course_name AS name, COUNT(*) AS cnt
        FROM tesda_schedule_reservations sr
        LEFT JOIN tesda_schedules s ON s.schedule_id = sr.schedule_id
        LEFT JOIN tesda_courses c ON c.id = s.course_id
        LEFT JOIN users u ON u.id = sr.student_id
        ${whereTesda}
        GROUP BY s.course_id
        ORDER BY cnt DESC
        LIMIT 1
        `,
        paramsTesda,
      );

      const mostPopularCourse = popularRows.length ? popularRows[0].name : "";

      return res.json({
        status: "success",
        data: {
          from,
          to,
          totalEnrolled: safeInt(totalEnrolled, 0),
          mostPopularCourse,
          completionRate: 0,
          certIssued: 0,
          totalRevenuePeso: 0,
          doneCount: 0,
        },
      });
    }

    const [[{ totalEnrolled }]] = await pool.execute(
      `
      SELECT COUNT(*) AS totalEnrolled
      FROM schedule_reservations sr
      LEFT JOIN users u ON u.id = sr.student_id
      ${where}
      `,
      params,
    );

    const [popularRows] = await pool.execute(
      `
      SELECT c.course_name AS name, COUNT(*) AS cnt
      FROM schedule_reservations sr
      LEFT JOIN courses c ON c.id = sr.course_id
      LEFT JOIN users u ON u.id = sr.student_id
      ${where}
      GROUP BY sr.course_id
      ORDER BY cnt DESC
      LIMIT 1
      `,
      params,
    );

    const mostPopularCourse = popularRows.length ? popularRows[0].name : "";

    let doneWhere = `WHERE sr.created_at >= ? AND sr.created_at < ? AND ${isDoneConditionSql()}`;
    const doneParams = [from, to];

    if (courseId) {
      doneWhere += ` AND sr.course_id = ?`;
      doneParams.push(courseId);
    }
    if (gender === "male" || gender === "female") {
      doneWhere += ` AND LOWER(u.gender) = ?`;
      doneParams.push(gender);
    }

    const [revRows] = await pool.execute(
      `
      SELECT
        COUNT(*) AS doneCount,
        COALESCE(SUM(
          CASE
            WHEN sps.amount_centavos IS NOT NULL THEN ROUND(sps.amount_centavos / 100, 2)
            ELSE COALESCE(c.course_fee, 0)
          END
        ), 0) AS totalRevenuePeso
      FROM schedule_reservations sr
      LEFT JOIN users u ON u.id = sr.student_id
      LEFT JOIN courses c ON c.id = sr.course_id
      ${latestSubmissionJoinSql()}
      ${doneWhere}
      `,
      doneParams,
    );

    return res.json({
      status: "success",
      data: {
        from,
        to,
        totalEnrolled: safeInt(totalEnrolled, 0),
        mostPopularCourse,
        completionRate: 0,
        certIssued: 0,
        totalRevenuePeso: Number(revRows?.[0]?.totalRevenuePeso || 0),
        doneCount: safeInt(revRows?.[0]?.doneCount || 0, 0),
      },
    });
  } catch (err) {
    console.error("getSummary error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load summary report",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/reports/trend?from&to&period=day|week|month&course_id&gender
exports.getTrend = async (req, res) => {
  try {
    const mode = getReportMode(req);
    const { from, to } = getDateRange(req);

    const period = safeStr(req.query.period || "month").toLowerCase();
    const courseId = safeStr(req.query.course_id);
    const gender = safeStr(req.query.gender).toLowerCase();

    const enrolled = enrolledStatuses();
    let where = `WHERE sr.created_at >= ? AND sr.created_at < ? AND sr.reservation_status IN (${sqlInPlaceholders(enrolled)})`;
    const params = [from, to, ...enrolled];

    if (courseId) {
      where += ` AND ${mode === "tesda" ? "s.course_id" : "sr.course_id"} = ?`;
      params.push(courseId);
    }
    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }

    let labelExpr = `DATE_FORMAT(sr.created_at, '%Y-%m')`;
    if (period === "day") labelExpr = `DATE_FORMAT(sr.created_at, '%Y-%m-%d')`;
    if (period === "week") {
      labelExpr = `CONCAT(YEAR(sr.created_at), '-W', LPAD(WEEK(sr.created_at, 1), 2, '0'))`;
    }

    const [rows] = await pool.execute(
      mode === "tesda"
        ? `
          SELECT ${labelExpr} AS label, COUNT(*) AS cnt
          FROM tesda_schedule_reservations sr
          LEFT JOIN tesda_schedules s ON s.schedule_id = sr.schedule_id
          LEFT JOIN users u ON u.id = sr.student_id
          ${where}
          GROUP BY label
          ORDER BY label ASC
          `
        : `
          SELECT ${labelExpr} AS label, COUNT(*) AS cnt
          FROM schedule_reservations sr
          LEFT JOIN users u ON u.id = sr.student_id
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
    console.error("getTrend error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load trend report",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/reports/top-courses?from&to&course_id&gender
exports.getTopCourses = async (req, res) => {
  try {
    const mode = getReportMode(req);
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const gender = safeStr(req.query.gender).toLowerCase();

    const enrolled = enrolledStatuses();
    let where = `WHERE sr.created_at >= ? AND sr.created_at < ? AND sr.reservation_status IN (${sqlInPlaceholders(enrolled)})`;
    const params = [from, to, ...enrolled];

    if (courseId) {
      where += ` AND ${mode === "tesda" ? "s.course_id" : "sr.course_id"} = ?`;
      params.push(courseId);
    }
    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }

    const [rows] = await pool.execute(
      mode === "tesda"
        ? `
          SELECT c.course_name AS name, COUNT(*) AS students
          FROM tesda_schedule_reservations sr
          LEFT JOIN tesda_schedules s ON s.schedule_id = sr.schedule_id
          LEFT JOIN tesda_courses c ON c.id = s.course_id
          LEFT JOIN users u ON u.id = sr.student_id
          ${where}
          GROUP BY s.course_id
          ORDER BY students DESC
          LIMIT 10
          `
        : `
          SELECT c.course_name AS name, COUNT(*) AS students
          FROM schedule_reservations sr
          LEFT JOIN courses c ON c.id = sr.course_id
          LEFT JOIN users u ON u.id = sr.student_id
          ${where}
          GROUP BY sr.course_id
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
    console.error("getTopCourses error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load top courses chart",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/reports/gender-breakdown?from&to&course_id
exports.getGenderBreakdown = async (req, res) => {
  try {
    const mode = getReportMode(req);
    const { from, to } = getDateRange(req);
    const courseId = safeStr(req.query.course_id);

    const enrolled = enrolledStatuses();
    let where = `WHERE sr.created_at >= ? AND sr.created_at < ? AND sr.reservation_status IN (${sqlInPlaceholders(enrolled)})`;
    const params = [from, to, ...enrolled];

    if (courseId) {
      where += ` AND ${mode === "tesda" ? "s.course_id" : "sr.course_id"} = ?`;
      params.push(courseId);
    }

    const [rows] = await pool.execute(
      mode === "tesda"
        ? `
          SELECT
            SUM(CASE WHEN LOWER(u.gender) = 'male' THEN 1 ELSE 0 END) AS maleCount,
            SUM(CASE WHEN LOWER(u.gender) = 'female' THEN 1 ELSE 0 END) AS femaleCount
          FROM tesda_schedule_reservations sr
          LEFT JOIN tesda_schedules s ON s.schedule_id = sr.schedule_id
          LEFT JOIN users u ON u.id = sr.student_id
          ${where}
          `
        : `
          SELECT
            SUM(CASE WHEN LOWER(u.gender) = 'male' THEN 1 ELSE 0 END) AS maleCount,
            SUM(CASE WHEN LOWER(u.gender) = 'female' THEN 1 ELSE 0 END) AS femaleCount
          FROM schedule_reservations sr
          LEFT JOIN users u ON u.id = sr.student_id
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
    console.error("getGenderBreakdown error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load gender breakdown",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/reports/course-monthly-preview?from&to&course_id
exports.getCourseMonthlyPreview = async (req, res) => {
  try {
    const mode = getReportMode(req);
    const { from, to } = getDateRange(req);
    const courseId = safeStr(req.query.course_id);

    const enrolled = enrolledStatuses();
    let where = `WHERE sr.created_at >= ? AND sr.created_at < ? AND sr.reservation_status IN (${sqlInPlaceholders(enrolled)})`;
    const params = [from, to, ...enrolled];

    if (courseId) {
      where += ` AND ${mode === "tesda" ? "s.course_id" : "sr.course_id"} = ?`;
      params.push(courseId);
    }

    const [rows] = await pool.execute(
      mode === "tesda"
        ? `
          SELECT
            DATE_FORMAT(sr.created_at, '%Y-%m') AS month_label,
            c.course_name,
            COUNT(*) AS count
          FROM tesda_schedule_reservations sr
          LEFT JOIN tesda_schedules s ON s.schedule_id = sr.schedule_id
          LEFT JOIN tesda_courses c ON c.id = s.course_id
          ${where}
          GROUP BY month_label, s.course_id
          ORDER BY month_label DESC, count DESC
          LIMIT 50
          `
        : `
          SELECT
            DATE_FORMAT(sr.created_at, '%Y-%m') AS month_label,
            c.course_name,
            COUNT(*) AS count
          FROM schedule_reservations sr
          LEFT JOIN courses c ON c.id = sr.course_id
          ${where}
          GROUP BY month_label, sr.course_id
          ORDER BY month_label DESC, count DESC
          `,
      params,
    );

    return res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("getCourseMonthlyPreview error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load course monthly preview",
      debug: err.sqlMessage || err.message,
    });
  }
};

// =====================
// Attendance report (Driving + TESDA)
// =====================
exports.getAttendanceReport = async (req, res) => {
  try {
    const mode = getReportMode(req);
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const trainerId = safeStr(req.query.trainer_id);
    const status = safeStr(req.query.status).toLowerCase();
    const q = safeStr(req.query.q);

    // =====================
    // TESDA ATTENDANCE (FULL FIX)
    // =====================
    if (mode === "tesda") {
      try {
        let where = `WHERE 1=1`;
        const params = [];

        // OPTIONAL DATE FILTER (hindi na mawawala data)
        if (req.query.from && req.query.to) {
          where += ` AND a.attendance_date >= ? AND a.attendance_date < ?`;
          params.push(from, to);
        }

        // FILTERS
        if (courseId) {
          where += ` AND a.course_id = ?`;
          params.push(courseId);
        }

        if (trainerId) {
          where += ` AND a.trainer_id = ?`;
          params.push(trainerId);
        }

        if (["present", "late", "absent"].includes(status)) {
          where += ` AND LOWER(a.status) = ?`;
          params.push(status);
        }

        if (q) {
          const like = `%${safeLike(q)}%`;
          where += `
        AND (
          u.fullname LIKE ?
          OR a.course_name LIKE ?
          OR a.course_code LIKE ?
          OR CONCAT_WS(' ', tr.firstname, tr.lastname) LIKE ?
        )
      `;
          params.push(like, like, like, like);
        }

        const [rows] = await pool.execute(
          `
      SELECT
        a.attendance_id,
        a.trainer_id,
        a.student_id,

        -- ✅ FIXED STUDENT NAME
COALESCE(u.fullname, CONCAT('Student #', a.student_id)) AS student_name,
COALESCE(u.fullname, CONCAT('Student #', a.student_id)) AS fullname,

        u.gender,
        u.birthday,

        a.course_id,
        a.course_name,
        a.course_code,

        -- ✅ FIXED TRAINER NAME
        CONCAT_WS(' ', tr.firstname, tr.lastname) AS trainer_name,

        DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date,
        LOWER(a.status) AS status,
        COALESCE(a.remarks, '') AS remarks,

        a.created_at,
        a.updated_at

      FROM tesda_trainer_attendance a
      LEFT JOIN users u ON u.id = a.student_id
      LEFT JOIN trainers tr ON tr.trainer_id = a.trainer_id

      ${where}

      ORDER BY trainer_name ASC, a.attendance_date DESC
      `,
          params,
        );

        // ✅ SUMMARY FIX
        const totalStudents = new Set(rows.map((r) => r.student_id)).size;

        const present = rows.filter((r) => r.status === "present").length;
        const late = rows.filter((r) => r.status === "late").length;
        const absent = rows.filter((r) => r.status === "absent").length;

        const totalRows = rows.length;
        const attendanceRate = totalRows
          ? Math.round(((present + late) / totalRows) * 100)
          : 0;

        // ✅ Fetch the REAL, live trainer assignment(s) for this course
        // from tesda_course_trainers — independent of attendance history.
        let assignedTrainers = [];
        if (courseId) {
          const [trainerRows] = await pool.execute(
            `
                    SELECT
                      tr.trainer_id AS id,
                      CONCAT_WS(' ', tr.firstname, tr.lastname) AS name,
                      tr.status
                    FROM tesda_course_trainers tct
                    JOIN trainers tr ON tr.trainer_id = tct.trainer_id
                    WHERE tct.course_id = ?
                    `,
            [courseId],
          );
          assignedTrainers = trainerRows;
        } else {
          const [trainerRows] = await pool.execute(
            `
                    SELECT
                      tr.trainer_id AS id,
                      CONCAT_WS(' ', tr.firstname, tr.lastname) AS name,
                      tct.course_id,
                      tr.status
                    FROM tesda_course_trainers tct
                    JOIN trainers tr ON tr.trainer_id = tct.trainer_id
                    `,
          );
          assignedTrainers = trainerRows;
        }
        return res.json({
          status: "success",
          data: rows,
          trainers: assignedTrainers,
          summary: {
            totalStudents,
            present,
            late,
            absent,
            totalRows,
            attendanceRate,
          },
          meta: { from, to, mode },
        });
      } catch (err) {
        console.error("TESDA Attendance error:", err);
        return res.status(500).json({
          status: "error",
          message: "TESDA attendance failed",
          debug: err.message,
        });
      }
    }

    // =====================================================
    // DRIVING ATTENDANCE - original behavior retained
    // =====================================================
    const enrolled = enrolledStatuses();

    const params = [from, to, ...enrolled];
    let courseFilter = "";

    if (courseId) {
      courseFilter = " AND s.course_id = ?";
      params.push(courseId);
    }

    const sqlDriving = `
      SELECT
        s.schedule_id,
        DATE(s.schedule_date) AS schedule_date,
        c.course_name,
        COUNT(DISTINCT r.student_id) AS enrolled_count,
        COUNT(DISTINCT a.student_id) AS present_count
      FROM schedules s
      LEFT JOIN courses c
        ON c.id = s.course_id
      LEFT JOIN schedule_reservations r
        ON r.schedule_id = s.schedule_id
       AND r.reservation_status IN (${sqlInPlaceholders(enrolled)})
      LEFT JOIN attendance a
        ON a.schedule_id = s.schedule_id
      WHERE s.schedule_date >= ?
        AND s.schedule_date < ?
        ${courseFilter}
      GROUP BY s.schedule_id, schedule_date, c.course_name
      ORDER BY schedule_date DESC, c.course_name ASC
      LIMIT 500
    `;

    const [rows] = await pool.execute(sqlDriving, params);

    return res.json({
      status: "success",
      data: rows,
      meta: { from, to, mode },
    });
  } catch (err) {
    console.error("getAttendanceReport error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load attendance report",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/reports/revenue-preview?from&to&course_id&payment_method
exports.getRevenuePreview = async (req, res) => {
  try {
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const paymentMethod = safeStr(req.query.payment_method).toUpperCase();

    const dateExpr = `
      COALESCE(sr.done_at, sr.updated_at, sr.created_at)
    `;

    // =====================================================
    // MAIN WHERE
    // Historical + real students
    // Ginagamit ito sa revenue computation
    // =====================================================
    let where = `
      WHERE ${dateExpr} >= ?
        AND ${dateExpr} < ?
        AND ${isDoneConditionSql()}
    `;

    const params = [from, to];

    if (courseId) {
      where += ` AND sr.course_id = ?`;
      params.push(courseId);
    }

    if (paymentMethod === "GCASH" || paymentMethod === "CASH") {
      where += ` AND UPPER(sr.payment_method) = ?`;
      params.push(paymentMethod);
    }

    // =====================================================
    // PAYMENT PREVIEW WHERE
    // Real students ONLY
    // Historical/mock students are hidden here
    // =====================================================
    const previewWhere = `
      ${where}
      AND COALESCE(sr.is_historical, 0) = 0
    `;

    // =====================================================
    // QUERY #1
    // PAYMENT PREVIEW TABLE
    // Historical/mock students are HIDDEN
    // =====================================================
    const [rows] = await pool.execute(
      `
      SELECT
        sr.reservation_id,
        sr.payment_method AS reservation_payment_method,
        sr.reservation_status,
        sr.done_at,

        ${dateExpr} AS sort_date,

        u.fullname,
        c.course_name,

        sps.id AS submission_id,
        sps.payment_ref,
        sps.verified_at AS submission_verified_at,
        sps.created_at AS submission_created_at,

        CASE
          WHEN sps.amount_centavos IS NOT NULL
            THEN ROUND(sps.amount_centavos / 100, 2)
          ELSE COALESCE(c.course_fee, 0)
        END AS amount_peso

      FROM schedule_reservations sr

      LEFT JOIN users u
        ON u.id = sr.student_id

      LEFT JOIN courses c
        ON c.id = sr.course_id

      ${latestSubmissionJoinSql()}

      ${previewWhere}

      ORDER BY sort_date DESC
      LIMIT 500
      `,
      params,
    );

    // =====================================================
    // QUERY #2
    // VERIFIED REVENUE / STATS
    //
    // IMPORTANT:
    // ${where} ang ginagamit dito.
    // HINDI ${previewWhere}.
    //
    // Kaya historical + real data pa rin ang kasama
    // sa revenue computation.
    // =====================================================
    const [statsRows] = await pool.execute(
      `
      SELECT
        COUNT(*) AS verifiedCount,

        COALESCE(
          SUM(
            CASE
              WHEN sps.amount_centavos IS NOT NULL
                THEN ROUND(
                  sps.amount_centavos / 100,
                  2
                )
              ELSE COALESCE(c.course_fee, 0)
            END
          ),
          0
        ) AS totalRevenuePeso

      FROM schedule_reservations sr

      LEFT JOIN users u
        ON u.id = sr.student_id

      LEFT JOIN courses c
        ON c.id = sr.course_id

      ${latestSubmissionJoinSql()}

      ${where}
      `,
      params,
    );

    const verifiedCount = Number(statsRows?.[0]?.verifiedCount || 0);

    const totalRevenuePeso = Number(statsRows?.[0]?.totalRevenuePeso || 0);

    const avgFeePeso = verifiedCount
      ? Math.round(totalRevenuePeso / verifiedCount)
      : 0;

    return res.json({
      status: "success",

      data: {
        // Revenue computation:
        // historical + actual students
        verifiedCount,
        verifiedRevenuePeso: totalRevenuePeso,

        doneCount: verifiedCount,
        totalRevenuePeso,

        avgFeePeso,
        forecastRevenuePeso: 0,

        // Payment Preview:
        // actual students ONLY
        payments: rows.map((p) => ({
          reservation_id: p.reservation_id,
          payment_ref: p.payment_ref || null,
          fullname: p.fullname || null,
          course_name: p.course_name || null,

          payment_method: p.reservation_payment_method || null,

          amount_peso: Number(p.amount_peso || 0),

          status: "DONE",

          verified_at: p.submission_verified_at || null,

          created_at: p.submission_created_at || p.sort_date || null,
        })),
      },
    });
  } catch (err) {
    console.error("getRevenuePreview error:", err);

    return res.status(500).json({
      status: "error",
      message: "Failed to load revenue preview",
      debug: err.sqlMessage || err.message,
    });
  }
};

// ------------------------
// ✅ EXPORT CONTROLLERS
// ------------------------

// GET /api/admin/reports/export/overview?from&to&course_id&format
exports.exportOverview = async (req, res) => {
  try {
    const format = getExportFormat(req);
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const gender = safeStr(req.query.gender).toLowerCase();

    let where = `WHERE sr.created_at >= ? AND sr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND sr.course_id = ?`;
      params.push(courseId);
    }
    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }

    const [[{ totalEnrolled }]] = await pool.execute(
      `
      SELECT COUNT(*) AS totalEnrolled
      FROM schedule_reservations sr
      LEFT JOIN users u ON u.id = sr.student_id
      ${where}
      `,
      params,
    );

    const [popularRows] = await pool.execute(
      `
      SELECT c.course_name AS name, COUNT(*) AS cnt
      FROM schedule_reservations sr
      LEFT JOIN courses c ON c.id = sr.course_id
      LEFT JOIN users u ON u.id = sr.student_id
      ${where}
      GROUP BY sr.course_id
      ORDER BY cnt DESC
      LIMIT 1
      `,
      params,
    );

    const mostPopularCourse = popularRows.length ? popularRows[0].name : "";

    let doneWhere = `WHERE sr.created_at >= ? AND sr.created_at < ? AND ${isDoneConditionSql()}`;
    const doneParams = [from, to];

    if (courseId) {
      doneWhere += ` AND sr.course_id = ?`;
      doneParams.push(courseId);
    }
    if (gender === "male" || gender === "female") {
      doneWhere += ` AND LOWER(u.gender) = ?`;
      doneParams.push(gender);
    }

    const [revRows] = await pool.execute(
      `
      SELECT
        COUNT(*) AS doneCount,
        COALESCE(SUM(
          CASE
            WHEN sps.amount_centavos IS NOT NULL THEN ROUND(sps.amount_centavos / 100, 2)
            ELSE COALESCE(c.course_fee, 0)
          END
        ), 0) AS totalRevenuePeso
      FROM schedule_reservations sr
      LEFT JOIN users u ON u.id = sr.student_id
      LEFT JOIN courses c ON c.id = sr.course_id
      ${latestSubmissionJoinSql()}
      ${doneWhere}
      `,
      doneParams,
    );

    const columns = [
      { header: "Metric", key: "metric", width: 28 },
      { header: "Value", key: "value", width: 40 },
    ];

    const rows = [
      { metric: "From", value: from },
      { metric: "To (exclusive)", value: to },
      { metric: "Course ID", value: courseId || "All" },
      { metric: "Gender", value: gender || "All" },
      { metric: "Total Enrolled", value: safeInt(totalEnrolled, 0) },
      { metric: "Most Popular Course", value: mostPopularCourse || "-" },
      { metric: "Done Count", value: safeInt(revRows?.[0]?.doneCount || 0, 0) },
      {
        metric: "Total Revenue (Peso)",
        value: Number(revRows?.[0]?.totalRevenuePeso || 0),
      },
      { metric: "Completion Rate", value: "0" },
      { metric: "Certificates Issued", value: "0" },
    ];

    if (format === "csv") return exportAsCsv(res, columns, rows, "overview");
    if (format === "pdf") {
      return exportAsPdfSimple(
        res,
        "Overview Export",
        columns,
        rows,
        "overview",
      );
    }
    return await exportAsXlsx(res, "Overview", columns, rows, "overview");
  } catch (err) {
    console.error("exportOverview error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to export overview",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/reports/export/top-courses?from&to&course_id&gender&format
exports.exportTopCourses = async (req, res) => {
  try {
    const format = getExportFormat(req);
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const gender = safeStr(req.query.gender).toLowerCase();

    let where = `WHERE sr.created_at >= ? AND sr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND sr.course_id = ?`;
      params.push(courseId);
    }
    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }

    const [rows] = await pool.execute(
      `
      SELECT c.course_name AS course_name, COUNT(*) AS students
      FROM schedule_reservations sr
      LEFT JOIN courses c ON c.id = sr.course_id
      LEFT JOIN users u ON u.id = sr.student_id
      ${where}
      GROUP BY sr.course_id
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

    if (format === "csv") return exportAsCsv(res, columns, out, "top-courses");
    if (format === "pdf") {
      return exportAsPdfSimple(
        res,
        "Top Courses Export",
        columns,
        out,
        "top-courses",
      );
    }
    return await exportAsXlsx(res, "TopCourses", columns, out, "top-courses");
  } catch (err) {
    console.error("exportTopCourses error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to export top courses",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/reports/export/course-monthly?from&to&course_id&format
exports.exportCourseMonthly = async (req, res) => {
  try {
    const format = getExportFormat(req);
    const { from, to } = getDateRange(req);
    const courseId = safeStr(req.query.course_id);

    let where = `WHERE sr.created_at >= ? AND sr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND sr.course_id = ?`;
      params.push(courseId);
    }

    const [rows] = await pool.execute(
      `
      SELECT
        DATE_FORMAT(sr.created_at, '%Y-%m') AS month_label,
        c.course_name,
        COUNT(*) AS count
      FROM schedule_reservations sr
      LEFT JOIN courses c ON c.id = sr.course_id
      ${where}
      GROUP BY month_label, sr.course_id
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

    if (format === "csv") {
      return exportAsCsv(res, columns, out, "course-monthly");
    }
    if (format === "pdf") {
      return exportAsPdfSimple(
        res,
        "Course Monthly Export",
        columns,
        out,
        "course-monthly",
      );
    }
    return await exportAsXlsx(
      res,
      "CourseMonthly",
      columns,
      out,
      "course-monthly",
    );
  } catch (err) {
    console.error("exportCourseMonthly error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to export course monthly",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/reports/export/revenue?from&to&course_id&payment_method&format
exports.exportRevenue = async (req, res) => {
  try {
    const format = getExportFormat(req);
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const paymentMethod = safeStr(req.query.payment_method).toUpperCase();

    const dateExpr = `COALESCE(sr.done_at, sr.updated_at, sr.created_at)`;

    let where = `WHERE ${dateExpr} >= ? AND ${dateExpr} < ? AND ${isDoneConditionSql()}`;
    const params = [from, to];

    if (courseId) {
      where += ` AND sr.course_id = ?`;
      params.push(courseId);
    }
    if (paymentMethod === "GCASH" || paymentMethod === "CASH") {
      where += ` AND UPPER(sr.payment_method) = ?`;
      params.push(paymentMethod);
    }

    const [rows] = await pool.execute(
      `
      SELECT
        sr.reservation_id,
        ${dateExpr} AS sort_date,
        u.fullname,
        c.course_name,
        sr.payment_method,
        sps.payment_ref,
        sps.verified_at,
        sps.created_at AS submission_created_at,
        CASE
          WHEN sps.amount_centavos IS NOT NULL THEN ROUND(sps.amount_centavos / 100, 2)
          ELSE COALESCE(c.course_fee, 0)
        END AS amount_peso
      FROM schedule_reservations sr
      LEFT JOIN users u ON u.id = sr.student_id
      LEFT JOIN courses c ON c.id = sr.course_id
      ${latestSubmissionJoinSql()}
      ${where}
      ORDER BY sort_date DESC
      LIMIT 5000
      `,
      params,
    );

    const columns = [
      { header: "Reservation ID", key: "reservation_id", width: 14 },
      { header: "Student", key: "fullname", width: 28 },
      { header: "Course", key: "course_name", width: 26 },
      { header: "Method", key: "payment_method", width: 10 },
      { header: "Amount (₱)", key: "amount_peso", width: 12 },
      { header: "Payment Ref", key: "payment_ref", width: 18 },
      { header: "Verified At", key: "verified_at", width: 18 },
      { header: "Date", key: "sort_date", width: 16 },
    ];

    const out = rows.map((r) => ({
      reservation_id: r.reservation_id,
      fullname: r.fullname || "",
      course_name: r.course_name || "",
      payment_method: r.payment_method || "",
      amount_peso: Number(r.amount_peso || 0),
      payment_ref: r.payment_ref || "",
      verified_at: r.verified_at ? toISODate(r.verified_at) : "",
      sort_date: r.sort_date ? toISODate(r.sort_date) : "",
    }));

    if (format === "csv") return exportAsCsv(res, columns, out, "revenue");
    if (format === "pdf") {
      return exportAsPdfSimple(
        res,
        "Revenue Export (DONE)",
        columns,
        out,
        "revenue",
      );
    }
    return await exportAsXlsx(res, "Revenue", columns, out, "revenue");
  } catch (err) {
    console.error("exportRevenue error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to export revenue",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/reports/export/detailed?from&to&course_id&gender&payment_method&status&format
exports.exportDetailed = async (req, res) => {
  try {
    const format = getExportFormat(req);
    const { from, to } = getDateRange(req);

    const courseId = safeStr(req.query.course_id);
    const gender = safeStr(req.query.gender).toLowerCase();
    const paymentMethod = safeStr(req.query.payment_method).toUpperCase();
    const status = safeStr(req.query.status).toLowerCase();
    const q = safeStr(req.query.q);

    let where = `WHERE sr.created_at >= ? AND sr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND sr.course_id = ?`;
      params.push(courseId);
    }
    if (gender === "male" || gender === "female") {
      where += ` AND LOWER(u.gender) = ?`;
      params.push(gender);
    }
    if (paymentMethod === "CASH" || paymentMethod === "GCASH") {
      where += ` AND UPPER(sr.payment_method) = ?`;
      params.push(paymentMethod);
    }
    if (status === "done") where += ` AND ${isDoneConditionSql()}`;
    else if (status === "pending") where += ` AND NOT ${isDoneConditionSql()}`;

    if (q) {
      const like = `%${safeLike(q)}%`;
      where += `
        AND (
          u.fullname LIKE ? OR
          CAST(sr.student_id AS CHAR) LIKE ? OR
          sr.lto_client_id LIKE ? OR
          c.course_name LIKE ? OR
          c.course_code LIKE ? OR
          sps.payment_ref LIKE ?
        )
      `;
      params.push(like, like, like, like, like, like);
    }

    const [rows] = await pool.execute(
      `
      SELECT
        sr.reservation_id,
        sr.schedule_id,
        sr.student_id,
        sr.lto_client_id,
        u.fullname,
        u.gender,
        u.birthday,
        u.nationality,
        u.civil_status,
        u.address,
        c.course_name,
        ${dlCodeExprSql()} AS dl_code,
        i.fullname AS instructor_name,
        sr.training_purpose,
        sr.reservation_source,
        sr.reservation_status,
        CASE WHEN ${isDoneConditionSql()} THEN 'DONE' ELSE 'PENDING' END AS derived_status,
        sr.payment_method,
        sps.payment_ref,
        sps.status AS submission_status,
        sps.verified_at,
        CASE
          WHEN sps.amount_centavos IS NOT NULL THEN ROUND(sps.amount_centavos / 100, 2)
          ELSE COALESCE(c.course_fee, 0)
        END AS amount_peso,
        sr.created_at,
        sr.done_at
      FROM schedule_reservations sr
      LEFT JOIN users u ON u.id = sr.student_id
      LEFT JOIN courses c ON c.id = sr.course_id
      LEFT JOIN schedules s ON s.schedule_id = sr.schedule_id
      LEFT JOIN instructors i ON i.instructor_id = s.instructor_id
      ${latestSubmissionJoinSql()}
      ${where}
      ORDER BY sr.created_at DESC
      LIMIT 10000
      `,
      params,
    );

    const out = rows.map((r) => ({
      reservation_id: r.reservation_id,
      schedule_id: r.schedule_id,
      student_id: r.student_id,
      lto_client_id: r.lto_client_id || "",
      fullname: r.fullname || "",
      gender: r.gender || "",
      birthday: r.birthday ? toISODate(r.birthday) : "",
      nationality: r.nationality || "",
      civil_status: r.civil_status || "",
      address: r.address || "",
      course_name: r.course_name || "",
      dl_code: r.dl_code || "",
      instructor_name: r.instructor_name || "",
      training_purpose: r.training_purpose || "",
      reservation_source: r.reservation_source || "",
      reservation_status: r.reservation_status || "",
      derived_status: r.derived_status || "",
      payment_method: r.payment_method || "",
      payment_ref: r.payment_ref || "",
      submission_status: r.submission_status || "",
      verified_at: r.verified_at ? toISODate(r.verified_at) : "",
      amount_peso: Number(r.amount_peso || 0),
      created_at: r.created_at ? toISODate(r.created_at) : "",
      done_at: r.done_at ? toISODate(r.done_at) : "",
    }));

    // Full columns for Excel / CSV
    const fullColumns = [
      { header: "Reservation ID", key: "reservation_id", width: 14 },
      { header: "Schedule ID", key: "schedule_id", width: 12 },
      { header: "Student ID", key: "student_id", width: 10 },
      { header: "LTO Client ID", key: "lto_client_id", width: 18 },
      { header: "Full Name", key: "fullname", width: 26 },
      { header: "Gender", key: "gender", width: 8 },
      { header: "Birthdate", key: "birthday", width: 12 },
      { header: "Nationality", key: "nationality", width: 14 },
      { header: "Civil Status", key: "civil_status", width: 12 },
      { header: "Address", key: "address", width: 28 },
      { header: "Course", key: "course_name", width: 22 },
      { header: "DL Code", key: "dl_code", width: 10 },
      { header: "Instructor", key: "instructor_name", width: 22 },
      { header: "Training Purpose", key: "training_purpose", width: 22 },
      { header: "Source", key: "reservation_source", width: 10 },
      { header: "Status", key: "reservation_status", width: 12 },
      { header: "Derived", key: "derived_status", width: 10 },
      { header: "Payment Method", key: "payment_method", width: 12 },
      { header: "Payment Ref", key: "payment_ref", width: 18 },
      { header: "Submission Status", key: "submission_status", width: 16 },
      { header: "Verified At", key: "verified_at", width: 14 },
      { header: "Amount (₱)", key: "amount_peso", width: 12 },
      { header: "Created At", key: "created_at", width: 16 },
      { header: "Done At", key: "done_at", width: 16 },
    ];

    // Reduced columns for PDF only
    const pdfColumns = [
      { header: "LTO Client ID", key: "lto_client_id", width: 16 },
      { header: "Full Name", key: "fullname", width: 24 },
      { header: "Course", key: "course_name", width: 22 },
      { header: "Instructor", key: "instructor_name", width: 18 },
      { header: "DL Code", key: "dl_code", width: 9 },
      { header: "Source", key: "reservation_source", width: 10 },
      { header: "Status", key: "derived_status", width: 10 },
      { header: "Payment", key: "payment_method", width: 10 },
      { header: "Amount (₱)", key: "amount_peso", width: 12 },
      { header: "Created At", key: "created_at", width: 14 },
    ];

    if (format === "csv") {
      return exportAsCsv(res, fullColumns, out, "detailed");
    }

    if (format === "pdf") {
      return exportAsPdfSimple(
        res,
        "Detailed Export",
        pdfColumns,
        out,
        "detailed",
      );
    }

    return await exportAsXlsx(res, "Detailed", fullColumns, out, "detailed");
  } catch (err) {
    console.error("exportDetailed error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to export detailed",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/reports/export/all?from&to&course_id&format=xlsx
exports.exportAll = async (req, res) => {
  try {
    const format = getExportFormat(req);
    if (format !== "xlsx") {
      return exports.exportOverview(req, res);
    }

    const { from, to } = getDateRange(req);
    const courseId = safeStr(req.query.course_id);

    let where = `WHERE sr.created_at >= ? AND sr.created_at < ?`;
    const params = [from, to];

    if (courseId) {
      where += ` AND sr.course_id = ?`;
      params.push(courseId);
    }

    const [[{ totalEnrolled }]] = await pool.execute(
      `
      SELECT COUNT(*) AS totalEnrolled
      FROM schedule_reservations sr
      ${where}
      `,
      params,
    );

    const [popularRows] = await pool.execute(
      `
      SELECT c.course_name AS name, COUNT(*) AS cnt
      FROM schedule_reservations sr
      LEFT JOIN courses c ON c.id = sr.course_id
      ${where}
      GROUP BY sr.course_id
      ORDER BY cnt DESC
      LIMIT 1
      `,
      params,
    );
    const mostPopularCourse = popularRows.length ? popularRows[0].name : "";

    let doneWhere = `WHERE sr.created_at >= ? AND sr.created_at < ? AND ${isDoneConditionSql()}`;
    const doneParams = [from, to];

    if (courseId) {
      doneWhere += ` AND sr.course_id = ?`;
      doneParams.push(courseId);
    }

    const [revRows] = await pool.execute(
      `
      SELECT
        COUNT(*) AS doneCount,
        COALESCE(SUM(
          CASE
            WHEN sps.amount_centavos IS NOT NULL THEN ROUND(sps.amount_centavos / 100, 2)
            ELSE COALESCE(c.course_fee, 0)
          END
        ), 0) AS totalRevenuePeso
      FROM schedule_reservations sr
      LEFT JOIN courses c ON c.id = sr.course_id
      ${latestSubmissionJoinSql()}
      ${doneWhere}
      `,
      doneParams,
    );

    const [topRows] = await pool.execute(
      `
      SELECT c.course_name AS course_name, COUNT(*) AS students
      FROM schedule_reservations sr
      LEFT JOIN courses c ON c.id = sr.course_id
      ${where}
      GROUP BY sr.course_id
      ORDER BY students DESC
      LIMIT 50
      `,
      params,
    );

    const [monthlyRows] = await pool.execute(
      `
      SELECT
        DATE_FORMAT(sr.created_at, '%Y-%m') AS month_label,
        c.course_name,
        COUNT(*) AS count
      FROM schedule_reservations sr
      LEFT JOIN courses c ON c.id = sr.course_id
      ${where}
      GROUP BY month_label, sr.course_id
      ORDER BY month_label DESC, count DESC
      `,
      params,
    );

    const dateExpr = `COALESCE(sr.done_at, sr.updated_at, sr.created_at)`;
    let revWhere = `WHERE ${dateExpr} >= ? AND ${dateExpr} < ? AND ${isDoneConditionSql()}`;
    const revParams = [from, to];

    if (courseId) {
      revWhere += ` AND sr.course_id = ?`;
      revParams.push(courseId);
    }

    const [revenueList] = await pool.execute(
      `
      SELECT
        sr.reservation_id,
        ${dateExpr} AS sort_date,
        u.fullname,
        c.course_name,
        sr.payment_method,
        sps.payment_ref,
        sps.verified_at,
        CASE
          WHEN sps.amount_centavos IS NOT NULL THEN ROUND(sps.amount_centavos / 100, 2)
          ELSE COALESCE(c.course_fee, 0)
        END AS amount_peso
      FROM schedule_reservations sr
      LEFT JOIN users u ON u.id = sr.student_id
      LEFT JOIN courses c ON c.id = sr.course_id
      ${latestSubmissionJoinSql()}
      ${revWhere}
      ORDER BY sort_date DESC
      LIMIT 5000
      `,
      revParams,
    );

    const [detailedRows] = await pool.execute(
      `
      SELECT
        sr.reservation_id,
        sr.schedule_id,
        sr.student_id,
        sr.lto_client_id,
        u.fullname,
        u.gender,
        u.birthday,
        u.nationality,
        u.civil_status,
        u.address,
        c.course_name,
        ${dlCodeExprSql()} AS dl_code,
        sr.training_purpose,
        sr.reservation_status,
        CASE WHEN ${isDoneConditionSql()} THEN 'DONE' ELSE 'PENDING' END AS derived_status,
        sr.payment_method,
        sps.payment_ref,
        sps.status AS submission_status,
        sps.verified_at,
        sr.created_at,
        sr.done_at
      FROM schedule_reservations sr
      LEFT JOIN users u ON u.id = sr.student_id
      LEFT JOIN courses c ON c.id = sr.course_id
      ${latestSubmissionJoinSql()}
      ${where}
      ORDER BY sr.created_at DESC
      LIMIT 10000
      `,
      params,
    );

    const wb = new ExcelJS.Workbook();

    const s1 = wb.addWorksheet("Overview");
    s1.columns = [
      { header: "Metric", key: "metric", width: 28 },
      { header: "Value", key: "value", width: 40 },
    ];
    s1.addRows([
      { metric: "From", value: from },
      { metric: "To (exclusive)", value: to },
      { metric: "Course ID", value: courseId || "All" },
      { metric: "Total Enrolled", value: safeInt(totalEnrolled, 0) },
      { metric: "Most Popular Course", value: mostPopularCourse || "-" },
      { metric: "Done Count", value: safeInt(revRows?.[0]?.doneCount || 0, 0) },
      {
        metric: "Total Revenue (Peso)",
        value: Number(revRows?.[0]?.totalRevenuePeso || 0),
      },
    ]);
    s1.getRow(1).font = { bold: true };
    s1.views = [{ state: "frozen", ySplit: 1 }];

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

    const s4 = wb.addWorksheet("Revenue");
    s4.columns = [
      { header: "Reservation ID", key: "reservation_id", width: 14 },
      { header: "Student", key: "fullname", width: 28 },
      { header: "Course", key: "course_name", width: 26 },
      { header: "Method", key: "payment_method", width: 10 },
      { header: "Amount (₱)", key: "amount_peso", width: 12 },
      { header: "Payment Ref", key: "payment_ref", width: 18 },
      { header: "Verified At", key: "verified_at", width: 18 },
      { header: "Date", key: "sort_date", width: 16 },
    ];
    s4.addRows(
      revenueList.map((r) => ({
        reservation_id: r.reservation_id,
        fullname: r.fullname || "",
        course_name: r.course_name || "",
        payment_method: r.payment_method || "",
        amount_peso: Number(r.amount_peso || 0),
        payment_ref: r.payment_ref || "",
        verified_at: r.verified_at ? toISODate(r.verified_at) : "",
        sort_date: r.sort_date ? toISODate(r.sort_date) : "",
      })),
    );
    s4.getRow(1).font = { bold: true };
    s4.views = [{ state: "frozen", ySplit: 1 }];

    const s5 = wb.addWorksheet("Detailed");
    s5.columns = [
      { header: "Reservation ID", key: "reservation_id", width: 14 },
      { header: "Schedule ID", key: "schedule_id", width: 12 },
      { header: "Student ID", key: "student_id", width: 10 },
      { header: "LTO Client ID", key: "lto_client_id", width: 18 },
      { header: "Full Name", key: "fullname", width: 26 },
      { header: "Gender", key: "gender", width: 8 },
      { header: "Birthdate", key: "birthday", width: 12 },
      { header: "Nationality", key: "nationality", width: 14 },
      { header: "Civil Status", key: "civil_status", width: 12 },
      { header: "Address", key: "address", width: 28 },
      { header: "Course", key: "course_name", width: 22 },
      { header: "DL Code", key: "dl_code", width: 10 },
      { header: "Training Purpose", key: "training_purpose", width: 22 },
      { header: "Status", key: "reservation_status", width: 12 },
      { header: "Derived", key: "derived_status", width: 10 },
      { header: "Payment Method", key: "payment_method", width: 12 },
      { header: "Payment Ref", key: "payment_ref", width: 18 },
      { header: "Submission Status", key: "submission_status", width: 16 },
      { header: "Verified At", key: "verified_at", width: 14 },
      { header: "Created At", key: "created_at", width: 16 },
      { header: "Done At", key: "done_at", width: 16 },
    ];
    s5.addRows(
      detailedRows.map((r) => ({
        reservation_id: r.reservation_id,
        schedule_id: r.schedule_id,
        student_id: r.student_id,
        lto_client_id: r.lto_client_id || "",
        fullname: r.fullname || "",
        gender: r.gender || "",
        birthday: r.birthday ? toISODate(r.birthday) : "",
        nationality: r.nationality || "",
        civil_status: r.civil_status || "",
        address: r.address || "",
        course_name: r.course_name || "",
        dl_code: r.dl_code || "",
        training_purpose: r.training_purpose || "",
        reservation_status: r.reservation_status || "",
        derived_status: r.derived_status || "",
        payment_method: r.payment_method || "",
        payment_ref: r.payment_ref || "",
        submission_status: r.submission_status || "",
        verified_at: r.verified_at ? toISODate(r.verified_at) : "",
        created_at: r.created_at ? toISODate(r.created_at) : "",
        done_at: r.done_at ? toISODate(r.done_at) : "",
      })),
    );
    s5.getRow(1).font = { bold: true };
    s5.views = [{ state: "frozen", ySplit: 1 }];

    setDownloadHeaders(
      res,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      makeFileName("reports-all", "xlsx"),
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("exportAll error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to export all",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET /api/admin/reports/certificates-summary?month=2025-10
exports.getIssuedCertificatesSummary = async (req, res) => {
  try {
    const monthInput = safeStr(req.query.month);

    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthInput)
      ? monthInput
      : defaultMonth;

    const [year, m] = month.split("-").map(Number);
    const from = `${year}-${String(m).padStart(2, "0")}-01`;
    const nextYear = m === 12 ? year + 1 : year;
    const nextMonth = m === 12 ? 1 : m + 1;
    const to = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const monthLabel = new Date(year, m - 1, 1)
      .toLocaleDateString("en-US", { month: "long", year: "numeric" })
      .toUpperCase();

    const report = {
      month,
      monthLabel,
      tdcTotal: 0,
      pdcTotal: 0,
      tdc: {
        sex: { Male: 0, Female: 0 },
      },
      pdc: {
        sex: { Male: 0, Female: 0 },
      },
      trainingPurposeRows: [
        { label: "Application for new Driver's License", count: 0 },
        { label: "Application for Additional DL Code", count: 0 },
      ],
      dlCodeRows: [
        { label: "A", count: 0 },
        { label: "A1", count: 0 },
        { label: "B", count: 0 },
        { label: "B1", count: 0 },
        { label: "B2", count: 0 },
        { label: "BE", count: 0 },
        { label: "C", count: 0 },
        { label: "D", count: 0 },
        { label: "CE", count: 0 },
      ],
      dlCodeTotal: 0,
    };

    const [rows] = await pool.execute(
      `
      SELECT
        cert.certificate_id,
        cert.issued_at,

        sr.training_purpose,

        u.gender,

        c.course_name,
        c.course_code,

        CASE
          WHEN c.course_code LIKE 'PDC-%' THEN SUBSTRING_INDEX(c.course_code, '-', -1)
          ELSE c.course_code
        END AS dl_code
      FROM certificates cert
      JOIN schedule_reservations sr
        ON sr.reservation_id = cert.reservation_id
      LEFT JOIN users u
        ON u.id = sr.student_id
      LEFT JOIN courses c
        ON c.id = sr.course_id
      WHERE cert.certificate_type = 'DRIVING'
        AND cert.status = 'issued'
        AND cert.issued_at >= ?
        AND cert.issued_at < ?
      ORDER BY cert.issued_at DESC
      `,
      [from, to],
    );

    const purposeMap = new Map(
      report.trainingPurposeRows.map((row) => [row.label, row]),
    );

    const dlMap = new Map(report.dlCodeRows.map((row) => [row.label, row]));

    function normalizeGenderLocal(gender) {
      const s = String(gender || "")
        .trim()
        .toLowerCase();
      if (s === "male" || s === "m") return "Male";
      if (s === "female" || s === "f") return "Female";
      return "";
    }

    function isTdc(courseCode, courseName) {
      const text = `${courseCode || ""} ${courseName || ""}`.toUpperCase();
      return text.includes("TDC") || text.includes("THEORETICAL");
    }

    function isPdc(courseCode, courseName) {
      const text = `${courseCode || ""} ${courseName || ""}`.toUpperCase();
      return text.includes("PDC") || text.includes("PRACTICAL");
    }

    function normalizePurposeLocal(v) {
      const s = String(v || "").trim();
      if (!s) return "Unspecified";

      const up = s.toUpperCase();
      if (up.includes("NEW")) return "Application for new Driver's License";
      if (up.includes("ADDITIONAL"))
        return "Application for Additional DL Code";

      return s;
    }

    function parseDlCodes(row) {
      const text =
        `${row.course_code || ""} ${row.course_name || ""} ${row.dl_code || ""}`.toUpperCase();
      const codes = new Set();

      if (/\bAB\b/.test(text) || /PDC\s*[-(]?\s*AB\b/.test(text)) {
        codes.add("A");
        codes.add("B");
      }

      const allCodes = ["A1", "B1", "B2", "BE", "CE", "A", "B", "C", "D"];
      for (const code of allCodes) {
        const re = new RegExp(`\\b${code}\\b`, "i");
        if (re.test(text)) codes.add(code);
      }

      return Array.from(codes);
    }

    for (const row of rows) {
      const gender = normalizeGenderLocal(row.gender);
      const rowIsTdc = isTdc(row.course_code, row.course_name);
      const rowIsPdc = isPdc(row.course_code, row.course_name);

      if (rowIsTdc && !rowIsPdc) {
        report.tdcTotal += 1;

        if (gender && report.tdc.sex[gender] !== undefined) {
          report.tdc.sex[gender] += 1;
        }

        continue;
      }

      report.pdcTotal += 1;

      if (gender && report.pdc.sex[gender] !== undefined) {
        report.pdc.sex[gender] += 1;
      }

      const purpose = normalizePurposeLocal(row.training_purpose);

      if (!purposeMap.has(purpose)) {
        const newRow = { label: purpose, count: 0 };
        report.trainingPurposeRows.push(newRow);
        purposeMap.set(purpose, newRow);
      }

      purposeMap.get(purpose).count += 1;

      const dlCodes = parseDlCodes(row);

      for (const code of dlCodes) {
        if (!dlMap.has(code)) {
          const newRow = { label: code, count: 0 };
          report.dlCodeRows.push(newRow);
          dlMap.set(code, newRow);
        }

        dlMap.get(code).count += 1;
      }
    }

    report.dlCodeTotal = report.dlCodeRows.reduce(
      (sum, row) => sum + safeInt(row.count, 0),
      0,
    );

    return res.json({
      status: "success",
      data: report,
    });
  } catch (err) {
    console.error("getIssuedCertificatesSummary error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load issued certificates summary",
      debug: err.sqlMessage || err.message,
    });
  }
};

// ========================================
// FORECAST (DRIVING ONLY) — ML-powered
// GET /api/admin/reports/forecast
// ========================================
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

exports.getForecastBacktest = async (req, res) => {
  try {
    const mode = String(req.query.report_mode || "driving").toLowerCase();

    if (mode === "tesda") {
      return res.json({
        status: "success",
        data: [],
      });
    }

    const [rows] = await pool.execute(`
      SELECT
        DATE_FORMAT(sr.created_at, '%Y-%m') AS month,
        c.course_name,
        COUNT(*) AS total
      FROM schedule_reservations sr
      LEFT JOIN courses c ON c.id = sr.course_id
      WHERE sr.created_at >= DATE_SUB(CURDATE(), INTERVAL 26 MONTH)
        AND sr.created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
      GROUP BY month, sr.course_id, c.course_name
      ORDER BY month ASC
    `);

    const months = [];

    const start = new Date();
    start.setMonth(start.getMonth() - 26);
    start.setDate(1);

    const current = new Date();

    const end = new Date(current.getFullYear(), current.getMonth() - 1, 1);

    let cursor = new Date(start);

    while (cursor <= end) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, "0");

      months.push(`${year}-${month}`);

      cursor.setMonth(cursor.getMonth() + 1);
    }

    const courseMap = {};

    rows.forEach((r) => {
      const course = r.course_name || "Unspecified Course";

      if (!courseMap[course]) {
        courseMap[course] = {};
      }

      courseMap[course][r.month] = Number(r.total || 0);
    });

    const courseNames = Object.keys(courseMap);

    const result = await Promise.all(
      courseNames.map(async (course) => {
        const monthly = courseMap[course];

        const values = months.map((month) => {
          return Number(monthly[month] || 0);
        });

        try {
          const resp = await fetch(`${ML_SERVICE_URL}/backtest`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              course,
              values,
              periods_ahead: 1,
            }),
          });

          const data = await resp.json();

          if (!resp.ok) {
            throw new Error(data?.detail || data?.error || "Backtest failed");
          }

          return data;
        } catch (err) {
          console.error(`Backtest failed for ${course}:`, err.message);

          const actual = values[values.length - 1] || 0;

          return {
            course,
            actual,
            predicted: 0,
            absolute_error: actual,
            percent_error: actual > 0 ? 100 : 0,
            model_used: "Fallback",
          };
        }
      }),
    );

    return res.json({
      status: "success",
      data: result,
    });
  } catch (err) {
    console.error("getForecastBacktest error:", err);

    return res.status(500).json({
      status: "error",
      message: "Failed to run backtest",
      debug: err.message,
    });
  }
};

exports.getPromoFlags = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT month, has_promo FROM enrollment_promos WHERE course_id = 0 ORDER BY month ASC`,
    );
    const map = {};
    rows.forEach((r) => {
      map[r.month] = !!r.has_promo;
    });
    return res.json({ status: "success", data: map });
  } catch (err) {
    console.error("getPromoFlags error:", err);
    return res
      .status(500)
      .json({
        status: "error",
        message: "Failed to load promo flags",
        debug: err.sqlMessage || err.message,
      });
  }
};

exports.setPromoFlag = async (req, res) => {
  try {
    const month = safeStr(req.body.month);
    const hasPromo = req.body.has_promo ? 1 : 0;

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Invalid month format. Expected YYYY-MM.",
        });
    }

    const setBy = req.user?.id || null;

    await pool.execute(
      `INSERT INTO enrollment_promos (month, course_id, has_promo, set_by)
       VALUES (?, 0, ?, ?)
       ON DUPLICATE KEY UPDATE has_promo = VALUES(has_promo), set_by = VALUES(set_by)`,
      [month, hasPromo, setBy],
    );

    return res.json({
      status: "success",
      data: { month, has_promo: !!hasPromo },
    });
  } catch (err) {
    console.error("setPromoFlag error:", err);
    return res
      .status(500)
      .json({
        status: "error",
        message: "Failed to save promo flag",
        debug: err.sqlMessage || err.message,
      });
  }
};

exports.getForecast = async (req, res) => {
  try {
    const mode = String(req.query.report_mode || "driving").toLowerCase();

    if (mode === "tesda") {
      return res.json({
        status: "success",
        data: { message: "Forecast not available for TESDA" },
      });
    }

    const [rows] = await pool.execute(`
      SELECT 
        DATE_FORMAT(sr.created_at, '%Y-%m') AS month,
        c.course_name,
        COUNT(*) AS total
      FROM schedule_reservations sr
      LEFT JOIN courses c ON c.id = sr.course_id
      WHERE sr.created_at >= '2024-01-01'
      GROUP BY month, sr.course_id
      ORDER BY month ASC
    `);

    const [promoRows] = await pool.execute(
      `SELECT month, has_promo FROM enrollment_promos WHERE course_id = 0`,
    );
    const promoMap = {};
    promoRows.forEach((r) => {
      promoMap[r.month] = !!r.has_promo;
    });

    const now = new Date();
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthKey = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

    // ✅ "Preview" mode: kung may ipinasang ?preview_promo=1 o ?preview_promo=0,
    // gamitin ito PANSAMANTALA lang para sa computation na ito — hindi ito
    // sinusulat sa DB. Ginagamit ito para makapag-"what if" ang admin nang
    // hindi permanenteng nababago ang training data.
    const hasPreviewOverride =
      req.query.preview_promo === "0" || req.query.preview_promo === "1";
    const nextMonthHasPromo = hasPreviewOverride
      ? Number(req.query.preview_promo)
      : promoMap[nextMonthKey]
        ? 1
        : 0;

    const courseMap = {};
    const monthsSeen = new Set();
    rows.forEach((r) => {
      if (!courseMap[r.course_name]) courseMap[r.course_name] = {};
      courseMap[r.course_name][r.month] = Number(r.total);
      monthsSeen.add(r.month);
    });

    const courseNames = Object.keys(courseMap);

    const MIN_PROMO_SAMPLES = 3;
    const PROMO_UPLIFT_MULTIPLIER = 1.25;
    const HORIZON = 3; // ✅ NEW: 3-buwan na forecast, hindi lang 1

    const result = await Promise.all(
      courseNames.map(async (course) => {
        const months = Array.from(monthsSeen).sort();
        const values = months.map((m) => Number(courseMap[course][m] || 0));

        const promoHistory = months.map((m) => (promoMap[m] ? 1 : 0));
        const promoMonthCount = promoHistory.filter((v) => v === 1).length;
        const hasEnoughPromoData = promoMonthCount >= MIN_PROMO_SAMPLES;

        let mlResult;

        try {
          const resp = await fetch(`${ML_SERVICE_URL}/forecast`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course,
              values,
              periods_ahead: HORIZON,
              // ✅ Alam lang natin ang promo status ng SUSUNOD na buwan
              // (buwan 1) — walang alam para sa buwan 2 at 3, kaya 0
              // (walang promo) ang i-assume doon bilang ligtas na default.
              ...(hasEnoughPromoData
                ? {
                    promo_history: promoHistory,
                    promo_future: [nextMonthHasPromo, 0, 0],
                  }
                : {}),
            }),
          });
          mlResult = await resp.json();

          // ✅ Manual multiplier fallback — ilapat lang sa BUWAN 1 (index 0),
          // dahil doon lang tayo may kumpirmadong impormasyon ng promo.
          if (!hasEnoughPromoData && nextMonthHasPromo) {
            const points = Array.isArray(mlResult.points)
              ? [...mlResult.points]
              : [mlResult.point, mlResult.point, mlResult.point];
            const lows = Array.isArray(mlResult.lows)
              ? [...mlResult.lows]
              : [mlResult.low, mlResult.low, mlResult.low];
            const highs = Array.isArray(mlResult.highs)
              ? [...mlResult.highs]
              : [mlResult.high, mlResult.high, mlResult.high];

            points[0] = Math.round(points[0] * PROMO_UPLIFT_MULTIPLIER);
            lows[0] = Math.round(lows[0] * PROMO_UPLIFT_MULTIPLIER);
            highs[0] = Math.round(highs[0] * PROMO_UPLIFT_MULTIPLIER * 1.1);

            mlResult = {
              ...mlResult,
              point: points[0],
              low: lows[0],
              high: highs[0],
              points,
              lows,
              highs,
              model_used: `${mlResult.model_used} + Manual Promo Uplift (x${PROMO_UPLIFT_MULTIPLIER}, Month 1 only)`,
            };
          }
        } catch (mlErr) {
          console.error("ML service unreachable:", mlErr.message);
          const avg = values.length
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;
          const fallbackPoint = Math.round(avg);
          mlResult = {
            point: fallbackPoint,
            low: Math.round(avg * 0.7),
            high: Math.round(avg * 1.3),
            points: [fallbackPoint, fallbackPoint, fallbackPoint],
            lows: [
              Math.round(avg * 0.7),
              Math.round(avg * 0.7),
              Math.round(avg * 0.7),
            ],
            highs: [
              Math.round(avg * 1.3),
              Math.round(avg * 1.3),
              Math.round(avg * 1.3),
            ],
            model_used: "Fallback Average",
          };
        }

        const last3 = values.slice(-3);
        const m1 = last3[last3.length - 1] || 0;
        const m2 = last3[last3.length - 2] || 0;
        const m3 = last3[last3.length - 3] || 0;

        let trend = "Stable";
        if (m1 > m2) trend = "Increasing";
        else if (m1 < m2) trend = "Decreasing";

        return {
          course,
          m1,
          m2,
          m3,
          forecast: mlResult.point,
          low: mlResult.low,
          high: mlResult.high,
          // ✅ NEW: totoong per-month na forecast, para sa Multi-Horizon
          // at Revenue Forecast charts sa frontend.
          multiPoints: mlResult.points || [
            mlResult.point,
            mlResult.point,
            mlResult.point,
          ],
          multiLows: mlResult.lows || [
            mlResult.low,
            mlResult.low,
            mlResult.low,
          ],
          multiHighs: mlResult.highs || [
            mlResult.high,
            mlResult.high,
            mlResult.high,
          ],
          trend,
          model_used: mlResult.model_used,
          dataPoints: values.length,
          promoAppliedNextMonth: !!nextMonthHasPromo,
          promoHistoricalSamples: promoMonthCount,
          explanation:
            trend === "Increasing"
              ? "Enrollment trend is increasing based on recent months."
              : trend === "Decreasing"
                ? "Enrollment trend is decreasing based on recent months."
                : "Enrollment is stable.",
        };
      }),
    );

    return res.json({
      status: "success",
      data: result,
      meta: {
        nextMonth: nextMonthKey,
        nextMonthHasPromo: !!nextMonthHasPromo,
      },
    });
  } catch (err) {
    console.error("getForecast error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load forecast",
      debug: err.message,
    });
  }
};
