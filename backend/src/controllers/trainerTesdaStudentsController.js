// backend/src/controllers/trainerTesdaStudentsController.js
const pool = require("../config/database");

/* ------------------------ helpers (same basis as trainerCertificatesController) ------------------------ */

function safeStr(v) {
  return String(v ?? "").trim();
}
function safeLike(v) {
  return String(v ?? "")
    .trim()
    .replace(/[%_]/g, (m) => "\\" + m);
}
function clampLimitOffset(page, limit) {
  const p = Math.max(1, parseInt(String(page ?? "1"), 10) || 1);
  const l = Math.min(
    200,
    Math.max(1, parseInt(String(limit ?? "50"), 10) || 50),
  );
  const offset = (p - 1) * l;
  return { page: p, limit: l, offset };
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

async function resolveTrainerIdFromUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT trainer_id FROM trainers WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  return rows.length ? Number(rows[0].trainer_id) : null;
}

/**
 * GET /api/trainer/tesda/students
 * Returns per-student list for THIS trainer only:
 * - student_id, fullname, email
 * - latest course_name/course_code + latest reservation status
 * - enrollmentDate (latest created_at)
 * - reservations_count, last_activity
 * With filters: course_id, schedule_id, q, pagination
 */
async function listMyTesdaStudents(req, res) {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const trainerId = await resolveTrainerIdFromUserId(userId);
    if (!trainerId) {
      return res
        .status(403)
        .json({ status: "error", message: "Trainer not mapped." });
    }

    const courseId = Number(req.query.course_id);
    const scheduleId = Number(req.query.schedule_id);
    const q = safeStr(req.query.q);
    const { page, limit, offset } = clampLimitOffset(
      req.query.page,
      req.query.limit,
    );

    const where = [`ts.trainer_id = ?`];
    const params = [trainerId];

    if (Number.isFinite(courseId) && courseId > 0) {
      where.push(`ts.course_id = ?`);
      params.push(courseId);
    }
    if (Number.isFinite(scheduleId) && scheduleId > 0) {
      where.push(`ts.schedule_id = ?`);
      params.push(scheduleId);
    }
    if (q) {
      const like = `%${safeLike(q)}%`;
      where.push(
        `(u.fullname LIKE ? OR u.email LIKE ? OR CAST(u.id AS CHAR) LIKE ?)`,
      );
      params.push(like, like, like);
    }

    // ✅ total distinct students for pagination
    const [countRows] = await pool.execute(
      `
      SELECT COUNT(*) AS total
      FROM (
        SELECT tr.student_id
        FROM tesda_schedule_reservations tr
        JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
        JOIN users u ON u.id = tr.student_id
        WHERE ${where.join(" AND ")}
        GROUP BY tr.student_id
      ) x
      `,
      params,
    );
    const total = parseInt(countRows?.[0]?.total ?? 0, 10) || 0;

    /**
     * ✅ Main query:
     * - Base rows (only this trainer)
     * - Rank reservations per student by latest activity
     * - Aggregate per student:
     *    reservations_count, last_activity
     *    latest course fields + latest status + enrollmentDate
     */
    const [rows] = await pool.execute(
      `
      SELECT
        b.student_id,
        MAX(b.fullname) AS fullname,
        MAX(b.email) AS email,

        COUNT(DISTINCT b.reservation_id) AS reservations_count,
        MAX(b.activity_ts) AS last_activity,

        -- latest reservation snapshot (rn = 1)
        MAX(CASE WHEN b.rn = 1 THEN b.course_id END) AS course_id,
        MAX(CASE WHEN b.rn = 1 THEN b.course_name END) AS course_name,
        MAX(CASE WHEN b.rn = 1 THEN b.course_code END) AS course_code,
        MAX(CASE WHEN b.rn = 1 THEN b.status END) AS status,
        MAX(CASE WHEN b.rn = 1 THEN b.created_at END) AS enrollmentDate

      FROM (
        SELECT
          tr.reservation_id,
          tr.student_id,
          u.fullname,
          u.email,

          ts.course_id,
          tc.course_name,
          tc.course_code,

          LOWER(tr.reservation_status) AS status,
          tr.created_at,
          COALESCE(tr.updated_at, tr.created_at) AS activity_ts,

          ROW_NUMBER() OVER (
            PARTITION BY tr.student_id
            ORDER BY COALESCE(tr.updated_at, tr.created_at) DESC, tr.reservation_id DESC
          ) AS rn

        FROM tesda_schedule_reservations tr
        JOIN tesda_schedules ts ON ts.schedule_id = tr.schedule_id
        JOIN tesda_courses tc ON tc.id = ts.course_id
        JOIN users u ON u.id = tr.student_id

        WHERE ${where.join(" AND ")}
      ) b

      GROUP BY b.student_id
      ORDER BY fullname ASC
      LIMIT ${limit} OFFSET ${offset}
      `,
      params,
    );

    return res.json({
      status: "success",
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        course_id: Number.isFinite(courseId) ? courseId : null,
        schedule_id: Number.isFinite(scheduleId) ? scheduleId : null,
        q: q || "",
      },
    });
  } catch (err) {
    console.error("listMyTesdaStudents error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load trainer students",
      debug: {
        code: err.code,
        sqlMessage: err.sqlMessage,
        message: err.message,
      },
    });
  }
}

module.exports = { listMyTesdaStudents };
