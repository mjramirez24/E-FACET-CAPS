const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const pool = require("../config/database");

// QR generator (npm i qrcode)
let QRCode = null;
try {
  // eslint-disable-next-line global-require
  QRCode = require("qrcode");
} catch (e) {
  QRCode = null;
}

function makeCertCode() {
  const y = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CERT-${y}-${rand}`;
}

function ensureDir(absDir) {
  if (!fs.existsSync(absDir)) fs.mkdirSync(absDir, { recursive: true });
}

// safer join for relative path storage
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
  return Number.isNaN(dt.getTime()) ? new Date() : dt;
}

function fmtDate(d) {
  const dt = safeDate(d);
  return dt.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
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

async function makeQrPngBuffer(text) {
  if (!QRCode) return null;
  try {
    // returns PNG buffer
    const buf = await QRCode.toBuffer(String(text || ""), {
      type: "png",
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 6,
    });
    return buf;
  } catch (e) {
    return null;
  }
}

/**
 * generatePdf: creates a styled certificate PDF similar to sample
 * Notes:
 * - logo: backend/assets/logo.png
 * - watermark seal: backend/assets/seal.png (optional)
 * - student photo: pass photo_abs_path if you have one, else placeholder box
 */
async function generatePdf({
  certificate_id,
  certificate_code,
  student_name,
  student_email,
  course_name,
  issued_at,
  done_at,
  photo_abs_path, // absolute path if available (optional)
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

  // outer border
  drawBorder(doc, 25, 25, pageW - 50, pageH - 50);

  // watermark seal (center, light)
  if (fileExists(sealAbs)) {
    const wmSize = 360;
    const wmX = (pageW - wmSize) / 2;
    const wmY = (pageH - wmSize) / 2 + 40;

    doc.save();
    doc.opacity(0.08);
    doc.image(sealAbs, wmX, wmY, {
      width: wmSize,
      height: wmSize,
      align: "center",
    });
    doc.opacity(1);
    doc.restore();
  }

  // Header top area
  const headerTop = 40;
  const headerLeft = 40;
  const headerRight = pageW - 40;

  // logo left
  if (fileExists(logoAbs)) {
    doc.image(logoAbs, headerLeft, headerTop, { width: 60, height: 60 });
  } else {
    // placeholder if missing
    doc
      .save()
      .rect(headerLeft, headerTop, 60, 60)
      .stroke("#9ca3af")
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#6b7280")
      .text("LOGO", headerLeft, headerTop + 25, { width: 60, align: "center" })
      .restore();
  }

  // header text center
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
    .text("East Avenue, Quezon City", { align: "center" })
    .restore();

  // big title
  doc
    .save()
    .moveDown(0.3)
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#111827")
    .text("CERTIFICATE OF COMPLETION", 0, headerTop + 80, { align: "center" })
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(String(course_name || "THEORETICAL DRIVING COURSE").toUpperCase(), {
      align: "center",
    })
    .restore();

  // content blocks
  let y = headerTop + 120;

  // student details block (left) + photo (right)
  const boxX = 40;
  const boxW = pageW - 80;
  const leftW = boxW * 0.68;
  const rightW = boxW - leftW;
  const boxH = 170;

  // section header
  drawSectionHeader(doc, boxX, y, boxW, "Student Driver's Details");

  // box outline
  doc
    .save()
    .rect(boxX, y + 22, boxW, boxH - 22)
    .stroke("#d1d5db")
    .restore();

  // left details
  const pad = 12;
  const textX = boxX + pad;
  const textY = y + 22 + pad;
  const lineGap = 16;

  const issuedStr = fmtDate(issued_at);
  const doneStr = done_at ? fmtDate(done_at) : "—";

  doc.save();
  doc.fillColor("#111827").font("Helvetica").fontSize(10);

  const details = [
    ["Certificate ID", certificate_code],
    ["Student Name", student_name || "—"],
    ["Email", student_email || "—"],
    ["Course", course_name || "—"],
    ["Done Date", doneStr],
    ["Issued Date", issuedStr],
  ];

  let ty = textY;
  details.forEach(([k, v]) => {
    doc
      .font("Helvetica-Bold")
      .text(`${k}:`, textX, ty, { width: 110 })
      .font("Helvetica")
      .text(String(v), textX + 120, ty, { width: leftW - 120 - pad });
    ty += lineGap;
  });

  doc.restore();

  // photo box on right
  const photoBoxX = boxX + leftW;
  const photoBoxY = y + 22;
  const photoPad = 12;

  doc.save();
  doc.rect(photoBoxX, photoBoxY, rightW, boxH - 22).stroke("#d1d5db");
  doc.restore();

  const photoW = rightW - photoPad * 2;
  const photoH = boxH - 22 - photoPad * 2;
  const photoX = photoBoxX + photoPad;
  const photoY = photoBoxY + photoPad;

  if (photo_abs_path && fileExists(photo_abs_path)) {
    // fit photo
    doc.image(photo_abs_path, photoX, photoY, {
      fit: [photoW, photoH],
      align: "center",
      valign: "center",
    });
  } else {
    // placeholder
    doc
      .save()
      .rect(photoX, photoY, photoW, photoH)
      .stroke("#9ca3af")
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#6b7280")
      .text("PHOTO", photoX, photoY + photoH / 2 - 5, {
        width: photoW,
        align: "center",
      })
      .restore();
  }

  // training info block
  y = y + boxH + 18;
  const box2H = 110;

  drawSectionHeader(doc, boxX, y, boxW, "Driving Course Training Information");
  doc
    .save()
    .rect(boxX, y + 22, boxW, box2H - 22)
    .stroke("#d1d5db")
    .restore();

  const tX = boxX + 12;
  const tY = y + 22 + 12;

  doc.save().fillColor("#111827").fontSize(10);

  doc.font("Helvetica-Bold").text("Learning Mode:", tX, tY, { width: 110 });
  doc.font("Helvetica").text("FACE TO FACE", tX + 120, tY);

  doc
    .font("Helvetica-Bold")
    .text("Certificate Status:", tX, tY + 16, { width: 110 });
  doc.font("Helvetica").text("ISSUED", tX + 120, tY + 16);

  doc.font("Helvetica-Bold").text("Portal:", tX, tY + 32, { width: 110 });
  doc.font("Helvetica").text("E-FACET Enrollment Portal", tX + 120, tY + 32);

  doc.restore();

  // footer text + QR code
  const footerY = pageH - 160;

  doc.save();
  doc.fillColor("#111827").font("Helvetica").fontSize(9);
  doc.text(
    `This certificate with control number ${certificate_code} has been issued for the applicant to obtain a Student-Driver's permit / proof of completion.`,
    boxX,
    footerY,
    { width: boxW, align: "center" },
  );
  doc.restore();

  // QR (bottom-right)
  const qrSize = 90;
  const qrX = pageW - 40 - qrSize;
  const qrY = pageH - 40 - qrSize;

  // Use a verification URL if meron ka. For now: a simple text payload.
  const qrPayload = `E-FACET CERT\nID:${certificate_code}\nCERT_ID:${certificate_id || ""}`;

  const qrBuf = await makeQrPngBuffer(qrPayload);
  if (qrBuf) {
    doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });
  } else {
    // placeholder if qrcode package missing
    doc
      .save()
      .rect(qrX, qrY, qrSize, qrSize)
      .stroke("#9ca3af")
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#6b7280")
      .text("QR", qrX, qrY + 38, { width: qrSize, align: "center" })
      .restore();
  }

  // small signature lines (optional look)
  const sigY = pageH - 95;
  doc.save();
  doc.strokeColor("#9ca3af").lineWidth(1);
  doc.moveTo(60, sigY).lineTo(220, sigY).stroke();
  doc.moveTo(260, sigY).lineTo(420, sigY).stroke();
  doc.restore();

  doc.save();
  doc.fillColor("#374151").font("Helvetica").fontSize(8);
  doc.text("Authorized Representative", 60, sigY + 6, {
    width: 160,
    align: "center",
  });
  doc.text("Training Institute", 260, sigY + 6, {
    width: 160,
    align: "center",
  });
  doc.restore();

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);
  });

  // return relative path saved in DB
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
        r.reservation_status,
        r.done_at,
        r.updated_at,

        u.fullname AS student_name,
        u.email AS student_email,

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
      return { ...r, ui_status };
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
        u.fullname AS student_name,
        u.email AS student_email,
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

    // If you have student photo path in DB, you can query it and pass it here.
    // For now: placeholder only.
    const pdf_path = await generatePdf({
      certificate_id,
      certificate_code,
      student_name: r.student_name,
      student_email: r.student_email,
      course_name: r.course_name || "Course",
      issued_at,
      done_at: r.done_at,
      photo_abs_path: null,
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
