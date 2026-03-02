const pool = require("../config/database");

function normTrack(req) {
  // accept either track= or report_mode=
  const raw = String(
    req.query.track || req.query.report_mode || req.query.mode || "",
  ).toLowerCase();
  if (raw === "tesda") return "tesda";
  if (raw === "driving") return "driving";
  return "";
}

exports.getAdminCourses = async (req, res) => {
  try {
    const track = normTrack(req);

    // ✅ TESDA ONLY
    if (track === "tesda") {
      const [rows] = await pool.query(
        `
        SELECT
          id,
          course_code,
          course_name,
          description,
          duration,
          requirements,
          course_fee,
          status,
          created_at,
          updated_at,
          'tesda' AS track
        FROM tesda_courses
        WHERE status = 'active'
        ORDER BY course_name ASC
        `,
      );
      return res.json({ status: "success", data: rows });
    }

    // ✅ DRIVING ONLY
    if (track === "driving") {
      const [rows] = await pool.query(
        `
    SELECT
      id,
      course_code,
      course_name,
      description,
      duration,

      NULL AS requirements,     -- courses table doesn't have this
      course_fee,
      status,

      NULL AS created_at,       -- ✅ if missing in courses table
      NULL AS updated_at,       -- ✅ fix: missing in courses table

      'driving' AS track
    FROM courses
    ORDER BY course_name ASC
    `,
      );
      return res.json({ status: "success", data: rows });
    }

    // ✅ DEFAULT: return BOTH (so dropdown won't be empty if frontend forgets track param)
    // Notes:
    // - IDs may overlap between tables; we include track so the UI can disambiguate if needed.
    // - Frontend can still pass track/report_mode to filter.
    const [rows] = await pool.query(
      `
      SELECT
        id,
        course_code,
        course_name,
        description,
        duration,
        requirements,
        course_fee,
        status,
        created_at,
        updated_at,
        'driving' AS track
      FROM courses
      WHERE status = 'active'
      UNION ALL
      SELECT
        id,
        course_code,
        course_name,
        description,
        duration,
        requirements,
        course_fee,
        status,
        created_at,
        updated_at,
        'tesda' AS track
      FROM tesda_courses
      WHERE status = 'active'
      ORDER BY course_name ASC
      `,
    );

    return res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("getAdminCourses error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load courses",
      debug: err.sqlMessage || err.message,
    });
  }
};
