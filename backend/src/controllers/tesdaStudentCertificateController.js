const path = require("path");
const fs = require("fs");
const pool = require("../config/database");

function getSessionUserId(req) {
  const v = req?.session?.user_id ?? req?.session?.userId ?? req?.session?.id;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// GET: my TESDA certificates (DONE reservations + issued certificates)
exports.listMyTesdaCertificates = async (req, res) => {
  try {
    const studentId = getSessionUserId(req);
    if (!studentId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not authenticated" });
    }

    const [rows] = await pool.execute(
      `
      SELECT
        tr.reservation_id,
        tr.schedule_id,
        tr.student_id,
        tr.reservation_status,
        tr.updated_at AS done_at,
        tr.created_at,

        ts.course_id,

        tc.course_name,
        tc.course_code,

        cert.certificate_id,
        cert.certificate_code,
        cert.status AS certificate_status,
        cert.issued_at,
        cert.pdf_path

      FROM tesda_schedule_reservations tr
      JOIN tesda_schedules ts
        ON ts.schedule_id = tr.schedule_id
      JOIN tesda_courses tc
        ON tc.id = ts.course_id

      LEFT JOIN certificates cert
        ON cert.reservation_id = tr.reservation_id
       AND cert.certificate_type = 'TESDA'

      WHERE tr.student_id = ?
        AND tr.reservation_status = 'DONE'

      ORDER BY COALESCE(cert.issued_at, tr.updated_at, tr.created_at) DESC
      `,
      [studentId],
    );

    const data = rows.map((r) => {
      const hasIssued =
        !!r.certificate_id &&
        String(r.certificate_status).toLowerCase() === "issued";

      return {
        id: r.certificate_id
          ? `tesda-cert-${r.certificate_id}`
          : `tesda-res-${r.reservation_id}`,

        reservation_id: r.reservation_id,
        schedule_id: r.schedule_id,
        course_id: r.course_id,

        course: r.course_name || "TESDA Course",
        course_code: r.course_code || null,
        type: "TESDA Certificate of Completion",

        issueDate: r.issued_at
          ? new Date(r.issued_at).toISOString().slice(0, 10)
          : null,

        status: hasIssued ? "completed" : "pending",

        certificate_id: r.certificate_id || null,
        certificate_code: r.certificate_code || null,
      };
    });

    return res.json({ status: "success", data });
  } catch (err) {
    console.error("listMyTesdaCertificates error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load your TESDA certificates",
      debug: err.sqlMessage || err.message,
    });
  }
};

// GET: view my TESDA certificate PDF inline
exports.viewMyTesdaPdf = async (req, res) => {
  try {
    const studentId = getSessionUserId(req);
    if (!studentId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not authenticated" });
    }

    const certId = req.params.id;

    const [rows] = await pool.execute(
      `
      SELECT cert.pdf_path, cert.certificate_code
      FROM certificates cert
      JOIN tesda_schedule_reservations tr
        ON tr.reservation_id = cert.reservation_id
      WHERE cert.certificate_id = ?
        AND tr.student_id = ?
        AND cert.certificate_type = 'TESDA'
        AND cert.status = 'issued'
      LIMIT 1
      `,
      [certId, studentId],
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
    console.error("viewMyTesdaPdf error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to open PDF" });
  }
};

// GET: download my TESDA certificate PDF
exports.downloadMyTesdaPdf = async (req, res) => {
  try {
    const studentId = getSessionUserId(req);
    if (!studentId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not authenticated" });
    }

    const certId = req.params.id;

    const [rows] = await pool.execute(
      `
      SELECT cert.pdf_path, cert.certificate_code
      FROM certificates cert
      JOIN tesda_schedule_reservations tr
        ON tr.reservation_id = cert.reservation_id
      WHERE cert.certificate_id = ?
        AND tr.student_id = ?
        AND cert.certificate_type = 'TESDA'
        AND cert.status = 'issued'
      LIMIT 1
      `,
      [certId, studentId],
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
    console.error("downloadMyTesdaPdf error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to download PDF" });
  }
};
