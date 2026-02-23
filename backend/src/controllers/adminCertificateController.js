const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const pool = require("../config/database");

function makeCertCode() {
  const y = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CERT-${y}-${rand}`;
}

function ensureDir(absDir) {
  if (!fs.existsSync(absDir)) fs.mkdirSync(absDir, { recursive: true });
}

function toRelUploadsPath(filename) {
  return path.join("uploads", "certificates", filename).replace(/\\/g, "/");
}

function fileExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function safeDate(d) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function fmtDate(d) {
  const dt = safeDate(d);
  if (!dt) return "—";
  return dt.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

function computeAge(birthday) {
  const b = safeDate(birthday);
  if (!b) return "—";
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

function normalizeSex(g) {
  const s = String(g || "")
    .trim()
    .toLowerCase();
  if (s === "male" || s === "m") return "MALE";
  if (s === "female" || s === "f") return "FEMALE";
  return s ? s.toUpperCase() : "—";
}

function drawBorder(doc, x, y, w, h) {
  doc.save().lineWidth(1.2).rect(x, y, w, h).stroke("#1f2937").restore();
}

function drawSectionHeader(doc, x, y, w, title) {
  doc.save().fillColor("#e5e7eb").rect(x, y, w, 22).fill().restore();

  doc
    .save()
    .fillColor("#111827")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(title, x + 10, y + 6, { width: w - 20 })
    .restore();
}

/**
 * generatePdf: LTO-style layout, FACET branding
 * - no photo
 * - no QR
 * - has watermark background (seal.png if exists)
 * Assets:
 * - backend/assets/logo.png  (FACET logo)
 * - backend/assets/seal.png  (FACET watermark/seal) optional
 */
async function generatePdf({
  certificate_id,
  certificate_code,
  student_name,
  student_email, // optional (pwede mo tanggalin sa details list kung ayaw mo)
  course_name,
  issued_at,
  done_at,
  lto_client_id,
  birthday,
  gender,
}) {
  const uploadsDir = path.join(process.cwd(), "uploads", "certificates");
  ensureDir(uploadsDir);

  const filename = `${certificate_code}.pdf`;
  const absFilepath = path.join(uploadsDir, filename);

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const stream = fs.createWriteStream(absFilepath);

  doc.pipe(stream);

  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // assets
  const logoAbs = path.join(process.cwd(), "assets", "logo.png");
  const sealAbs = path.join(process.cwd(), "assets", "seal.png");

  // outer border (LTO-ish)
  drawBorder(doc, 25, 25, pageW - 50, pageH - 50);

  // watermark seal (center, light)
  if (fileExists(sealAbs)) {
    const wmSize = 380;
    const wmX = (pageW - wmSize) / 2;
    const wmY = (pageH - wmSize) / 2 + 20;

    doc.save();
    doc.opacity(0.08);
    doc.image(sealAbs, wmX, wmY, { width: wmSize, height: wmSize });
    doc.opacity(1);
    doc.restore();
  }

  // Header top
  const headerTop = 40;
  const headerLeft = 40;

  // FACET logo (left)
  if (fileExists(logoAbs)) {
    doc.image(logoAbs, headerLeft, headerTop, { width: 62, height: 62 });
  } else {
    doc
      .save()
      .rect(headerLeft, headerTop, 62, 62)
      .stroke("#9ca3af")
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#6b7280")
      .text("LOGO", headerLeft, headerTop + 27, { width: 62, align: "center" })
      .restore();
  }

  // Center header text (FACET, LTO-style spacing)
  doc
    .save()
    .fillColor("#111827")
    .font("Helvetica")
    .fontSize(10)
    .text("Republic of the Philippines", 0, headerTop + 2, { align: "center" })
    .text("DEPARTMENT OF TRANSPORTATION", { align: "center" })
    .font("Helvetica-Bold")
    .text("LAND TRANSPORTATION OFFICE", { align: "center" })
    .font("Helvetica")
    .fontSize(9)
    .text("E-FACET Accredited Training Partner", { align: "center" })
    .restore();

  // Big Title
  doc
    .save()
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#111827")
    .text("CERTIFICATE OF COMPLETION", 0, headerTop + 82, { align: "center" })
    .fontSize(12)
    .text(String(course_name || "DRIVING COURSE").toUpperCase(), {
      align: "center",
    })
    .restore();

  // content blocks
  let y = headerTop + 122;

  const boxX = 40;
  const boxW = pageW - 80;

  // ============ Student Driver's Details (NO PHOTO) ============
  const box1H = 170;

  drawSectionHeader(doc, boxX, y, boxW, "Student Driver's Details");

  doc
    .save()
    .rect(boxX, y + 22, boxW, box1H - 22)
    .stroke("#d1d5db")
    .restore();

  const pad = 12;
  const textX = boxX + pad;
  const textY = y + 22 + pad;
  const lineGap = 16;

  const issuedStr = fmtDate(issued_at);
  const doneStr = done_at ? fmtDate(done_at) : "—";
  const sex = normalizeSex(gender);
  const bdayStr = fmtDate(birthday);
  const age = computeAge(birthday);

  // LTO-like detail rows (fields galing DB)
  const details = [
    ["LTO Client ID", lto_client_id || "—"],
    ["Name", student_name || "—"],
    ["Date of Birth", bdayStr],
    ["Age", String(age)],
    ["Sex", sex],
    // optional email (comment out if ayaw mo)
    ["Email", student_email || "—"],
  ];

  doc.save().fillColor("#111827").font("Helvetica").fontSize(10);

  let ty = textY;
  details.forEach(([k, v]) => {
    doc
      .font("Helvetica-Bold")
      .text(`${k}:`, textX, ty, { width: 120 })
      .font("Helvetica")
      .text(String(v), textX + 130, ty, { width: boxW - 130 - pad * 2 });
    ty += lineGap;
  });

  doc.restore();

  // ============ Training Info ============
  y = y + box1H + 18;
  const box2H = 120;

  drawSectionHeader(doc, boxX, y, boxW, "Driving Course Training Information");

  doc
    .save()
    .rect(boxX, y + 22, boxW, box2H - 22)
    .stroke("#d1d5db")
    .restore();

  const tX = boxX + 12;
  const tY = y + 22 + 12;

  doc.save().fillColor("#111827").fontSize(10);

  doc.font("Helvetica-Bold").text("Course:", tX, tY, { width: 120 });
  doc.font("Helvetica").text(course_name || "—", tX + 130, tY, {
    width: boxW - 160,
  });

  doc
    .font("Helvetica-Bold")
    .text("Learning Mode:", tX, tY + 18, { width: 120 });
  doc.font("Helvetica").text("FACE TO FACE", tX + 130, tY + 18);

  doc
    .font("Helvetica-Bold")
    .text("Date Completed:", tX, tY + 36, { width: 120 });
  doc.font("Helvetica").text(doneStr, tX + 130, tY + 36);

  doc.font("Helvetica-Bold").text("Issued Date:", tX, tY + 54, { width: 120 });
  doc.font("Helvetica").text(issuedStr, tX + 130, tY + 54);

  doc.restore();

  // Footer statement (no QR)
  const footerY = pageH - 165;

  doc.save();
  doc.fillColor("#111827").font("Helvetica").fontSize(9);
  doc.text(
    `This certificate with control number ${certificate_code} has been issued as proof of completion under the E-FACET Enrollment Portal.`,
    boxX,
    footerY,
    { width: boxW, align: "center" },
  );
  doc.restore();

  // Signature lines (LTO-ish)
  const sigY = pageH - 100;

  doc.save();
  doc.strokeColor("#9ca3af").lineWidth(1);
  doc.moveTo(70, sigY).lineTo(245, sigY).stroke();
  doc.moveTo(295, sigY).lineTo(470, sigY).stroke();
  doc.restore();

  doc.save();
  doc.fillColor("#374151").font("Helvetica").fontSize(8);
  doc.text("Authorized Representative", 70, sigY + 6, {
    width: 175,
    align: "center",
  });
  doc.text("Training Institute", 295, sigY + 6, {
    width: 175,
    align: "center",
  });
  doc.restore();

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);
  });

  return toRelUploadsPath(filename);
}

// ✅ GET: list DONE schedule_reservations + certificate info
exports.listCompletions = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        r.reservation_id,
        r.schedule_id,
        r.student_id,
        r.course_id,
        r.lto_client_id,
        r.reservation_status,
        r.done_at,
        r.updated_at,

        u.fullname AS student_name,
        u.email AS student_email,
        u.birthday AS birthday,
        u.gender AS gender,

        c.course_name,

        cert.certificate_id,
        cert.certificate_code,
        cert.status AS certificate_status,
        cert.issued_at
      FROM schedule_reservations r
      JOIN users u ON u.id = r.student_id
      JOIN courses c ON c.id = r.course_id
      LEFT JOIN certificates cert ON cert.reservation_id = r.reservation_id
      WHERE r.reservation_status = 'DONE'
        AND u.role = 'user'
      ORDER BY COALESCE(r.done_at, r.updated_at) DESC
    `);

    const mapped = rows.map((r) => {
      let ui_status = "ready";
      if (r.certificate_id && r.certificate_status === "issued")
        ui_status = "issued";
      if (r.certificate_id && r.certificate_status === "revoked")
        ui_status = "revoked";

      return {
        ...r,
        age: computeAge(r.birthday),
        sex: normalizeSex(r.gender),
        ui_status,
      };
    });

    return res.json({ status: "success", data: mapped });
  } catch (err) {
    console.error("listCompletions error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load completed students",
      debug: err.sqlMessage || err.message,
    });
  }
};

