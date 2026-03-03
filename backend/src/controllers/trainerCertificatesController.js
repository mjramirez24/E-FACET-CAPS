// backend/src/controllers/trainerCertificatesController.js
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const pool = require("../config/database");

/* ----------------------------- helpers ----------------------------- */

function makeCertCode(prefix = "TESDA") {
  const y = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${y}-${rand}`;
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

function drawBorder(doc, x, y, w, h) {
  doc.save().lineWidth(1.2).rect(x, y, w, h).stroke("#111827").restore();
}

async function resolveTrainerIdFromUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT trainer_id FROM trainers WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  return rows.length ? Number(rows[0].trainer_id) : null;
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

/* ----------------------------- PDF: TESDA (LANDSCAPE) ----------------------------- */

async function generateTesdaPdf({
  certificate_code,
  student_name,
  course_name,
  issued_at,
  done_at,
}) {
  const uploadsDir = path.join(process.cwd(), "uploads", "certificates");
  ensureDir(uploadsDir);

  const filename = `${certificate_code}.pdf`;
  const absFilepath = path.join(uploadsDir, filename);

  // LANDSCAPE
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
  const stream = fs.createWriteStream(absFilepath);
  doc.pipe(stream);

  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // assets (safe fallbacks)
  const tesdaLogoAbs = path.join(process.cwd(), "assets", "tesda-logo.png");
  const logoAbs = fileExists(tesdaLogoAbs)
    ? tesdaLogoAbs
    : path.join(process.cwd(), "assets", "logo.png");

  const watermarkAbs = path.join(
    process.cwd(),
    "assets",
    "tesda-watermark.png",
  );

  // inner margin (since margin:0)
  const M = 28;
  const innerX = M;
  const innerY = M;
  const innerW = pageW - M * 2;
  const innerH = pageH - M * 2;

  drawBorder(doc, innerX, innerY, innerW, innerH);

  // watermark optional
  if (fileExists(watermarkAbs)) {
    const wmW = innerW * 0.55;
    const wmH = wmW;
    const wmX = innerX + (innerW - wmW) / 2;
    const wmY = innerY + (innerH - wmH) / 2;
    doc.save();
    doc.opacity(0.08);
    doc.image(watermarkAbs, wmX, wmY, { width: wmW, height: wmH });
    doc.opacity(1);
    doc.restore();
  }

  // header layout
  const headerTop = innerY + 18;
  const logoSize = 64;

  const logoX = innerX + 18;
  const logoY = headerTop;

  const codeBoxW = 210;
  const codeX = innerX + innerW - 18 - codeBoxW;
  const codeY = headerTop + 4;

  const headerTextX = logoX + logoSize + 12;
  const headerTextW = codeX - 12 - headerTextX;

  if (fileExists(logoAbs)) {
    doc.image(logoAbs, logoX, logoY, { width: logoSize, height: logoSize });
  } else {
    doc
      .save()
      .rect(logoX, logoY, logoSize, logoSize)
      .stroke("#9ca3af")
      .restore();
  }

  // cert code
  doc
    .save()
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#6b7280")
    .text("Certificate Code", codeX, codeY, { width: codeBoxW, align: "right" })
    .font("Courier-Bold")
    .fontSize(10)
    .fillColor("#111827")
    .text(certificate_code, codeX, codeY + 14, {
      width: codeBoxW,
      align: "right",
    })
    .restore();

  // header text
  doc
    .save()
    .fillColor("#111827")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(
      "TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY",
      headerTextX,
      headerTop + 2,
      { width: headerTextW, align: "center" },
    )
    .font("Helvetica")
    .fontSize(8.5)
    .text(
      "NATIONAL INSTITUTE FOR TECHNICAL EDUCATION AND SKILLS DEVELOPMENT (NITESD)",
      headerTextX,
      headerTop + 18,
      { width: headerTextW, align: "center" },
    )
    .fontSize(8)
    .fillColor("#374151")
    .text(
      "EAST SERVICE ROAD, SOUTH LUZON EXPRESSWAY (SLEX), FORT BONIFACIO, TAGUIG CITY",
      headerTextX,
      headerTop + 32,
      { width: headerTextW, align: "center" },
    )
    .restore();

  // blue bar
  const barY = headerTop + logoSize + 14;
  doc
    .save()
    .fillColor("#1d4ed8")
    .rect(innerX + 18, barY, innerW - 36, 10)
    .fill()
    .restore();

  // body
  const bodyTop = barY + 55;

  doc
    .save()
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor("#111827")
    .text("CERTIFICATE OF COMPLETION", innerX, bodyTop, {
      width: innerW,
      align: "center",
    })
    .restore();

  doc
    .save()
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#6b7280")
    .text("THIS IS TO CERTIFY THAT", innerX, bodyTop + 40, {
      width: innerW,
      align: "center",
    })
    .restore();

  doc
    .save()
    .font("Helvetica-Bold")
    .fontSize(34)
    .fillColor("#111827")
    .text(student_name || "—", innerX, bodyTop + 62, {
      width: innerW,
      align: "center",
    })
    .restore();

  doc
    .save()
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#6b7280")
    .text("HAS COMPLETED THE COURSE", innerX, bodyTop + 112, {
      width: innerW,
      align: "center",
    })
    .restore();

  doc
    .save()
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#111827")
    .text(course_name || "—", innerX, bodyTop + 136, {
      width: innerW,
      align: "center",
    })
    .restore();

  doc
    .save()
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#111827")
    .text(`ON ${fmtDate(done_at || issued_at)}`, innerX, bodyTop + 170, {
      width: innerW,
      align: "center",
    })
    .restore();

  // footer
  const footY = innerY + innerH - 70;
  doc.save().font("Helvetica").fontSize(9).fillColor("#374151");
  doc.text("This is a computer generated certificate,", innerX + 18, footY);
  doc.text("it is valid even without a signature.", innerX + 18, footY + 14);

  doc.text("For verification purposes, contact:", innerX, footY, {
    width: innerW - 18,
    align: "right",
  });
  doc.text("eTESDA Division", innerX, footY + 14, {
    width: innerW - 18,
    align: "right",
  });
  doc.text("tesdaonlineprogram@tesda.gov.ph", innerX, footY + 28, {
    width: innerW - 18,
    align: "right",
  });
  doc.text("(02) 8893 - 8297", innerX, footY + 42, {
    width: innerW - 18,
    align: "right",
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

/* ----------------------------- LIST DONE (TESDA for this trainer only) ----------------------------- */

exports.listTesdaCompletions = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const trainerId = await resolveTrainerIdFromUserId(userId);
    if (!trainerId)
      return res
        .status(403)
        .json({ status: "error", message: "Trainer not mapped." });

    const [rows] = await pool.execute(
      `
      SELECT
        tr.reservation_id,
        tr.schedule_id,
        tr.student_id,
        ts.course_id,
        tr.reservation_status,
        tr.updated_at AS done_at,

        u.fullname AS student_name,
        u.email AS student_email,

        tc.course_name,
        tc.course_code,

        cert.certificate_id,
        cert.certificate_code,
        cert.status AS certificate_status,
        cert.issued_at,
        cert.pdf_path

      FROM tesda_schedule_reservations tr
      JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
      JOIN tesda_courses tc ON tc.id = ts.course_id
      JOIN users u ON u.id = tr.student_id

      LEFT JOIN certificates cert
        ON cert.reservation_id = tr.reservation_id
       AND cert.certificate_type = 'TESDA'

      WHERE tr.reservation_status = 'DONE'
        AND u.role = 'user'
        AND ts.trainer_id = ?

      ORDER BY tr.updated_at DESC
      `,
      [trainerId],
    );

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
    console.error("trainer listTesdaCompletions error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load TESDA completions",
      debug: err.sqlMessage || err.message,
    });
  }
};

/* ----------------------------- GENERATE (TESDA for this trainer only) ----------------------------- */

exports.generateTesda = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const trainerId = await resolveTrainerIdFromUserId(userId);
    if (!trainerId)
      return res
        .status(403)
        .json({ status: "error", message: "Trainer not mapped." });

    const { reservation_id } = req.body;
    if (!reservation_id) {
      return res
        .status(400)
        .json({ status: "error", message: "reservation_id is required" });
    }

    // make sure reservation belongs to this trainer and is DONE
    const [rr] = await pool.execute(
      `
      SELECT
        tr.reservation_id,
        tr.updated_at AS done_at,
        u.fullname AS student_name,
        tc.course_name
      FROM tesda_schedule_reservations tr
      JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
      JOIN tesda_courses tc ON tc.id = ts.course_id
      JOIN users u ON u.id = tr.student_id
      WHERE tr.reservation_id = ?
        AND tr.reservation_status = 'DONE'
        AND ts.trainer_id = ?
      LIMIT 1
      `,
      [reservation_id, trainerId],
    );

    if (!rr.length) {
      return res.status(404).json({
        status: "error",
        message: "TESDA reservation not found / not DONE / not assigned to you",
      });
    }

    const r = rr[0];

    // prevent duplicates
    const [existing] = await pool.execute(
      `SELECT certificate_id FROM certificates WHERE reservation_id = ? AND certificate_type='TESDA' LIMIT 1`,
      [reservation_id],
    );
    if (existing.length) {
      return res.status(409).json({
        status: "error",
        message: "TESDA certificate already exists for this reservation.",
      });
    }

    const issued_at = new Date();
    const certificate_code = makeCertCode("TESDA");

    const [ins] = await pool.execute(
      `INSERT INTO certificates
        (reservation_id, certificate_code, certificate_type, issued_at, status)
       VALUES (?, ?, 'TESDA', ?, 'issued')`,
      [reservation_id, certificate_code, issued_at],
    );

    const certificate_id = ins.insertId;

    const pdf_path = await generateTesdaPdf({
      certificate_code,
      student_name: r.student_name,
      course_name: r.course_name || "TESDA Course",
      issued_at,
      done_at: r.done_at,
    });

    await pool.execute(
      `UPDATE certificates SET pdf_path = ? WHERE certificate_id = ?`,
      [pdf_path, certificate_id],
    );

    return res.json({
      status: "success",
      message: "TESDA certificate generated",
      data: { certificate_id, certificate_code, pdf_path },
    });
  } catch (err) {
    console.error("trainer generateTesda error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to generate TESDA certificate",
      debug: err.sqlMessage || err.message,
    });
  }
};

/* ----------------------------- VIEW / DOWNLOAD ----------------------------- */

async function getCertPdfInfoForTrainer(certId, trainerId) {
  const [rows] = await pool.execute(
    `
    SELECT cert.pdf_path, cert.certificate_code
    FROM certificates cert
    JOIN tesda_schedule_reservations tr ON tr.reservation_id = cert.reservation_id
    JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
    WHERE cert.certificate_id = ?
      AND cert.certificate_type = 'TESDA'
      AND ts.trainer_id = ?
    LIMIT 1
    `,
    [certId, trainerId],
  );

  if (!rows.length || !rows[0].pdf_path) return null;

  const abs = path.join(process.cwd(), String(rows[0].pdf_path));
  if (!fs.existsSync(abs))
    return { missing: true, certificate_code: rows[0].certificate_code };
  return { abs, certificate_code: rows[0].certificate_code };
}

exports.viewTesdaPdf = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const trainerId = await resolveTrainerIdFromUserId(userId);
    if (!trainerId)
      return res
        .status(403)
        .json({ status: "error", message: "Trainer not mapped." });

    const info = await getCertPdfInfoForTrainer(req.params.id, trainerId);
    if (!info)
      return res
        .status(404)
        .json({ status: "error", message: "PDF not found" });
    if (info.missing)
      return res
        .status(404)
        .json({ status: "error", message: "PDF file missing on server" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${info.certificate_code}.pdf"`,
    );
    fs.createReadStream(info.abs).pipe(res);
  } catch (err) {
    console.error("trainer viewTesdaPdf error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to open PDF" });
  }
};

exports.downloadTesdaPdf = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const trainerId = await resolveTrainerIdFromUserId(userId);
    if (!trainerId)
      return res
        .status(403)
        .json({ status: "error", message: "Trainer not mapped." });

    const info = await getCertPdfInfoForTrainer(req.params.id, trainerId);
    if (!info)
      return res
        .status(404)
        .json({ status: "error", message: "PDF not found" });
    if (info.missing)
      return res
        .status(404)
        .json({ status: "error", message: "PDF file missing on server" });

    return res.download(info.abs, `${info.certificate_code}.pdf`);
  } catch (err) {
    console.error("trainer downloadTesdaPdf error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to download PDF" });
  }
};
