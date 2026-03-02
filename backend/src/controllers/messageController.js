// src/controllers/messageController.js
const pool = require("../config/database");

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.session.user_id;
    const { receiver_id, message } = req.body;

    if (!senderId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not logged in" });
    }
    if (!receiver_id || !message) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing fields" });
    }

    const [conversationRows] = await pool.query(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
       JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
       LIMIT 1`,
      [senderId, receiver_id],
    );

    let conversationId;

    if (conversationRows.length === 0) {
      const [result] = await pool.query(
        `INSERT INTO conversations (course_type, course_id) VALUES ('driving', 0)`,
      );
      conversationId = result.insertId;

      const [[senderRow]] = await pool.query(
        "SELECT role FROM users WHERE id = ?",
        [senderId],
      );
      const [[receiverRow]] = await pool.query(
        "SELECT role FROM users WHERE id = ?",
        [receiver_id],
      );

      await pool.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, role)
         VALUES (?, ?, ?), (?, ?, ?)`,
        [
          conversationId,
          senderId,
          senderRow.role,
          conversationId,
          receiver_id,
          receiverRow.role,
        ],
      );
    } else {
      conversationId = conversationRows[0].id;
    }

    const [[senderRow]] = await pool.query(
      "SELECT role FROM users WHERE id = ?",
      [senderId],
    );

    await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, sender_role, message)
       VALUES (?, ?, ?, ?)`,
      [conversationId, senderId, senderRow.role, message],
    );

    res.json({ status: "ok", message: "Message sent" });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

exports.getInbox = async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not logged in" });
    }

    const [rows] = await pool.query(
      `
      SELECT
        u.id,
        u.fullname AS name,
        u.role,
        MAX(m.created_at) AS last_message_time,
        (
          SELECT m2.message
          FROM messages m2
          WHERE m2.conversation_id = c.id
          ORDER BY m2.created_at DESC
          LIMIT 1
        ) AS last_message,
        (
          SELECT COUNT(*)
          FROM messages m3
          WHERE m3.conversation_id = c.id
            AND m3.sender_id != ?
            AND m3.created_at > COALESCE(
              (SELECT last_read_at FROM conversation_participants
               WHERE conversation_id = c.id AND user_id = ?),
              '1970-01-01'
            )
        ) AS unread_count
      FROM conversation_participants cp
      JOIN conversations c ON cp.conversation_id = c.id
      JOIN conversation_participants cp2
        ON c.id = cp2.conversation_id AND cp2.user_id != cp.user_id
      JOIN users u ON cp2.user_id = u.id
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE cp.user_id = ?
      GROUP BY u.id, u.fullname, u.role, c.id
      ORDER BY last_message_time DESC
      `,
      [userId, userId, userId],
    );

    const formattedRows = rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      type: row.role,
      lastMessage: row.last_message || "",
      lastMessageTime: row.last_message_time,
      unreadCount: Number(row.unread_count) || 0,
      status: Number(row.unread_count) > 0 ? "unread" : "read",
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error("getInbox error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

exports.getThread = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const otherUserId = req.params.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not logged in" });
    }

    const [convRows] = await pool.query(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
       JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
       LIMIT 1`,
      [userId, otherUserId],
    );

    if (convRows.length === 0) {
      return res.json([]);
    }

    const conversationId = convRows[0].id;

    await pool.query(
      `UPDATE conversation_participants
       SET last_read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId],
    );

    const [rows] = await pool.query(
      `SELECT m.*, u.fullname AS sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId],
    );

    const formattedMessages = rows.map((msg) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      sender: msg.sender_role,
      text: msg.message,
      timestamp: msg.created_at,
    }));

    res.json(formattedMessages);
  } catch (err) {
    console.error("getThread error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { conversationId } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not logged in" });
    }

    await pool.query(
      `UPDATE conversation_participants
       SET last_read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId],
    );

    res.json({ status: "ok", message: "Marked as read" });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

exports.getContacts = async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not logged in" });
    }

    const [[me]] = await pool.query(
      "SELECT role, track_id FROM users WHERE id = ?",
      [userId],
    );

    let rows = [];

    if (me.role === "admin") {
      [rows] = await pool.query(
        "SELECT id, fullname AS name, role FROM users WHERE id != ? ORDER BY role, fullname",
        [userId],
      );
    } else if (me.role === "user" || me.role === "student") {
      const trackId = me.track_id;

      if (trackId === 1) {
        [rows] = await pool.query(
          `SELECT id, fullname AS name, role
           FROM users
           WHERE (role IN ('admin', 'instructor') OR (role = 'user' AND track_id = 1 AND id != ?))
           AND id != ?
           ORDER BY role, fullname`,
          [userId, userId],
        );
      } else if (trackId === 2) {
        [rows] = await pool.query(
          `SELECT id, fullname AS name, role
           FROM users
           WHERE (role = 'admin' OR role = 'trainer' OR (role = 'user' AND track_id = 2 AND id != ?))
           AND id != ?
           ORDER BY role, fullname`,
          [userId, userId],
        );
      } else {
        [rows] = await pool.query(
          "SELECT id, fullname AS name, role FROM users WHERE role = 'admin' ORDER BY fullname",
        );
      }
    } else if (me.role === "instructor") {
      [rows] = await pool.query(
        `SELECT id, fullname AS name, role
         FROM users
         WHERE role IN ('admin', 'user', 'instructor')
         AND id != ?
         ORDER BY role, fullname`,
        [userId],
      );
    } else if (me.role === "trainer") {
      // Trainers: all admins + all other trainers + all TESDA students (track_id = 2)
      [rows] = await pool.query(
        `SELECT id, fullname AS name, role
         FROM users
         WHERE (
           role IN ('admin', 'trainer')
           OR (role = 'user' AND track_id = 2)
         )
         AND id != ?
         ORDER BY role, fullname`,
        [userId],
      );
    } else {
      [rows] = await pool.query(
        "SELECT id, fullname AS name, role FROM users WHERE role = 'admin' ORDER BY fullname",
      );
    }

    res.json(rows);
  } catch (err) {
    console.error("getContacts error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};
