const pool = require("../config/database.js");
const bcrypt = require("bcryptjs");

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;

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
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const user = users[0];

    res.json({
      status: "success",
      profile: {
        fullname: user.fullname || "",
        username: user.username || "",
        email: user.email || "",
        contact: user.contact || "",
        address: user.address || "",
        gender: user.gender || "",
        birthday: user.birthday || "",
        civil_status: user.civil_status || "",
        nationality: user.nationality || "",
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Update profile - ONLY update columns that exist in your database
const updateProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const {
      fullname,
      username,
      email,
      contact,
      address,
      gender,
      birthday,
      civil_status,
      nationality,
    } = req.body;

    // Check if username already exists for another user
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

    // Check if email already exists for another user
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

    // Build the update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];

    if (fullname !== undefined) {
      updateFields.push("fullname = ?");
      updateValues.push(fullname);
    }
    if (username !== undefined) {
      updateFields.push("username = ?");
      updateValues.push(username);
    }
    if (email !== undefined) {
      updateFields.push("email = ?");
      updateValues.push(email);
    }
    if (contact !== undefined) {
      updateFields.push("contact = ?");
      updateValues.push(contact);
    }
    if (address !== undefined) {
      updateFields.push("address = ?");
      updateValues.push(address);
    }
    if (gender !== undefined) {
      updateFields.push("gender = ?");
      updateValues.push(gender);
    }
    if (birthday !== undefined) {
      updateFields.push("birthday = ?");
      updateValues.push(birthday);
    }
    if (civil_status !== undefined) {
      updateFields.push("civil_status = ?");
      updateValues.push(civil_status);
    }
    if (nationality !== undefined) {
      updateFields.push("nationality = ?");
      updateValues.push(nationality);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No fields to update",
      });
    }

    // Add userId to values array
    updateValues.push(userId);

    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;

    await pool.execute(query, updateValues);

    res.json({
      status: "success",
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error: " + error.message,
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { currentPassword, newPassword } = req.body;

    // Get current password
    const [users] = await pool.execute(
      "SELECT password FROM users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) {
      return res.status(401).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.session.user_id;

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    // You need an avatars table or a column in users table
    // For now, just return success
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // If you want to save the avatar path to database, uncomment:
    // await pool.execute(
    //   "UPDATE users SET avatar = ? WHERE id = ?",
    //   [avatarPath, userId]
    // );

    res.json({
      status: "success",
      avatar: avatarPath,
      message: "Avatar uploaded successfully",
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Get user preferences
const getPreferences = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const [prefs] = await pool.execute(
      `SELECT * FROM user_preferences WHERE user_id = ?`,
      [userId],
    );

    if (prefs.length === 0) {
      // Return default preferences if none exist
      return res.json({
        status: "success",
        preferences: {
          theme: "light",
          layout: "compact",
          notification_sound: "default",
          language: "en",
          show_avatars: true,
          show_notifications_badge: true,
          auto_save_progress: true,
          email_course_updates: true,
          email_exam_schedules: true,
          email_grade_releases: true,
          email_certificate_completion: true,
          inapp_new_messages: true,
          inapp_assignment_deadlines: true,
          inapp_announcements: true,
        },
      });
    }

    res.json({
      status: "success",
      preferences: prefs[0],
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Update user preferences
const updatePreferences = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const {
      theme,
      layout,
      notification_sound,
      language,
      show_avatars,
      show_notifications_badge,
      auto_save_progress,
      email_course_updates,
      email_exam_schedules,
      email_grade_releases,
      email_certificate_completion,
      inapp_new_messages,
      inapp_assignment_deadlines,
      inapp_announcements,
    } = req.body;

    // Check if preferences exist
    const [existing] = await pool.execute(
      "SELECT id FROM user_preferences WHERE user_id = ?",
      [userId],
    );

    if (existing.length > 0) {
      // Update existing preferences
      await pool.execute(
        `UPDATE user_preferences SET 
          theme = ?, layout = ?, notification_sound = ?, language = ?,
          show_avatars = ?, show_notifications_badge = ?, auto_save_progress = ?,
          email_course_updates = ?, email_exam_schedules = ?, email_grade_releases = ?,
          email_certificate_completion = ?, inapp_new_messages = ?,
          inapp_assignment_deadlines = ?, inapp_announcements = ?
        WHERE user_id = ?`,
        [
          theme,
          layout,
          notification_sound,
          language,
          show_avatars,
          show_notifications_badge,
          auto_save_progress,
          email_course_updates,
          email_exam_schedules,
          email_grade_releases,
          email_certificate_completion,
          inapp_new_messages,
          inapp_assignment_deadlines,
          inapp_announcements,
          userId,
        ],
      );
    } else {
      // Insert new preferences
      await pool.execute(
        `INSERT INTO user_preferences (
          user_id, theme, layout, notification_sound, language,
          show_avatars, show_notifications_badge, auto_save_progress,
          email_course_updates, email_exam_schedules, email_grade_releases,
          email_certificate_completion, inapp_new_messages,
          inapp_assignment_deadlines, inapp_announcements
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          theme,
          layout,
          notification_sound,
          language,
          show_avatars,
          show_notifications_badge,
          auto_save_progress,
          email_course_updates,
          email_exam_schedules,
          email_grade_releases,
          email_certificate_completion,
          inapp_new_messages,
          inapp_assignment_deadlines,
          inapp_announcements,
        ],
      );
    }

    res.json({
      status: "success",
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
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