// ✅ POST: generate certificate (only if reservation_status = DONE)
exports.generate = async (req, res) => {
  try {
    const { reservation_id } = req.body;
    if (!reservation_id) {
      return res
        .status(400)
        .json({ status: "error", message: "reservation_id is required" });
    }

    const [rRows] = await pool.execute(
      `
      SELECT
        r.reservation_id,
        r.reservation_status,
        r.done_at,
        r.lto_client_id,
        u.fullname AS student_name,
        u.email AS student_email,
        u.birthday AS birthday,
        u.gender AS gender,
        c.course_name
      FROM schedule_reservations r
      JOIN users u ON u.id = r.student_id
      JOIN courses c ON c.id = r.course_id
      WHERE r.reservation_id = ?
      LIMIT 1
      `,
      [reservation_id],
    );

    if (!rRows.length) {
      return res
        .status(404)
        .json({ status: "error", message: "Reservation not found" });
    }

    const r = rRows[0];

    if (r.reservation_status !== "DONE") {
      return res
        .status(400)
        .json({ status: "error", message: "Student is not DONE yet." });
    }

    const [existing] = await pool.execute(
      `SELECT certificate_id FROM certificates WHERE reservation_id = ? LIMIT 1`,
      [reservation_id],
    );
    if (existing.length) {
      return res.status(409).json({
        status: "error",
        message: "Certificate already exists for this reservation.",
      });
    }

    const certificate_code = makeCertCode();
    const issued_at = new Date();

    const [ins] = await pool.execute(
      `INSERT INTO certificates (reservation_id, certificate_code, issued_at, status)
       VALUES (?, ?, ?, 'issued')`,
      [reservation_id, certificate_code, issued_at],
    );

    const certificate_id = ins.insertId;

    const pdf_path = await generatePdf({
      certificate_id,
      certificate_code,
      student_name: r.student_name,
      student_email: r.student_email,
      course_name: r.course_name || "Course",
      issued_at,
      done_at: r.done_at,
      lto_client_id: r.lto_client_id,
      birthday: r.birthday,
      gender: r.gender,
    });

    await pool.execute(
      `UPDATE certificates SET pdf_path = ? WHERE certificate_id = ?`,
      [pdf_path, certificate_id],
    );

    return res.json({
      status: "success",
      message: "Certificate generated",
      data: { certificate_id, certificate_code, pdf_path },
    });
  } catch (err) {
    console.error("generate error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to generate certificate",
      debug: err.sqlMessage || err.message,
    });
  }
};

