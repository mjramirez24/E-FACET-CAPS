const pool = require("../config/database.js");
const bcrypt = require("bcryptjs");

// ─────────────────────────────────────────────────────────────────────────────
// Helper: resolve user ID from either session shape
//   Flat   (regular student / instructor / admin): req.session.user_id
//   Nested (TESDA student):                        req.session.user.user_id
// ─────────────────────────────────────────────────────────────────────────────
function getSessionUserId(req) {
  const v =
    req?.session?.user_id ??
    req?.session?.user?.user_id ??
    req?.session?.user?.id ??
    null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/settings/profile
// ─────────────────────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const [users] = await pool.execute(
      `SELECT
         id, username, email, fullname,
         contact, address, gender, birthday,
         civil_status, nationality
       FROM users
       WHERE id = ?`,
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const user = users[0];

    return res.json({
      status: "success",
      profile: {
        fullname:     user.fullname     || "",
        username:     user.username     || "",
        email:        user.email        || "",
        contact:      user.contact      || "",
        address:      user.address      || "",
        gender:       user.gender       || "",
        birthday:     user.birthday     || "",
        civil_status: user.civil_status || "",
        nationality:  user.nationality  || "",
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/settings/profile
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const {
      fullname, username, email, contact,
      address, gender, birthday, civil_status, nationality,
    } = req.body;

    // Check username uniqueness
    if (username) {
      const [existingUsername] = await pool.execute(
        "SELECT id FROM users WHERE username = ? AND id != ?",
        [username, userId],
      );
      if (existingUsername.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Username already taken by another account",
        });
      }
    }

    // Check email uniqueness
    if (email) {
      const [existingEmail] = await pool.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, userId],
      );
      if (existingEmail.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Email already in use by another account",
        });
      }
    }

    // Build dynamic UPDATE
    const updateFields = [];
    const updateValues = [];

    const fieldMap = {
      fullname, username, email, contact,
      address, gender, birthday, civil_status, nationality,
    };

    for (const [col, val] of Object.entries(fieldMap)) {
      if (val !== undefined) {
        updateFields.push(`${col} = ?`);
        updateValues.push(val);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ status: "error", message: "No fields to update" });
    }

    updateValues.push(userId);
    await pool.execute(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues,
    );

    // ✅ Update session so the name stays fresh for this session
    if (req.session.user) {
      // Nested session (TESDA)
      if (fullname !== undefined) req.session.user.fullname = fullname;
      if (username !== undefined) req.session.user.username = username;
    } else {
      // Flat session (regular student / etc.)
      if (fullname !== undefined) req.session.fullname = fullname;
      if (username !== undefined) req.session.username = username;
    }

    return res.json({ status: "success", message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ status: "error", message: "Server error: " + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/settings/change-password
// ─────────────────────────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ status: "error", message: "Both passwords are required" });
    }

    const [users] = await pool.execute(
      "SELECT password FROM users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) {
      return res.status(401).json({ status: "error", message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    return res.json({ status: "success", message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/settings/avatar
// ─────────────────────────────────────────────────────────────────────────────
const uploadAvatar = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ status: "error", message: "No file uploaded" });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // Uncomment when you add an avatar column to users:
    // await pool.execute("UPDATE users SET avatar = ? WHERE id = ?", [avatarPath, userId]);

    return res.json({
      status: "success",
      avatar: avatarPath,
      message: "Avatar uploaded successfully",
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/settings/preferences
// ─────────────────────────────────────────────────────────────────────────────
const getPreferences = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const [prefs] = await pool.execute(
      "SELECT * FROM user_preferences WHERE user_id = ?",
      [userId],
    );

    if (prefs.length === 0) {
      return res.json({
        status: "success",
        preferences: {
          theme:                        "light",
          layout:                       "compact",
          notification_sound:           "default",
          language:                     "en",
          show_avatars:                 true,
          show_notifications_badge:     true,
          auto_save_progress:           true,
          email_course_updates:         true,
          email_exam_schedules:         true,
          email_grade_releases:         true,
          email_certificate_completion: true,
          inapp_new_messages:           true,
          inapp_assignment_deadlines:   true,
          inapp_announcements:          true,
        },
      });
    }

    return res.json({ status: "success", preferences: prefs[0] });
  } catch (error) {
    console.error("Get preferences error:", error);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/settings/preferences
// ─────────────────────────────────────────────────────────────────────────────
const updatePreferences = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const {
      theme, layout, notification_sound, language,
      show_avatars, show_notifications_badge, auto_save_progress,
      email_course_updates, email_exam_schedules, email_grade_releases,
      email_certificate_completion, inapp_new_messages,
      inapp_assignment_deadlines, inapp_announcements,
    } = req.body;

    const [existing] = await pool.execute(
      "SELECT id FROM user_preferences WHERE user_id = ?",
      [userId],
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE user_preferences SET
           theme = ?, layout = ?, notification_sound = ?, language = ?,
           show_avatars = ?, show_notifications_badge = ?, auto_save_progress = ?,
           email_course_updates = ?, email_exam_schedules = ?, email_grade_releases = ?,
           email_certificate_completion = ?, inapp_new_messages = ?,
           inapp_assignment_deadlines = ?, inapp_announcements = ?
         WHERE user_id = ?`,
        [
          theme, layout, notification_sound, language,
          show_avatars, show_notifications_badge, auto_save_progress,
          email_course_updates, email_exam_schedules, email_grade_releases,
          email_certificate_completion, inapp_new_messages,
          inapp_assignment_deadlines, inapp_announcements,
          userId,
        ],
      );
    } else {
      await pool.execute(
        `INSERT INTO user_preferences (
           user_id, theme, layout, notification_sound, language,
           show_avatars, show_notifications_badge, auto_save_progress,
           email_course_updates, email_exam_schedules, email_grade_releases,
           email_certificate_completion, inapp_new_messages,
           inapp_assignment_deadlines, inapp_announcements
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, theme, layout, notification_sound, language,
          show_avatars, show_notifications_badge, auto_save_progress,
          email_course_updates, email_exam_schedules, email_grade_releases,
          email_certificate_completion, inapp_new_messages,
          inapp_assignment_deadlines, inapp_announcements,
        ],
      );
    }

    return res.json({ status: "success", message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Update preferences error:", error);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  getPreferences,
  updatePreferences,
};