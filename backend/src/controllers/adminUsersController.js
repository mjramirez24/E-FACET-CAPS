// backend/src/controllers/adminUsersController.js
const pool = require("../config/database");
const bcrypt = require("bcryptjs");

const ALLOWED_ROLES = new Set([
  "admin",
  "instructor",
  "trainer",
  "user",
  "student",
]);

async function hasColumn(table, col) {
  try {
    const [rows] = await pool.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [col]);
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function hasTable(table) {
  try {
    const [rows] = await pool.query("SHOW TABLES LIKE ?", [table]);
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function getTrackIdByCode(trackCode) {
  const code = String(trackCode || "")
    .trim()
    .toLowerCase();
  if (code !== "driving" && code !== "tesda") return null;

  const [rows] = await pool.query(
    "SELECT track_id FROM tracks WHERE track_code = ? LIMIT 1",
    [code],
  );
  return rows.length ? rows[0].track_id : null;
}

function normalizeGender(g) {
  const x = String(g || "")
    .trim()
    .toLowerCase();
  if (x === "male" || x === "female") return x;
  return null;
}

function isValidYmdDate(s) {
  const str = String(s || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(`${str}T00:00:00`);
  return !Number.isNaN(d.getTime());
}

async function getDisableColumn() {
  if (await hasColumn("users", "is_disabled")) return "is_disabled";
  if (await hasColumn("users", "disabled")) return "disabled";
  return null;
}

function splitFullname(fullname) {
  const clean = String(fullname || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!clean) return { firstname: "Unknown", lastname: "User" };

  const parts = clean.split(" ");
  const firstname = parts.shift() || "Unknown";
  const lastname = parts.join(" ") || "User";

  return { firstname, lastname };
}

function makeProfileCode(prefix, userId) {
  return `${prefix}-${String(userId).padStart(4, "0")}`;
}

async function upsertInstructorProfile({
  userId,
  fullname,
  email,
  contact,
  active = true,
}) {
  if (!(await hasTable("instructors"))) return;

  const hasUserId = await hasColumn("instructors", "user_id");
  const hasEmail = await hasColumn("instructors", "email");
  const hasContact = await hasColumn("instructors", "contact_number");
  const hasStatus = await hasColumn("instructors", "status");
  const hasSpec = await hasColumn("instructors", "specialization");
  const hasUpdated = await hasColumn("instructors", "updated_at");

  const { firstname, lastname } = splitFullname(fullname);

  let rows = [];
  if (hasUserId) {
    [rows] = await pool.query(
      `SELECT instructor_id, instructor_code FROM instructors WHERE user_id = ? LIMIT 1`,
      [userId],
    );
  }

  if (rows.length) {
    const updates = ["firstname = ?", "lastname = ?"];
    const params = [firstname, lastname];

    if (hasEmail) {
      updates.push("email = ?");
      params.push(email || null);
    }

    if (hasContact) {
      updates.push("contact_number = ?");
      params.push(contact || null);
    }

    if (hasStatus) {
      updates.push("status = ?");
      params.push(active ? "active" : "inactive");
    }

    if (hasSpec) {
      updates.push("specialization = COALESCE(specialization, ?)");
      params.push("Driving Instructor");
    }

    if (hasUpdated) {
      updates.push("updated_at = CURRENT_TIMESTAMP");
    }

    params.push(rows[0].instructor_id);

    await pool.query(
      `UPDATE instructors SET ${updates.join(", ")} WHERE instructor_id = ?`,
      params,
    );
    return;
  }

  if (!active) return;

  const cols = ["instructor_code", "firstname", "lastname"];
  const vals = [makeProfileCode("INS", userId), firstname, lastname];

  if (hasEmail) {
    cols.push("email");
    vals.push(email || null);
  }

  if (hasContact) {
    cols.push("contact_number");
    vals.push(contact || null);
  }

  if (hasSpec) {
    cols.push("specialization");
    vals.push("Driving Instructor");
  }

  if (hasStatus) {
    cols.push("status");
    vals.push("active");
  }

  if (hasUserId) {
    cols.push("user_id");
    vals.push(userId);
  }

  const placeholders = cols.map(() => "?").join(", ");
  await pool.query(
    `INSERT INTO instructors (${cols.join(", ")}) VALUES (${placeholders})`,
    vals,
  );
}

async function upsertTrainerProfile({
  userId,
  fullname,
  email,
  contact,
  active = true,
}) {
  if (!(await hasTable("trainers"))) return;

  const hasUserId = await hasColumn("trainers", "user_id");
  const hasEmail = await hasColumn("trainers", "email");
  const hasContact = await hasColumn("trainers", "contact_number");
  const hasStatus = await hasColumn("trainers", "status");
  const hasSpec = await hasColumn("trainers", "specialization");
  const hasUpdated = await hasColumn("trainers", "updated_at");

  const { firstname, lastname } = splitFullname(fullname);

  let rows = [];
  if (hasUserId) {
    [rows] = await pool.query(
      `SELECT trainer_id, trainer_code FROM trainers WHERE user_id = ? LIMIT 1`,
      [userId],
    );
  }

  if (rows.length) {
    const updates = ["firstname = ?", "lastname = ?"];
    const params = [firstname, lastname];

    if (hasEmail) {
      updates.push("email = ?");
      params.push(email || null);
    }

    if (hasContact) {
      updates.push("contact_number = ?");
      params.push(contact || null);
    }

    if (hasStatus) {
      updates.push("status = ?");
      params.push(active ? "active" : "inactive");
    }

    if (hasSpec) {
      updates.push("specialization = COALESCE(specialization, ?)");
      params.push("TESDA Trainer");
    }

    if (hasUpdated) {
      updates.push("updated_at = CURRENT_TIMESTAMP");
    }

    params.push(rows[0].trainer_id);

    await pool.query(
      `UPDATE trainers SET ${updates.join(", ")} WHERE trainer_id = ?`,
      params,
    );
    return;
  }

  if (!active) return;

  const cols = ["trainer_code", "firstname", "lastname"];
  const vals = [makeProfileCode("TRN", userId), firstname, lastname];

  if (hasEmail) {
    cols.push("email");
    vals.push(email || null);
  }

  if (hasContact) {
    cols.push("contact_number");
    vals.push(contact || null);
  }

  if (hasSpec) {
    cols.push("specialization");
    vals.push("TESDA Trainer");
  }

  if (hasStatus) {
    cols.push("status");
    vals.push("active");
  }

  if (hasUserId) {
    cols.push("user_id");
    vals.push(userId);
  }

  const placeholders = cols.map(() => "?").join(", ");
  await pool.query(
    `INSERT INTO trainers (${cols.join(", ")}) VALUES (${placeholders})`,
    vals,
  );
}

async function syncRoleProfiles({ userId, fullname, email, contact, role }) {
  const roleNorm = String(role || "")
    .trim()
    .toLowerCase();

  if (roleNorm === "instructor") {
    await upsertInstructorProfile({
      userId,
      fullname,
      email,
      contact,
      active: true,
    });

    await upsertTrainerProfile({
      userId,
      fullname,
      email,
      contact,
      active: false,
    });
    return;
  }

  if (roleNorm === "trainer") {
    await upsertTrainerProfile({
      userId,
      fullname,
      email,
      contact,
      active: true,
    });

    await upsertInstructorProfile({
      userId,
      fullname,
      email,
      contact,
      active: false,
    });
    return;
  }

  await upsertInstructorProfile({
    userId,
    fullname,
    email,
    contact,
    active: false,
  });

  await upsertTrainerProfile({
    userId,
    fullname,
    email,
    contact,
    active: false,
  });
}

// GET /api/admin/users?search=&role=&track=&page=&limit=
async function listUsers(req, res) {
  try {
    const search = String(req.query.search || "").trim();
    const role = String(req.query.role || "")
      .trim()
      .toLowerCase();
    const track = String(req.query.track || "")
      .trim()
      .toLowerCase();

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(5, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;

    const hasGenderCol = await hasColumn("users", "gender");
    const hasAddressCol = await hasColumn("users", "address");
    const hasCivilStatusCol = await hasColumn("users", "civil_status");
    const hasNationalityCol = await hasColumn("users", "nationality");
    const hasBirthdayCol = await hasColumn("users", "birthday");
    const disableCol = await getDisableColumn();

    const hasTracksTbl = await hasTable("tracks");
    const hasTrackCodeCol = hasTracksTbl
      ? await hasColumn("tracks", "track_code")
      : false;

    const joinTracks = hasTracksTbl
      ? "LEFT JOIN tracks t ON t.track_id = u.track_id"
      : "";

    const where = [];
    const params = [];

    // ✅ SEARCH (matches any visible columns + track + status)
    if (search) {
      const s = `%${search}%`;
      const ors = [];

      // always safe core fields
      ors.push("u.fullname LIKE ?");
      params.push(s);

      ors.push("u.username LIKE ?");
      params.push(s);

      ors.push("u.email LIKE ?");
      params.push(s);

      ors.push("u.contact LIKE ?");
      params.push(s);

      if (hasGenderCol) {
        ors.push("u.gender LIKE ?");
        params.push(s);
      }

      if (hasBirthdayCol) {
        // allow searching date string
        ors.push("DATE_FORMAT(u.birthday, '%Y-%m-%d') LIKE ?");
        params.push(s);
      }

      if (hasAddressCol) {
        ors.push("u.address LIKE ?");
        params.push(s);
      }

      if (hasCivilStatusCol) {
        ors.push("u.civil_status LIKE ?");
        params.push(s);
      }

      if (hasNationalityCol) {
        ors.push("u.nationality LIKE ?");
        params.push(s);
      }

      // ✅ track_code is on tracks table (t), not users (u)
      if (hasTracksTbl && hasTrackCodeCol) {
        ors.push("t.track_code LIKE ?");
        params.push(s);
      }

      // role
      ors.push("u.role LIKE ?");
      params.push(s);

      // status (active/disabled) only if we have disableCol
      if (disableCol) {
        ors.push(
          `(CASE WHEN u.${disableCol} = 1 THEN 'disabled' ELSE 'active' END) LIKE ?`,
        );
        params.push(s);
      }

      where.push(`(${ors.join(" OR ")})`);
    }

    // role filter
    if (role && ALLOWED_ROLES.has(role)) {
      where.push("u.role = ?");
      params.push(role);
    }

    // track filter
    if (
      hasTracksTbl &&
      hasTrackCodeCol &&
      (track === "tesda" || track === "driving")
    ) {
      where.push("t.track_code = ?");
      params.push(track);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // select safe optional fields
    const trackSelect =
      hasTracksTbl && hasTrackCodeCol
        ? "t.track_code AS track_code"
        : "NULL AS track_code";
    const genderSelect = hasGenderCol ? "u.gender AS gender" : "NULL AS gender";
    const addressSelect = hasAddressCol
      ? "u.address AS address"
      : "NULL AS address";
    const civilSelect = hasCivilStatusCol
      ? "u.civil_status AS civil_status"
      : "NULL AS civil_status";
    const nationalitySelect = hasNationalityCol
      ? "u.nationality AS nationality"
      : "NULL AS nationality";
    const birthdaySelect = hasBirthdayCol
      ? "u.birthday AS birthday"
      : "NULL AS birthday";
    const disabledSelect = disableCol
      ? `u.${disableCol} AS is_disabled`
      : "NULL AS is_disabled";

    const [countRows] = await pool.query(
      `
        SELECT COUNT(*) AS total
        FROM users u
        ${joinTracks}
        ${whereSql}
      `,
      params,
    );
    const total = Number(countRows?.[0]?.total || 0);

    const [rows] = await pool.query(
      `
        SELECT
          u.id,
          u.fullname,
          u.username,
          u.email,
          u.contact,
          u.role,
          u.track_id,
          ${trackSelect},
          ${genderSelect},
          ${birthdaySelect},
          ${addressSelect},
          ${civilSelect},
          ${nationalitySelect},
          ${disabledSelect}
        FROM users u
        ${joinTracks}
        ${whereSql}
        ORDER BY u.id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    return res.json({
      status: "success",
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error("listUsers error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load users",
      error: {
        code: err?.code || null,
        sqlMessage: err?.sqlMessage || err?.message || null,
      },
    });
  }
}

// GET /api/admin/users/:id
async function getUserById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id)
      return res
        .status(400)
        .json({ status: "error", message: "Invalid user id" });

    const hasGenderCol = await hasColumn("users", "gender");
    const hasAddressCol = await hasColumn("users", "address");
    const hasCivilStatusCol = await hasColumn("users", "civil_status");
    const hasNationalityCol = await hasColumn("users", "nationality");
    const hasBirthdayCol = await hasColumn("users", "birthday");
    const disableCol = await getDisableColumn();

    const hasTracksTbl = await hasTable("tracks");
    const hasTrackCodeCol = hasTracksTbl
      ? await hasColumn("tracks", "track_code")
      : false;

    const joinTracks = hasTracksTbl
      ? "LEFT JOIN tracks t ON t.track_id = u.track_id"
      : "";
    const trackSelect =
      hasTracksTbl && hasTrackCodeCol
        ? "t.track_code AS track_code"
        : "NULL AS track_code";
    const genderSelect = hasGenderCol ? "u.gender AS gender" : "NULL AS gender";
    const addressSelect = hasAddressCol
      ? "u.address AS address"
      : "NULL AS address";
    const civilSelect = hasCivilStatusCol
      ? "u.civil_status AS civil_status"
      : "NULL AS civil_status";
    const nationalitySelect = hasNationalityCol
      ? "u.nationality AS nationality"
      : "NULL AS nationality";
    const birthdaySelect = hasBirthdayCol
      ? "u.birthday AS birthday"
      : "NULL AS birthday";
    const disabledSelect = disableCol
      ? `u.${disableCol} AS is_disabled`
      : "NULL AS is_disabled";

    const [rows] = await pool.query(
      `
        SELECT
          u.id, u.fullname, u.username, u.email, u.contact, u.role, u.track_id,
          ${trackSelect},
          ${genderSelect},
          ${birthdaySelect},
          ${addressSelect},
          ${civilSelect},
          ${nationalitySelect},
          ${disabledSelect}
        FROM users u
        ${joinTracks}
        WHERE u.id = ?
        LIMIT 1
      `,
      [id],
    );

    if (!rows.length)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    return res.json({ status: "success", data: rows[0] });
  } catch (err) {
    console.error("getUserById error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to load user" });
  }
}

// POST /api/admin/users
async function createUser(req, res) {
  try {
    const hasGenderCol = await hasColumn("users", "gender");
    const hasAddressCol = await hasColumn("users", "address");
    const hasCivilStatusCol = await hasColumn("users", "civil_status");
    const hasNationalityCol = await hasColumn("users", "nationality");
    const hasBirthdayCol = await hasColumn("users", "birthday");
    const hasTracksTbl = await hasTable("tracks");
    const disableCol = await getDisableColumn();

    const {
      fullname,
      username,
      email,
      contact,
      password,
      role,
      track,
      gender,
      birthday,
      address,
      civil_status,
      nationality,
    } = req.body;

    const fullnameTrim = String(fullname || "").trim();
    const usernameTrim = String(username || "").trim();
    const emailTrim = String(email || "").trim();
    const contactTrim = String(contact || "").trim();
    const addressTrim = String(address || "").trim();
    const civilTrim = String(civil_status || "").trim();
    const nationalityTrim = String(nationality || "").trim();
    const roleNorm = String(role || "user")
      .trim()
      .toLowerCase();
    const trackCode = String(track || "")
      .trim()
      .toLowerCase();

    if (!fullnameTrim || !usernameTrim || !emailTrim || !password) {
      return res.status(400).json({
        status: "error",
        message: "fullname, username, email, and password are required",
      });
    }

    if (!ALLOWED_ROLES.has(roleNorm)) {
      return res.status(400).json({ status: "error", message: "Invalid role" });
    }

    let trackId = null;
    if (roleNorm === "user" || roleNorm === "student") {
      if (!hasTracksTbl) {
        return res.status(400).json({
          status: "error",
          message: "tracks table is required for user/student accounts",
        });
      }
      trackId = await getTrackIdByCode(trackCode);
      if (!trackId)
        return res
          .status(400)
          .json({ status: "error", message: "Invalid track" });
    }

    const [dupe] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1",
      [emailTrim, usernameTrim],
    );
    if (dupe.length) {
      return res
        .status(400)
        .json({ status: "error", message: "Email or Username already exists" });
    }

    const hash = await bcrypt.hash(String(password), 10);

    const genderNorm = hasGenderCol ? normalizeGender(gender) : null;

    let birthdayVal = null;
    if (hasBirthdayCol) {
      if (birthday && String(birthday).trim()) {
        if (!isValidYmdDate(birthday)) {
          return res
            .status(400)
            .json({ status: "error", message: "Birthday must be YYYY-MM-DD" });
        }
        birthdayVal = String(birthday).trim();
      }
    }

    const cols = [
      "fullname",
      "username",
      "email",
      "contact",
      "password",
      "role",
      "track_id",
    ];
    const vals = [
      fullnameTrim,
      usernameTrim,
      emailTrim,
      contactTrim,
      hash,
      roleNorm,
      trackId,
    ];

    if (hasGenderCol) {
      cols.push("gender");
      vals.push(genderNorm);
    }
    if (hasBirthdayCol) {
      cols.push("birthday");
      vals.push(birthdayVal);
    }
    if (hasAddressCol) {
      cols.push("address");
      vals.push(addressTrim || null);
    }
    if (hasCivilStatusCol) {
      cols.push("civil_status");
      vals.push(civilTrim ? civilTrim.toLowerCase() : null);
    }
    if (hasNationalityCol) {
      cols.push("nationality");
      vals.push(nationalityTrim || null);
    }

    if (disableCol) {
      cols.push(disableCol);
      vals.push(0);
    }

    const placeholders = cols.map(() => "?").join(", ");
    const [result] = await pool.query(
      `INSERT INTO users (${cols.join(", ")}) VALUES (${placeholders})`,
      vals,
    );

    const newUserId = result.insertId;

    await syncRoleProfiles({
      userId: newUserId,
      fullname: fullnameTrim,
      email: emailTrim,
      contact: contactTrim,
      role: roleNorm,
    });

    return res.json({ status: "success", message: "User created" });
  } catch (err) {
    console.error("createUser error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to create user" });
  }
}

// PUT /api/admin/users/:id
async function updateUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id)
      return res
        .status(400)
        .json({ status: "error", message: "Invalid user id" });

    const hasGenderCol = await hasColumn("users", "gender");
    const hasAddressCol = await hasColumn("users", "address");
    const hasCivilStatusCol = await hasColumn("users", "civil_status");
    const hasNationalityCol = await hasColumn("users", "nationality");
    const hasBirthdayCol = await hasColumn("users", "birthday");
    const hasTracksTbl = await hasTable("tracks");

    const [exists] = await pool.query("SELECT id FROM users WHERE id = ?", [
      id,
    ]);
    if (!exists.length)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });

    const {
      fullname,
      username,
      email,
      contact,
      password,
      role,
      track,
      gender,
      birthday,
      address,
      civil_status,
      nationality,
    } = req.body;

    const fullnameTrim = String(fullname || "").trim();
    const usernameTrim = String(username || "").trim();
    const emailTrim = String(email || "").trim();
    const contactTrim = String(contact || "").trim();
    const addressTrim = String(address || "").trim();
    const civilTrim = String(civil_status || "").trim();
    const nationalityTrim = String(nationality || "").trim();
    const roleNorm = String(role || "user")
      .trim()
      .toLowerCase();
    const trackCode = String(track || "")
      .trim()
      .toLowerCase();

    if (!fullnameTrim || !usernameTrim || !emailTrim) {
      return res.status(400).json({
        status: "error",
        message: "fullname, username, and email are required",
      });
    }

    if (!ALLOWED_ROLES.has(roleNorm)) {
      return res.status(400).json({ status: "error", message: "Invalid role" });
    }

    const [dupe] = await pool.query(
      "SELECT id FROM users WHERE (email = ? OR username = ?) AND id <> ? LIMIT 1",
      [emailTrim, usernameTrim, id],
    );
    if (dupe.length) {
      return res
        .status(400)
        .json({ status: "error", message: "Email or Username already exists" });
    }

    let trackId = null;
    if (roleNorm === "user" || roleNorm === "student") {
      if (!hasTracksTbl) {
        return res.status(400).json({
          status: "error",
          message: "tracks table is required for user/student accounts",
        });
      }
      trackId = await getTrackIdByCode(trackCode);
      if (!trackId)
        return res
          .status(400)
          .json({ status: "error", message: "Invalid track" });
    }

    const updates = [];
    const params = [];

    updates.push("fullname = ?");
    params.push(fullnameTrim);
    updates.push("username = ?");
    params.push(usernameTrim);
    updates.push("email = ?");
    params.push(emailTrim);
    updates.push("contact = ?");
    params.push(contactTrim);
    updates.push("role = ?");
    params.push(roleNorm);
    updates.push("track_id = ?");
    params.push(trackId);

    if (password && String(password).trim()) {
      const hash = await bcrypt.hash(String(password).trim(), 10);
      updates.push("password = ?");
      params.push(hash);
    }

    if (hasGenderCol) {
      const gTrim = String(gender || "").trim();
      if (gTrim) {
        updates.push("gender = ?");
        params.push(normalizeGender(gTrim));
      }
    }

    if (hasBirthdayCol) {
      const bTrim = String(birthday || "").trim();
      if (bTrim) {
        if (!isValidYmdDate(bTrim)) {
          return res
            .status(400)
            .json({ status: "error", message: "Birthday must be YYYY-MM-DD" });
        }
        updates.push("birthday = ?");
        params.push(bTrim);
      }
    }

    if (hasAddressCol) {
      if (String(address || "").trim()) {
        updates.push("address = ?");
        params.push(addressTrim);
      }
    }

    if (hasCivilStatusCol) {
      if (String(civil_status || "").trim()) {
        updates.push("civil_status = ?");
        params.push(civilTrim.toLowerCase());
      }
    }

    if (hasNationalityCol) {
      if (String(nationality || "").trim()) {
        updates.push("nationality = ?");
        params.push(nationalityTrim);
      }
    }

    params.push(id);

    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ? LIMIT 1`,
      params,
    );

    await syncRoleProfiles({
      userId: id,
      fullname: fullnameTrim,
      email: emailTrim,
      contact: contactTrim,
      role: roleNorm,
    });

    return res.json({ status: "success", message: "User updated" });
  } catch (err) {
    console.error("updateUser error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to update user" });
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id)
      return res
        .status(400)
        .json({ status: "error", message: "Invalid user id" });

    const [exists] = await pool.query("SELECT id FROM users WHERE id = ?", [
      id,
    ]);
    if (!exists.length)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });

    await pool.query("DELETE FROM users WHERE id = ? LIMIT 1", [id]);
    return res.json({ status: "success", message: "User deleted" });
  } catch (err) {
    console.error("deleteUser error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to delete user" });
  }
}

// PUT /api/admin/users/:id/disable
async function disableUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id)
      return res
        .status(400)
        .json({ status: "error", message: "Invalid user id" });

    const disableCol = await getDisableColumn();
    if (!disableCol) {
      return res.status(500).json({
        status: "error",
        message:
          "Disable feature not ready in DB. Add a column: ALTER TABLE users ADD COLUMN is_disabled TINYINT(1) NOT NULL DEFAULT 0",
      });
    }

    await pool.query(
      `UPDATE users SET ${disableCol} = 1 WHERE id = ? LIMIT 1`,
      [id],
    );
    return res.json({ status: "success", message: "User disabled" });
  } catch (err) {
    console.error("disableUser error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to disable user" });
  }
}

// PUT /api/admin/users/:id/enable
async function enableUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id)
      return res
        .status(400)
        .json({ status: "error", message: "Invalid user id" });

    const disableCol = await getDisableColumn();
    if (!disableCol) {
      return res.status(500).json({
        status: "error",
        message:
          "Enable feature not ready in DB. Add a column: ALTER TABLE users ADD COLUMN is_disabled TINYINT(1) NOT NULL DEFAULT 0",
      });
    }

    await pool.query(
      `UPDATE users SET ${disableCol} = 0 WHERE id = ? LIMIT 1`,
      [id],
    );
    return res.json({ status: "success", message: "User enabled" });
  } catch (err) {
    console.error("enableUser error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to enable user" });
  }
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  disableUser,
  enableUser,
};