exports.viewPdf = async (req, res) => {
  try {
    const certId = req.params.id;

    const [rows] = await pool.execute(
      `SELECT pdf_path, certificate_code FROM certificates WHERE certificate_id = ? LIMIT 1`,
      [certId],
    );

    if (!rows.length || !rows[0].pdf_path) {
      return res
        .status(404)
        .json({ status: "error", message: "PDF not found" });
    }

    const abs = path.join(process.cwd(), rows[0].pdf_path);
    if (!fs.existsSync(abs)) {
      return res
        .status(404)
        .json({ status: "error", message: "PDF file missing on server" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${rows[0].certificate_code}.pdf"`,
    );
    fs.createReadStream(abs).pipe(res);
  } catch (err) {
    console.error("viewPdf error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to open PDF" });
  }
};

exports.downloadPdf = async (req, res) => {
  try {
    const certId = req.params.id;

    const [rows] = await pool.execute(
      `SELECT pdf_path, certificate_code FROM certificates WHERE certificate_id = ? LIMIT 1`,
      [certId],
    );

    if (!rows.length || !rows[0].pdf_path) {
      return res
        .status(404)
        .json({ status: "error", message: "PDF not found" });
    }

    const abs = path.join(process.cwd(), rows[0].pdf_path);
    if (!fs.existsSync(abs)) {
      return res
        .status(404)
        .json({ status: "error", message: "PDF file missing on server" });
    }

    return res.download(abs, `${rows[0].certificate_code}.pdf`);
  } catch (err) {
    console.error("downloadPdf error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to download PDF" });
  }
};

exports.revoke = async (req, res) => {
  try {
    const certId = req.params.id;

    const [rows] = await pool.execute(
      `SELECT certificate_id, status FROM certificates WHERE certificate_id = ? LIMIT 1`,
      [certId],
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ status: "error", message: "Certificate not found" });
    }

    if (rows[0].status === "revoked") {
      return res.json({ status: "success", message: "Already revoked" });
    }

    await pool.execute(
      `UPDATE certificates SET status='revoked' WHERE certificate_id = ?`,
      [certId],
    );

    return res.json({ status: "success", message: "Certificate revoked" });
  } catch (err) {
    console.error("revoke error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to revoke certificate" });
  }
};
