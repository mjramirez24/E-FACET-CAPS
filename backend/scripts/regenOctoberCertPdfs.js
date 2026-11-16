require("dotenv").config();
const pool = require("../src/config/database");
const {
  generateDrivingPdf,
} = require("../src/controllers/adminCertificateController");

// true kung November ang done_at ng mga October enrollee
const USE_SCHEDULE_DATE_FOR_COMPLETED = false;

// reservation_id ng mga AT ang ginamit sa pag-generate (tingnan ang paliwanag sa baba)
const AT_RESERVATIONS = new Set([]); // hal. [11813, 11820]

// optional: node scripts/regenOctoberCertPdfs.js 11815  (isa lang, pang-test)
const only = Number(process.argv[2]) || null;

(async () => {
  const [rows] = await pool.execute(`
    SELECT
      cert.certificate_id, cert.certificate_code, cert.issued_at, cert.overrides_json,
      r.reservation_id, r.done_at, r.lto_client_id, r.picture_2x2,
      s.schedule_date,
      u.fullname AS student_name, u.email AS student_email,
      u.birthday, u.gender,
      c.course_name, c.course_code
    FROM certificates cert
    JOIN schedule_reservations r ON r.reservation_id = cert.reservation_id
    JOIN schedules s ON s.schedule_id = r.schedule_id
    JOIN users u ON u.id = r.student_id
    JOIN courses c ON c.id = r.course_id
    WHERE cert.certificate_type = 'DRIVING'
      AND cert.status = 'issued'
      AND r.created_at >= '2026-10-01' AND r.created_at < '2026-11-01'
      AND cert.issued_at >= '2026-10-01' AND cert.issued_at < '2026-11-01'
  `);

  let ok = 0;
  for (const r of rows) {
    if (only && r.reservation_id !== only) continue;

    let overrides = null;
    try {
      if (r.overrides_json) {
        overrides =
          typeof r.overrides_json === "string"
            ? JSON.parse(r.overrides_json)
            : r.overrides_json;
      }
    } catch {}
    if (!overrides && AT_RESERVATIONS.has(r.reservation_id)) {
      overrides = { mode: "AT", dl: {} };
    }

    await generateDrivingPdf({
      certificate_code: r.certificate_code,   // parehong code = parehong file, ma-o-overwrite
      student_name: r.student_name,
      student_email: r.student_email,
      course_name: r.course_name || "Driving Course",
      course_code: r.course_code,
      issued_at: r.issued_at,                 // October na galing sa DB
      done_at: USE_SCHEDULE_DATE_FOR_COMPLETED ? r.schedule_date : r.done_at,
      lto_client_id: r.lto_client_id,
      birthday: r.birthday,
      gender: r.gender,
      picture_2x2: r.picture_2x2,
      overrides,
    });

    ok++;
    console.log("regenerated:", r.reservation_id, r.student_name);
  }

  console.log(`Done. ${ok} PDF(s) regenerated.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});