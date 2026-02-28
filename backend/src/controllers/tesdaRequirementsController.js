// backend/src/controllers/tesdaRequirementsController.js
const pool = require("../config/database");
const fs = require("fs");
const path = require("path");

// helper: get logged in student id from session
function getSessionUserId(req) {
  const v = req?.session?.user_id ?? req?.session?.userId ?? req?.session?.id;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function toRelUploadPath(filename) {
  const name = String(filename || "");
  return `/uploads/requirements/${name}`.replace(/\\/g, "/");
}

// turn "/uploads/requirements/abc.pdf" into absolute disk path
function toAbsUploadPath(relPath) {
  const clean = String(relPath || "").replace(/\\/g, "/");
  if (!clean.startsWith("/uploads/requirements/")) return "";
  const filename = clean.split("/uploads/requirements/")[1];
  if (!filename) return "";
  return path.join(process.cwd(), "uploads", "requirements", filename);
}

// ✅ Resolve reservation even if schedule_id is NULL (pooling)
async function resolveReservationId(studentId, courseId, maybeReservationId) {
  const rid = Number(maybeReservationId || 0);
  if (rid > 0) return rid;

  const [rows] = await pool.execute(
    `
    SELECT r.reservation_id
    FROM tesda_schedule_reservations r
    JOIN tesda_batches b ON b.batch_id = r.batch_id
    WHERE r.student_id = ?
      AND b.course_id = ?
      AND UPPER(COALESCE(r.reservation_status,'')) NOT IN ('CANCELLED')
    ORDER BY r.created_at DESC, r.reservation_id DESC
    LIMIT 1
    `,
    [studentId, courseId],
  );

  return rows?.[0]?.reservation_id ? Number(rows[0].reservation_id) : 0;
}

// ✅ Get reservation status (server-side rule)
async function getReservationStatus(reservationId, studentId) {
  const [rows] = await pool.execute(
    `
    SELECT reservation_status
    FROM tesda_schedule_reservations
    WHERE reservation_id = ? AND student_id = ?
    LIMIT 1
    `,
    [reservationId, studentId],
  );

  if (!rows.length) return "";
  return String(rows[0].reservation_status || "").toUpperCase();
}

// ✅ allow edits only when PENDING
async function assertPendingReservation(reservationId, studentId) {
  const st = await getReservationStatus(reservationId, studentId);
  if (st !== "PENDING") {
    const err = new Error("LOCKED");
    err.statusCode = 403;
    err.publicMessage = "Requirements are locked after confirmation.";
    err.reservationStatus = st;
    throw err;
  }
  return true;
}

// GET /api/tesda/requirements?course_id=123&reservation_id=optional
async function listMySubmissions(req, res) {
  try {
    const studentId = getSessionUserId(req);
    if (!studentId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not authenticated" });
    }

    const courseId = Number(req.query.course_id || 0);
    if (!courseId) {
      return res
        .status(400)
        .json({ status: "error", message: "course_id is required" });
    }

    const reservationId = Number(req.query.reservation_id || 0);

    const sql = `
      SELECT
        submission_id,
        reservation_id,
        course_id,
        requirement_key,
        requirement_label,
        original_name,
        file_path,
        created_at
      FROM tesda_requirement_submissions
      WHERE student_id = ?
        AND course_id = ?
        ${reservationId ? "AND reservation_id = ?" : ""}
      ORDER BY submission_id DESC
    `;

    const params = reservationId
      ? [studentId, courseId, reservationId]
      : [studentId, courseId];
    const [rows] = await pool.execute(sql, params);

    return res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("listMySubmissions error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to load submissions" });
  }
}

/**
 * POST /api/tesda/requirements/upload-one  (multipart/form-data)
 * fields: course_id, reservation_id(optional), requirement_key, requirement_label(optional)
 * file: "file"
 *
 * ✅ one requirement = one row (upsert)
 *
 * RECOMMENDED UNIQUE KEY:
 *  UNIQUE(student_id, reservation_id, requirement_key)
 */
async function uploadOneRequirement(req, res) {
  try {
    const studentId = getSessionUserId(req);
    if (!studentId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not authenticated" });
    }

    const courseId = Number(req.body.course_id || 0);
    if (!courseId) {
      return res
        .status(400)
        .json({ status: "error", message: "course_id is required" });
    }

    const requirementKey = String(req.body.requirement_key || "").trim();
    if (!requirementKey) {
      return res
        .status(400)
        .json({ status: "error", message: "requirement_key is required" });
    }

    const safeRequirementKey = requirementKey.slice(0, 120);

    const requirementLabelRaw = String(req.body.requirement_label || "").trim();
    const requirementLabel = requirementLabelRaw
      ? requirementLabelRaw.slice(0, 255)
      : null;

    const reservationId = await resolveReservationId(
      studentId,
      courseId,
      req.body.reservation_id,
    );
    if (!reservationId) {
      return res.status(400).json({
        status: "error",
        message:
          "reservation_id is required (or you must enroll first). Cannot link uploads to a reservation.",
      });
    }

    // ✅ LOCK: allow upload/replace only when reservation is still PENDING
    await assertPendingReservation(reservationId, studentId);

    const f = req.file;
    if (!f) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded (field name must be 'file')",
      });
    }

    const rel = toRelUploadPath(f.filename);
    const original = f.originalname || null;

    // fetch old file for cleanup (only if row exists)
    const [oldRows] = await pool.execute(
      `
      SELECT submission_id, file_path
      FROM tesda_requirement_submissions
      WHERE student_id = ? AND course_id = ? AND reservation_id = ? AND requirement_key = ?
      LIMIT 1
      `,
      [studentId, courseId, reservationId, safeRequirementKey],
    );
    const oldFilePath = oldRows?.[0]?.file_path
      ? String(oldRows[0].file_path)
      : "";

    await pool.execute(
      `
      INSERT INTO tesda_requirement_submissions
        (student_id, course_id, reservation_id, requirement_key, requirement_label, original_name, file_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        requirement_label = VALUES(requirement_label),
        original_name = VALUES(original_name),
        file_path = VALUES(file_path),
        created_at = NOW()
      `,
      [
        studentId,
        courseId,
        reservationId,
        safeRequirementKey,
        requirementLabel,
        original,
        rel,
      ],
    );

    // delete old file only if it’s different and exists (best effort)
    if (oldFilePath && oldFilePath !== rel) {
      const abs = toAbsUploadPath(oldFilePath);
      if (abs) fs.promises.unlink(abs).catch(() => {});
    }

    return res.json({
      status: "success",
      message: "Requirement uploaded",
      reservation_id: reservationId,
      requirement_key: safeRequirementKey,
      file_path: rel,
      original_name: original,
    });
  } catch (err) {
    if (err?.statusCode === 403) {
      return res.status(403).json({
        status: "error",
        message: err.publicMessage || "Requirements are locked.",
        reservation_status: err.reservationStatus || "",
      });
    }

    console.error("uploadOneRequirement error:", err);
    return res.status(500).json({
      status: "error",
      message: err.sqlMessage || err.message || "Upload failed",
    });
  }
}

