const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { sendPasswordResetCode } = require('../services/emailService');

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/auth/forgot-password
exports.requestReset = async (req, res) => {
  try {
    const identifier = String(req.body.identifier || '').trim().toLowerCase();

    if (!identifier) {
      return res.status(400).json({ status: 'error', message: 'Username or email is required.' });
    }

    const [rows] = await pool.execute(
      `SELECT id, fullname, email FROM users WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1`,
      [identifier, identifier]
    );

    if (rows.length) {
      const user = rows[0];
      const code = generateCode();

      // ✅ let MySQL handle the time — avoids timezone mismatch
      await pool.execute(
        `UPDATE users SET reset_code = ?, reset_code_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?`,
        [code, user.id]
      );

      await sendPasswordResetCode(user.email, user.fullname, code);
    }

    return res.json({
      status: 'success',
      message: 'If that account exists, a verification code has been sent.',
    });
  } catch (err) {
    console.error('requestReset error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to send reset code.' });
  }
};

// POST /api/auth/verify-reset-code
exports.verifyCode = async (req, res) => {
  try {
    const identifier = String(req.body.identifier || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();

    if (!identifier || !code) {
      return res.status(400).json({ status: 'error', message: 'Username/email and code are required.' });
    }

    // ✅ compare expiry using MySQL NOW() — avoids timezone mismatch
    const [rows] = await pool.execute(
      `SELECT id, reset_code, reset_code_expires,
              (reset_code_expires > NOW()) AS is_valid
       FROM users
       WHERE LOWER(email) = ? OR LOWER(username) = ?
       LIMIT 1`,
      [identifier, identifier]
    );

    if (!rows.length) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired code.' });
    }

    const user = rows[0];

    if (!user.reset_code || user.reset_code !== code) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired code.' });
    }

    if (!user.is_valid) {
      return res.status(400).json({ status: 'error', message: 'Code has expired. Please request a new one.' });
    }

    return res.json({ status: 'success', message: 'Code verified.' });
  } catch (err) {
    console.error('verifyCode error:', err);
    return res.status(500).json({ status: 'error', message: 'Verification failed.' });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    
    const identifier = String(req.body.identifier || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    const newPassword = String(req.body.newPassword || '');

     console.log('resetPassword called:', { identifier, code, newPasswordLength: newPassword.length });

    if (!identifier || !code || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'All fields are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters.' });
    }

    // ✅ compare expiry using MySQL NOW()
    const [rows] = await pool.execute(
      `SELECT id, reset_code, reset_code_expires,
              (reset_code_expires > NOW()) AS is_valid
       FROM users
       WHERE LOWER(email) = ? OR LOWER(username) = ?
       LIMIT 1`,
      [identifier, identifier]
    );

    if (!rows.length) {
      return res.status(400).json({ status: 'error', message: 'Invalid request.' });
    }

    const user = rows[0];

    if (!user.reset_code || user.reset_code !== code) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired code.' });
    }

    if (!user.is_valid) {
      return res.status(400).json({ status: 'error', message: 'Code has expired. Please request a new one.' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await pool.execute(
      `UPDATE users SET password = ?, reset_code = NULL, reset_code_expires = NULL WHERE id = ?`,
      [hashed, user.id]
    );

    return res.json({ status: 'success', message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ status: 'error', message: 'Password reset failed.' });
  }
};