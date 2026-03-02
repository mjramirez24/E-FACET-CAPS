const pool = require("../config/database");

function safeStr(v) {
  return typeof v === "string" ? v.trim() : "";
}
function safeLike(s) {
  return String(s).replace(/[%_]/g, (m) => "\\" + m);
}

exports.getTesdaStudents = async (req, res) => {
  try {
    const status = safeStr(req.query.status).toUpperCase(); // all/pending/approved/done...
    const source = safeStr(req.query.source).toUpperCase(); // all/online/walkin
    const sort = safeStr(req.query.sort).toLowerCase(); // full_name/newest/oldest
    const q = safeStr(req.query.q);

    let where = `WHERE 1=1`;
    const params = [];

    // status filter
    if (status && status !== "ALL") {
      where += ` AND UPPER(x.reservation_status) = ?`;
      params.push(status);
    }

    // source filter
    if (source && source !== "ALL") {
      if (source.includes("ONLINE") && source.includes("WALK")) {
        // no filter
      } else if (source.includes("ONLINE")) {
        where += ` AND UPPER(x.reservation_source) = 'ONLINE'`;
      } else if (source.includes("WALK")) {
        where += ` AND UPPER(x.reservation_source) IN ('WALK-IN','WALKIN')`;
      }
    }

    // search filter
    if (q) {
      const like = `%${safeLike(q)}%`;
      where += `
        AND (
          u.fullname LIKE ? OR
          u.email LIKE ? OR
          x.course_name LIKE ? OR
          x.course_code LIKE ? OR
          x.trainer_name LIKE ? OR
          CAST(u.id AS CHAR) LIKE ?
        )
      `;
      params.push(like, like, like, like, like, like);
    }

    let orderBy = `ORDER BY u.fullname ASC`;
    if (sort === "newest") orderBy = `ORDER BY x.last_reserved_at DESC`;
    if (sort === "oldest") orderBy = `ORDER BY x.last_reserved_at ASC`;

    // ✅ MySQL8+ (ROW_NUMBER). If 5.7 ka sabihin mo, bibigay ko fallback query.
    const sql = `
      SELECT
        u.id AS student_id,
        u.fullname AS full_name,
        u.birthday AS birthdate,
        u.gender AS sex,

        x.reservation_id,
        x.reservation_status AS status,
        x.reservation_source AS source,
        x.last_reserved_at AS reserved_at,

        x.schedule_id,
        x.schedule_date AS course_start,
        x.start_time,
        x.end_time,

        x.course_id,
        x.course_code,
        x.course_name,
        x.course_duration AS duration,

        x.trainer_id,
        x.trainer_name AS instructor_name,

        x.batch_id

      FROM users u
      JOIN (
        SELECT *
        FROM (
          SELECT
            tsr.student_id,
            tsr.reservation_id,
            tsr.reservation_status,
            tsr.reservation_source,
            tsr.created_at AS last_reserved_at,
            tsr.schedule_id,
            tsr.batch_id,

            ts.schedule_date,
            ts.start_time,
            ts.end_time,
            ts.course_id,
            ts.trainer_id,

            tc.course_code,
            tc.course_name,
            tc.duration AS course_duration,

            CONCAT_WS(' ', tr.firstname, tr.lastname) AS trainer_name,

            ROW_NUMBER() OVER (PARTITION BY tsr.student_id ORDER BY tsr.created_at DESC) AS rn
          FROM tesda_schedule_reservations tsr
          LEFT JOIN tesda_schedules ts ON ts.schedule_id = tsr.schedule_id
          LEFT JOIN tesda_courses tc ON tc.id = ts.course_id
          LEFT JOIN trainers tr ON tr.trainer_id = ts.trainer_id
        ) t
        WHERE t.rn = 1
      ) x ON x.student_id = u.id
      ${where}
      ${orderBy}
    `;

    const [rows] = await pool.query(sql, params);
    return res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("getTesdaStudents error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load TESDA students",
      debug: err.sqlMessage || err.message,
    });
  }
};
