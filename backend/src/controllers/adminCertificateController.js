// backend/src/controllers/adminCertificatesController.js
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const pool = require("../config/database");

/* ----------------------------- helpers ----------------------------- */

function makeCertCode(prefix = "CERT") {
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
  doc.save().lineWidth(1.2).rect(x, y, w, h).stroke("#111827").restore();
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
 * Resolve local path for picture_2x2
 * supports:
 * - "uploads/xxx.jpg"
 * - "/uploads/xxx.jpg"
 * - "xxx.jpg" (filename only) -> will try common folders
 */
function resolveLocalImagePath(picture_2x2) {
  const v = String(picture_2x2 || "").trim();
  if (!v) return null;

  // remote
  if (/^https?:\/\//i.test(v)) return null;

  // normalize slashes
  const cleaned = v.replace(/\\/g, "/").replace(/^\/+/, "");

  // 1) as-is relative from project root
  const abs1 = path.join(process.cwd(), cleaned);
  if (fileExists(abs1)) return abs1;

  // 2) if filename only, try common places
  const baseName = path.basename(cleaned);

  const candidates = [
    path.join(process.cwd(), "uploads", baseName),
    path.join(process.cwd(), "uploads", "2x2", baseName),
    path.join(process.cwd(), "uploads", "pictures_2x2", baseName),
    path.join(process.cwd(), "uploads", "students", baseName),
    path.join(process.cwd(), "uploads", "images", baseName),
  ];

  for (const c of candidates) {
    if (fileExists(c)) return c;
  }

  return null;
}

function isPDC(course_code, course_name) {
  const cc = String(course_code || "")
    .trim()
    .toUpperCase();
  if (cc.includes("PDC")) return true;

  const cn = String(course_name || "")
    .trim()
    .toUpperCase();
  if (cn.includes("PRACTICAL") || cn.includes("PDC")) return true;

  return false;
}

/**
 * ✅ DL code: only A / B / AB based on course_code
 * Examples: "PDC A", "PDC-AB", "PDC AB", "PDC (AB)"
 */
function parseDlFromCourseCode(course_code) {
  const s = String(course_code || "").toUpperCase();
  if (/\bAB\b/.test(s) || /PDC\s*[-(]?\s*AB/.test(s)) return "AB";
  if (/\bA\b/.test(s) || /PDC\s*[-(]?\s*A\b/.test(s)) return "A";
  if (/\bB\b/.test(s) || /PDC\s*[-(]?\s*B\b/.test(s)) return "B";
  return "";
}

/* ---------------------- overrides (MT/AT + DL) ---------------------- */

function normalizeMode(v) {
  const s = String(v || "")
    .trim()
    .toUpperCase();
  return s === "MT" || s === "AT" ? s : "";
}

function sanitizeOverrides(overrides) {
  if (!overrides || typeof overrides !== "object") return null;

  // support old field `transmission` too
  const mode = normalizeMode(overrides.mode || overrides.transmission);

  const dlIn =
    overrides.dl && typeof overrides.dl === "object" ? overrides.dl : null;
  const dl = {};

  if (dlIn) {
    for (const [codeRaw, val] of Object.entries(dlIn)) {
      const code = String(codeRaw || "")
        .trim()
        .toUpperCase();
      if (!code) continue;
      const mt = val?.mt === true;
      const at = val?.at === true;
      if (mt || at) dl[code] = { mt, at };
    }
  }

  if (!mode && Object.keys(dl).length === 0) return null;
  return { mode, dl };
}

/* ----------------------------- PDF: DRIVING ----------------------------- */

async function generateDrivingPdf({
  certificate_code,
  student_name,
  student_email,
  course_name,
  course_code,
  issued_at,
  done_at,
  lto_client_id,
  birthday,
  gender,
  picture_2x2,
  overrides,
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

  const logoAbs = path.join(process.cwd(), "assets", "logo.png");
  const sealAbs = path.join(process.cwd(), "assets", "seal.png"); // optional watermark

  // outer border
  drawBorder(doc, 25, 25, pageW - 50, pageH - 50);

  // watermark seal
  if (fileExists(sealAbs)) {
    const wmSize = 420;
    const wmX = (pageW - wmSize) / 2;
    const wmY = (pageH - wmSize) / 2 + 40;

    doc.save();
    doc.opacity(0.07);
    doc.image(sealAbs, wmX, wmY, { width: wmSize, height: wmSize });
    doc.opacity(1);
    doc.restore();
  }

  const headerTop = 40;
  const headerLeft = 40;

  // left logo
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

  // 2x2 (right)
  const photoBoxW = 95;
  const photoBoxH = 95;
  const photoX = pageW - 40 - photoBoxW;
  const photoY = headerTop;

  doc
    .save()
    .rect(photoX, photoY, photoBoxW, photoBoxH)
    .stroke("#9ca3af")
    .restore();

  const photoAbs = resolveLocalImagePath(picture_2x2);
  if (photoAbs && fileExists(photoAbs)) {
    doc.image(photoAbs, photoX + 2, photoY + 2, {
      width: photoBoxW - 4,
      height: photoBoxH - 4,
      fit: [photoBoxW - 4, photoBoxH - 4],
      align: "center",
      valign: "center",
    });
  } else {
    // ✅ requirement: kapag walang upload, placeholder lang (no crash)
    doc
      .save()
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#6b7280")
      .text("2x2 PHOTO", photoX, photoY + 40, {
        width: photoBoxW,
        align: "center",
      })
      .restore();
  }

  // header center text
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

  const titleY = headerTop + 88;
  const isPdc = isPDC(course_code, course_name);

  doc
    .save()
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#111827")
    .text("CERTIFICATE OF COMPLETION", 0, titleY, { align: "center" })
    .fontSize(12)
    .text(isPdc ? "PRACTICAL DRIVING COURSE" : "THEORETICAL DRIVING COURSE", {
      align: "center",
    })
    .restore();

  let y = titleY + 40;
  const boxX = 40;
  const boxW = pageW - 80;

  // Student Driver's Details
  const box1H = 185;
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

  const doneStr = done_at ? fmtDate(done_at) : "—";
  const sex = normalizeSex(gender);
  const bdayStr = fmtDate(birthday);
  const age = computeAge(birthday);

  const details = [
    ["LTO Client ID", lto_client_id || "—"],
    ["Name", student_name || "—"],
    ["Date of Birth", bdayStr],
    ["Age", String(age)],
    ["Sex", sex],
    ["Email", student_email || "—"],
  ];

  doc.save().fillColor("#111827").font("Helvetica").fontSize(10);

  let ty = textY;
  details.forEach(([k, v]) => {
    doc.font("Helvetica-Bold").text(`${k}:`, textX, ty, { width: 120 });
    doc
      .font("Helvetica")
      .text(String(v), textX + 130, ty, { width: boxW - 160 });
    ty += lineGap;
  });

  doc.restore();

  // Training Info
  y = y + box1H + 14;
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
  doc
    .font("Helvetica")
    .text(course_name || "—", tX + 130, tY, { width: boxW - 160 });

  doc
    .font("Helvetica-Bold")
    .text("Learning Mode:", tX, tY + 18, { width: 120 });
  doc.font("Helvetica").text("FACE TO FACE", tX + 130, tY + 18);

  doc
    .font("Helvetica-Bold")
    .text("Date Completed:", tX, tY + 36, { width: 120 });
  doc.font("Helvetica").text(doneStr, tX + 130, tY + 36);

  doc.font("Helvetica-Bold").text("Issued Date:", tX, tY + 54, { width: 120 });
  doc.font("Helvetica").text(fmtDate(issued_at), tX + 130, tY + 54);

  doc.restore();

  // ✅ PDC only: DL Code tables (checks controlled by overrides + mode)
  if (isPdc) {
    y = y + box2H + 14;

    const dlBoxH = 160;
    const halfW = (boxW - 16) / 2;

    const leftX = boxX;
    const rightX = boxX + halfW + 16;

    const left = [
      ["A", "(L1,L2,L3)"],
      ["A1", "(L4,L5,L6,L7)"],
      ["B", "(M1)"],
      ["B1", "(M2)"],
      ["B2", "(N1)"],
    ];
    const right = [
      ["BE", "(O1,O2)"],
      ["C", "(N2,N3)"],
      ["CE", "(O3,O4)"],
      ["D", "(M3)"],
    ];

    const drawX = (x, y, w, h) => {
      doc.save().strokeColor("#111827").lineWidth(1.2);
      doc
        .moveTo(x + 2, y + 2)
        .lineTo(x + w - 2, y + h - 2)
        .stroke();
      doc
        .moveTo(x + w - 2, y + 2)
        .lineTo(x + 2, y + h - 2)
        .stroke();
      doc.restore();
    };

    const parsed = parseDlFromCourseCode(course_code); // "A"|"B"|"AB"|""
    const fallbackA = parsed === "A" || parsed === "AB";
    const fallbackB = parsed === "B" || parsed === "AB";

    const mode = normalizeMode(overrides?.mode); // "MT" | "AT" | ""
    const dlOverride =
      overrides?.dl && typeof overrides.dl === "object" ? overrides.dl : null;

    const resolveDlCheck = (code) => {
      const c = String(code || "").toUpperCase();

      // 1) Explicit checkbox overrides
      if (dlOverride && dlOverride[c]) {
        return { mt: !!dlOverride[c].mt, at: !!dlOverride[c].at };
      }

      // 2) Fallback: based on course_code A/B/AB, but column depends on mode
      if (c === "A") {
        if (!fallbackA) return { mt: false, at: false };
        return mode === "AT"
          ? { mt: false, at: true }
          : { mt: true, at: false };
      }
      if (c === "B") {
        if (!fallbackB) return { mt: false, at: false };
        return mode === "AT"
          ? { mt: false, at: true }
          : { mt: true, at: false };
      }

      return { mt: false, at: false };
    };

    const drawDlTable = (x, y0, w, rowsData) => {
      doc.save().rect(x, y0, w, dlBoxH).stroke("#d1d5db").restore();

      doc.save().fillColor("#f3f4f6").rect(x, y0, w, 22).fill().restore();
      doc
        .save()
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#111827")
        .text("DL Code (Vehicle Category)", x + 8, y0 + 6, { width: w - 16 })
        .restore();

      // headers
      const headY = y0 + 28;
      doc.save().font("Helvetica-Bold").fontSize(9).fillColor("#374151");
      doc.text("DL Code", x + 8, headY, { width: w - 16 - 80 });
      doc.text("MT", x + w - 72, headY, { width: 30, align: "center" });
      doc.text("AT", x + w - 38, headY, { width: 30, align: "center" });
      doc.restore();

      let rowY = headY + 16;
      rowsData.forEach(([code, desc]) => {
        doc
          .save()
          .strokeColor("#e5e7eb")
          .lineWidth(1)
          .moveTo(x, rowY - 6)
          .lineTo(x + w, rowY - 6)
          .stroke()
          .restore();

        doc.save().font("Helvetica-Bold").fontSize(9).fillColor("#111827");
        doc.text(code, x + 8, rowY, { width: 40 });
        doc.restore();

        doc.save().font("Helvetica").fontSize(9).fillColor("#4b5563");
        doc.text(desc, x + 40, rowY, { width: w - 16 - 90 });
        doc.restore();

        const check = resolveDlCheck(code);

        // checkboxes
        const mtX = x + w - 66;
        const atX = x + w - 32;
        const cbY = rowY + 1;

        doc.save().rect(mtX, cbY, 12, 12).stroke("#9ca3af").restore();
        doc.save().rect(atX, cbY, 12, 12).stroke("#9ca3af").restore();

        if (check.mt) drawX(mtX, cbY, 12, 12);
        if (check.at) drawX(atX, cbY, 12, 12);

        rowY += 22;
      });
    };

    drawDlTable(leftX, y, halfW, left);
    drawDlTable(rightX, y, halfW, right);

    y = y + dlBoxH + 10;
  }

  // footer statement + QR placeholder
  const footerTop = pageH - 170;
  const qrBox = { w: 95, h: 95, x: pageW - 40 - 95, y: pageH - 155 };

  doc.save().fillColor("#111827").font("Helvetica").fontSize(9);
  doc.text(
    `This Certificate with Control Number ${certificate_code} has been issued in compliance with the applicable LTO training requirements.`,
    boxX,
    footerTop,
    { width: boxW - 110, align: "left" },
  );
  doc.restore();

  // QR placeholder box
  doc
    .save()
    .rect(qrBox.x, qrBox.y, qrBox.w, qrBox.h)
    .stroke("#6b7280")
    .restore();
  doc
    .save()
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#6b7280")
    .text("QR", qrBox.x, qrBox.y + 38, { width: qrBox.w, align: "center" })
    .restore();

  // signature lines
  const sigY = pageH - 85;
  doc.save().strokeColor("#9ca3af").lineWidth(1);
  doc.moveTo(70, sigY).lineTo(245, sigY).stroke();
  doc.moveTo(295, sigY).lineTo(470, sigY).stroke();
  doc.restore();

  doc.save().fillColor("#374151").font("Helvetica").fontSize(8);
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

/* ----------------------------- PDF: TESDA (LANDSCAPE, full width) ----------------------------- */
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

  // ✅ LANDSCAPE
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
  const stream = fs.createWriteStream(absFilepath);
  doc.pipe(stream);

  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // assets
  const tesdaLogoAbs = path.join(process.cwd(), "assets", "tesda-logo.png");
  const logoAbs = fileExists(tesdaLogoAbs)
    ? tesdaLogoAbs
    : path.join(process.cwd(), "assets", "logo.png");

  const watermarkAbs = path.join(process.cwd(), "assets", "tesda-watermark.png");

  // ✅ margins inside page (since margin:0)
  const M = 28;
  const innerX = M;
  const innerY = M;
  const innerW = pageW - M * 2;
  const innerH = pageH - M * 2;

  // border
  drawBorder(doc, innerX, innerY, innerW, innerH);

  // watermark (optional)
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

  // ---------------- HEADER LAYOUT (no overlap) ----------------
  const headerTop = innerY + 18;
  const logoSize = 64;

  const logoX = innerX + 18;
  const logoY = headerTop;

  // right certificate code box
  const codeBoxW = 210;
  const codeX = innerX + innerW - 18 - codeBoxW;
  const codeY = headerTop + 4;

  // center header text area = between logo and code box
  const headerTextX = logoX + logoSize + 12;
  const headerTextW = codeX - 12 - headerTextX;

  // logo
  if (fileExists(logoAbs)) {
    doc.image(logoAbs, logoX, logoY, { width: logoSize, height: logoSize });
  } else {
    doc.save().rect(logoX, logoY, logoSize, logoSize).stroke("#9ca3af").restore();
  }

  // certificate code (top-right)
  doc
    .save()
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#6b7280")
    .text("Certificate Code", codeX, codeY, { width: codeBoxW, align: "right" })
    .font("Courier-Bold")
    .fontSize(10)
    .fillColor("#111827")
    .text(certificate_code, codeX, codeY + 14, { width: codeBoxW, align: "right" })
    .restore();

  // header lines (centered ONLY inside safe width)
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

  // blue bar (full width inside border)
  const barY = headerTop + logoSize + 14;
  doc
    .save()
    .fillColor("#1d4ed8")
    .rect(innerX + 18, barY, innerW - 36, 10)
    .fill()
    .restore();

  // ---------------- MAIN BODY (centered, stacked) ----------------
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

  // ---------------- FOOTER (no circle badge) ----------------
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

/* ----------------------------- LIST DONE ----------------------------- */

exports.listCompletions = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      /* ---------------- DRIVING DONE ---------------- */
      SELECT
        r.reservation_id,
        r.schedule_id,
        r.student_id,
        r.course_id,
        r.lto_client_id,
        r.picture_2x2,
        r.reservation_type,
        r.reservation_status,
        r.done_at,
        r.updated_at,

        u.fullname AS student_name,
        u.email AS student_email,
        u.birthday AS birthday,
        u.gender AS gender,

        c.course_name,
        c.course_code,

        cert.certificate_id,
        cert.certificate_code,
        cert.status AS certificate_status,
        cert.issued_at,
        cert.pdf_path

      FROM schedule_reservations r
      JOIN users u ON u.id = r.student_id
      JOIN courses c ON c.id = r.course_id
      LEFT JOIN certificates cert
        ON cert.reservation_id = r.reservation_id
       AND cert.certificate_type = 'DRIVING'
      WHERE r.reservation_status = 'DONE'
        AND u.role = 'user'

      UNION ALL

      /* ---------------- TESDA DONE ---------------- */
      SELECT
        tr.reservation_id,
        tr.schedule_id,
        tr.student_id,
        ts.course_id AS course_id,
        NULL AS lto_client_id,
        NULL AS picture_2x2,
        'TESDA' AS reservation_type,
        tr.reservation_status,
        tr.updated_at AS done_at,
        tr.updated_at,

        u2.fullname AS student_name,
        u2.email AS student_email,
        u2.birthday AS birthday,
        u2.gender AS gender,

        tc.course_name,
        tc.course_code,

        cert2.certificate_id,
        cert2.certificate_code,
        cert2.status AS certificate_status,
        cert2.issued_at,
        cert2.pdf_path

      FROM tesda_schedule_reservations tr
      JOIN users u2 ON u2.id = tr.student_id
      JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
      JOIN tesda_courses tc ON tc.id = ts.course_id
      LEFT JOIN certificates cert2
        ON cert2.reservation_id = tr.reservation_id
       AND cert2.certificate_type = 'TESDA'
      WHERE tr.reservation_status = 'DONE'
        AND u2.role = 'user'

      ORDER BY COALESCE(done_at, updated_at) DESC
    `);

    const mapped = rows.map((r) => {
      let ui_status = "ready";
      if (r.certificate_id && r.certificate_status === "issued")
        ui_status = "issued";
      if (r.certificate_id && r.certificate_status === "revoked")
        ui_status = "revoked";

      const rt = String(r.reservation_type || "")
        .trim()
        .toUpperCase();
      const track = rt === "TESDA" ? "tesda" : "driving";

      return {
        ...r,
        track,
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

/* ----------------------------- GENERATE: DRIVING ----------------------------- */

exports.generateDriving = async (req, res) => {
  try {
    const { reservation_id, overrides } = req.body;

    if (!reservation_id) {
      return res
        .status(400)
        .json({ status: "error", message: "reservation_id is required" });
    }

    const cleanOverrides = sanitizeOverrides(overrides);

    const [rRows] = await pool.execute(
      `
      SELECT
        r.reservation_id,
        r.reservation_status,
        r.done_at,
        r.lto_client_id,
        r.picture_2x2,
        r.reservation_type,

        u.fullname AS student_name,
        u.email AS student_email,
        u.birthday AS birthday,
        u.gender AS gender,

        c.course_name,
        c.course_code
      FROM schedule_reservations r
      JOIN users u ON u.id = r.student_id
      JOIN courses c ON c.id = r.course_id
      WHERE r.reservation_id = ?
      LIMIT 1
      `,
      [reservation_id],
    );

    if (!rRows.length)
      return res
        .status(404)
        .json({ status: "error", message: "Reservation not found" });

    const r = rRows[0];

    const rt = String(r.reservation_type || "").toUpperCase();
    if (rt === "TESDA") {
      return res.status(400).json({
        status: "error",
        message: "This reservation is TESDA. Use TESDA generate endpoint.",
      });
    }

    if (r.reservation_status !== "DONE") {
      return res
        .status(400)
        .json({ status: "error", message: "Student is not DONE yet." });
    }

    const [existing] = await pool.execute(
      `SELECT certificate_id
FROM certificates
WHERE reservation_id = ? AND certificate_type='DRIVING'
LIMIT 1`,
      [reservation_id],
    );
    if (existing.length) {
      return res.status(409).json({
        status: "error",
        message: "Certificate already exists for this reservation.",
      });
    }

    const certificate_code = makeCertCode("DRIVE");
    const issued_at = new Date();

    const [ins] = await pool.execute(
      `INSERT INTO certificates
      (reservation_id, certificate_code, certificate_type, issued_at, status)
      VALUES (?, ?, 'DRIVING', ?, 'issued')`,
      [reservation_id, certificate_code, issued_at],
    );

    const certificate_id = ins.insertId;

    const pdf_path = await generateDrivingPdf({
      certificate_code,
      student_name: r.student_name,
      student_email: r.student_email,
      course_name: r.course_name || "Driving Course",
      course_code: r.course_code,
      issued_at,
      done_at: r.done_at,
      lto_client_id: r.lto_client_id,
      birthday: r.birthday,
      gender: r.gender,
      picture_2x2: r.picture_2x2,
      overrides: cleanOverrides,
    });

    await pool.execute(
      `UPDATE certificates SET pdf_path = ? WHERE certificate_id = ?`,
      [pdf_path, certificate_id],
    );

    return res.json({
      status: "success",
      message: "Driving certificate generated",
      data: {
        certificate_id,
        certificate_code,
        pdf_path,
        overrides: cleanOverrides || null,
      },
    });
  } catch (err) {
    console.error("generateDriving error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to generate driving certificate",
      debug: err.sqlMessage || err.message,
    });
  }
};

/* ----------------------------- GENERATE: TESDA ----------------------------- */

exports.generateTesda = async (req, res) => {
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
        tr.reservation_id,
        tr.reservation_status,
        tr.updated_at AS done_at,
        u.fullname AS student_name,
        tc.course_name
      FROM tesda_schedule_reservations tr
      JOIN users u ON u.id = tr.student_id
      JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
      JOIN tesda_courses tc ON tc.id = ts.course_id
      WHERE tr.reservation_id = ?
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

    // ✅ only check DONE
    if (r.reservation_status !== "DONE") {
      return res
        .status(400)
        .json({ status: "error", message: "Student is not DONE yet." });
    }

    // ✅ prevent duplicates PER TYPE
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

    const certificate_code = makeCertCode("TESDA");
    const issued_at = new Date();

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
    console.error("generateTesda error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to generate TESDA certificate",
      debug: err.sqlMessage || err.message,
    });
  }
};

/* ----------------------------- VIEW / DOWNLOAD ----------------------------- */

async function getCertPdfInfo(certId) {
  const [rows] = await pool.execute(
    `SELECT pdf_path, certificate_code FROM certificates WHERE certificate_id = ? LIMIT 1`,
    [certId],
  );

  if (!rows.length || !rows[0].pdf_path) return null;

  const abs = path.join(process.cwd(), String(rows[0].pdf_path));
  if (!fs.existsSync(abs))
    return { missing: true, certificate_code: rows[0].certificate_code };

  return { abs, certificate_code: rows[0].certificate_code };
}

exports.viewDrivingPdf = async (req, res) => {
  try {
    const info = await getCertPdfInfo(req.params.id);
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
    console.error("viewDrivingPdf error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to open PDF" });
  }
};

exports.downloadDrivingPdf = async (req, res) => {
  try {
    const info = await getCertPdfInfo(req.params.id);
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
    console.error("downloadDrivingPdf error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to download PDF" });
  }
};

exports.viewTesdaPdf = async (req, res) => {
  try {
    const info = await getCertPdfInfo(req.params.id);
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
    console.error("viewTesdaPdf error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to open PDF" });
  }
};

exports.downloadTesdaPdf = async (req, res) => {
  try {
    const info = await getCertPdfInfo(req.params.id);
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
    console.error("downloadTesdaPdf error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to download PDF" });
  }
};

/* ----------------------------- REVOKE ----------------------------- */

exports.revokeDriving = async (req, res) => {
  try {
    const certId = req.params.id;

    const [rows] = await pool.execute(
      `SELECT certificate_id, status FROM certificates WHERE certificate_id = ? LIMIT 1`,
      [certId],
    );

    if (!rows.length)
      return res
        .status(404)
        .json({ status: "error", message: "Certificate not found" });
    if (rows[0].status === "revoked")
      return res.json({ status: "success", message: "Already revoked" });

    await pool.execute(
      `UPDATE certificates SET status='revoked' WHERE certificate_id = ?`,
      [certId],
    );

    return res.json({
      status: "success",
      message: "Driving certificate revoked",
    });
  } catch (err) {
    console.error("revokeDriving error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to revoke certificate" });
  }
};

exports.revokeTesda = async (req, res) => {
  try {
    const certId = req.params.id;

    const [rows] = await pool.execute(
      `SELECT certificate_id, status FROM certificates WHERE certificate_id = ? LIMIT 1`,
      [certId],
    );

    if (!rows.length)
      return res
        .status(404)
        .json({ status: "error", message: "Certificate not found" });
    if (rows[0].status === "revoked")
      return res.json({ status: "success", message: "Already revoked" });

    await pool.execute(
      `UPDATE certificates SET status='revoked' WHERE certificate_id = ?`,
      [certId],
    );

    return res.json({
      status: "success",
      message: "TESDA certificate revoked",
    });
  } catch (err) {
    console.error("revokeTesda error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to revoke certificate" });
  }
};