/**
 * DELETE /api/tesda/requirements/:submission_id
 * ✅ deletes row + deletes file from disk
 * ✅ allowed ONLY when reservation_status = PENDING
 */
async function deleteSubmission(req, res) {
  try {
    const studentId = getSessionUserId(req);
    if (!studentId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not authenticated" });
    }

    const submissionId = Number(req.params.submission_id || 0);
    if (!submissionId) {
      return res
        .status(400)
        .json({ status: "error", message: "submission_id is required" });
    }

    // verify ownership + get file_path + reservation_id (for status check)
    const [rows] = await pool.execute(
      `
      SELECT submission_id, file_path, reservation_id
      FROM tesda_requirement_submissions
      WHERE submission_id = ? AND student_id = ?
      LIMIT 1
      `,
      [submissionId, studentId],
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ status: "error", message: "Upload not found" });
    }

    const filePath = String(rows[0].file_path || "");
    const reservationId = Number(rows[0].reservation_id || 0);

    if (!reservationId) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid reservation link." });
    }

    // ✅ LOCK: allow delete only when reservation is still PENDING
    await assertPendingReservation(reservationId, studentId);

    // delete db row
    await pool.execute(
      `DELETE FROM tesda_requirement_submissions WHERE submission_id = ? AND student_id = ?`,
      [submissionId, studentId],
    );

    // delete file on disk (best effort)
    const abs = toAbsUploadPath(filePath);
    if (abs) {
      await fs.promises.unlink(abs).catch(() => {});
    }

    return res.json({ status: "success", message: "Deleted upload" });
  } catch (err) {
    if (err?.statusCode === 403) {
      return res.status(403).json({
        status: "error",
        message: err.publicMessage || "Requirements are locked.",
        reservation_status: err.reservationStatus || "",
      });
    }

    console.error("deleteSubmission error:", err);
    return res.status(500).json({
      status: "error",
      message: err.sqlMessage || err.message || "Delete failed",
    });
  }
}

/**
 * POST /api/tesda/requirements/submit
 * body: { course_id, reservation_id(optional), required_keys: [] }
 */
async function submitRequirements(req, res) {
  try {
    const studentId = getSessionUserId(req);
    if (!studentId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not authenticated" });
    }

    const courseId = Number(req.body.course_id || 0);
    if (!courseId) {
      return res
        .status(400)
        .json({ status: "error", message: "course_id is required" });
    }

    const requiredKeysRaw = Array.isArray(req.body.required_keys)
      ? req.body.required_keys
      : [];
    const requiredKeys = Array.from(
      new Set(
        requiredKeysRaw
          .map((k) => String(k || "").trim())
          .filter(Boolean)
          .map((k) => k.slice(0, 120)),
      ),
    );

    if (!requiredKeys.length) {
      return res.status(400).json({
        status: "error",
        message: "required_keys is required (array)",
      });
    }

    const reservationId = await resolveReservationId(
      studentId,
      courseId,
      req.body.reservation_id,
    );
    if (!reservationId) {
      return res.status(400).json({
        status: "error",
        message: "reservation_id missing. Enroll first.",
      });
    }

    const [rows] = await pool.execute(
      `
      SELECT requirement_key
      FROM tesda_requirement_submissions
      WHERE student_id = ? AND course_id = ? AND reservation_id = ?
      `,
      [studentId, courseId, reservationId],
    );

    const have = new Set(
      rows.map((r) => String(r.requirement_key || "").trim()).filter(Boolean),
    );
    const missing = requiredKeys.filter((k) => !have.has(k));

    if (missing.length) {
      return res.status(400).json({
        status: "error",
        message: "Missing required documents",
        missing_keys: missing,
      });
    }

    return res.json({
      status: "success",
      message: "All requirements complete. Submitted for verification.",
      reservation_id: reservationId,
    });
  } catch (err) {
    console.error("submitRequirements error:", err);
    return res.status(500).json({
      status: "error",
      message: err.sqlMessage || err.message || "Submit failed",
    });
  }
}

module.exports = {
  listMySubmissions,
  uploadOneRequirement,
  submitRequirements,
  deleteSubmission,
};
