// src/controllers/messageController.js
const pool = require("../config/database");

function getSessionUserId(req) {
  const v =
    req?.session?.user_id ??
    req?.session?.user?.user_id ??
    req?.session?.user?.id ??
    null;

  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeMessagingRole(role) {
  const value = String(role || "")
    .trim()
    .toLowerCase();

  // users table may use "user" or "student"
  // conversation_participants only accepts "student"
  if (value === "user" || value === "student") {
    return "student";
  }

  if (["admin", "trainer", "instructor"].includes(value)) {
    return value;
  }

  return null;
}

exports.sendMessage = async (req, res) => {
  let connection;

  try {
    const senderId = getSessionUserId(req);
    const receiverId = Number(req.body?.receiver_id);
    const message = String(req.body?.message || "").trim();

    if (!senderId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not logged in" });
    }

    if (!Number.isFinite(receiverId) || receiverId <= 0 || !message) {
      return res.status(400).json({
        status: "error",
        message: "Missing or invalid fields",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [[senderRow]] = await connection.query(
      "SELECT id, role FROM users WHERE id = ?",
      [senderId],
    );

    const [[receiverRow]] = await connection.query(
      "SELECT id, role FROM users WHERE id = ?",
      [receiverId],
    );

    if (!senderRow || !receiverRow) {
      await connection.rollback();

      return res.status(404).json({
        status: "error",
        message: "Sender or receiver account not found",
      });
    }

    const senderMessagingRole = normalizeMessagingRole(senderRow.role);
    const receiverMessagingRole = normalizeMessagingRole(receiverRow.role);

    if (!senderMessagingRole || !receiverMessagingRole) {
      await connection.rollback();

      return res.status(400).json({
        status: "error",
        message: "Unsupported account role for messaging",
      });
    }

    const [conversationRows] = await connection.query(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_participants cp1
         ON c.id = cp1.conversation_id
        AND cp1.user_id = ?
       JOIN conversation_participants cp2
         ON c.id = cp2.conversation_id
        AND cp2.user_id = ?
       LIMIT 1`,
      [senderId, receiverId],
    );

    let conversationId;

    if (conversationRows.length === 0) {
      const [result] = await connection.query(
        `INSERT INTO conversations (course_type, course_id)
         VALUES ('driving', 0)`,
      );

      conversationId = result.insertId;

      await connection.query(
        `INSERT INTO conversation_participants
          (conversation_id, user_id, role)
         VALUES (?, ?, ?), (?, ?, ?)`,
        [
          conversationId,
          senderId,
          senderMessagingRole,

          conversationId,
          receiverId,
          receiverMessagingRole,
        ],
      );
    } else {
      conversationId = conversationRows[0].id;
    }

    await connection.query(
      `INSERT INTO messages
        (conversation_id, sender_id, sender_role, message)
       VALUES (?, ?, ?, ?)`,
      [conversationId, senderId, senderMessagingRole, message],
    );

    await connection.commit();

    return res.json({
      status: "ok",
      message: "Message sent",
      conversation_id: conversationId,
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("sendMessage rollback error:", rollbackErr);
      }
    }

    console.error("sendMessage error:", err);

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.getInbox = async (req, res) => {
  try {
    const userId = getSessionUserId(req);

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
              (
                SELECT last_read_at
                FROM conversation_participants
                WHERE conversation_id = c.id
                  AND user_id = ?
              ),
              '1970-01-01'
            )
        ) AS unread_count

      FROM conversation_participants cp

      JOIN conversations c
        ON cp.conversation_id = c.id

      JOIN conversation_participants cp2
        ON c.id = cp2.conversation_id
       AND cp2.user_id != cp.user_id

      JOIN users u
        ON cp2.user_id = u.id

      LEFT JOIN messages m
        ON c.id = m.conversation_id

      WHERE cp.user_id = ?

      GROUP BY
        u.id,
        u.fullname,
        u.role,
        c.id

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

    const [notifRows] = await pool.query(
      `SELECT id, type, title, body, created_at
       FROM notifications
       WHERE user_id = ?
         AND is_read = 0
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId],
    );

    const formattedNotifs = notifRows.map((n) => ({
      id: `notif-${n.id}`,
      name: n.title,
      role: null,
      type: n.type,
      lastMessage: n.body || "",
      lastMessageTime: n.created_at,
      unreadCount: 1,
      status: "unread",
    }));

    const combined = [...formattedNotifs, ...formattedRows].sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime),
    );

    return res.json(combined);
  } catch (err) {
    console.error("getInbox error:", err);

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

exports.getThread = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const otherUserId = Number(req.params.userId);

    if (!userId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not logged in" });
    }

    if (!Number.isFinite(otherUserId) || otherUserId <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID",
      });
    }

    const [convRows] = await pool.query(
      `SELECT c.id
       FROM conversations c

       JOIN conversation_participants cp1
         ON c.id = cp1.conversation_id
        AND cp1.user_id = ?

       JOIN conversation_participants cp2
         ON c.id = cp2.conversation_id
        AND cp2.user_id = ?

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
       WHERE conversation_id = ?
         AND user_id = ?`,
      [conversationId, userId],
    );

    const [rows] = await pool.query(
      `SELECT
         m.*,
         u.fullname AS sender_name
       FROM messages m

       JOIN users u
         ON m.sender_id = u.id

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

    return res.json(formattedMessages);
  } catch (err) {
    console.error("getThread error:", err);

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const conversationId = Number(req.body?.conversationId);

    if (!userId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not logged in" });
    }

    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid conversation ID",
      });
    }

    await pool.query(
      `UPDATE conversation_participants
       SET last_read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = ?
         AND user_id = ?`,
      [conversationId, userId],
    );

    return res.json({
      status: "ok",
      message: "Marked as read",
    });
  } catch (err) {
    console.error("markAsRead error:", err);

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

exports.getContacts = async (req, res) => {
  try {
    const userId = getSessionUserId(req);

    if (!userId) {
      return res
        .status(401)
        .json({ status: "error", message: "Not logged in" });
    }

    const [[me]] = await pool.query(
      "SELECT role, track_id FROM users WHERE id = ?",
      [userId],
    );

    if (!me) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    let rows = [];

    // ADMIN
    if (me.role === "admin") {
      [rows] = await pool.query(
        `SELECT
           id,
           fullname AS name,
           role
         FROM users
         WHERE id != ?
         ORDER BY role, fullname`,
        [userId],
      );
    }

    // USER / STUDENT
    else if (me.role === "user" || me.role === "student") {
      const trackId = Number(me.track_id);

      // DRIVING
      if (trackId === 1) {
        [rows] = await pool.query(
          `SELECT
             id,
             fullname AS name,
             role
           FROM users

           WHERE (
             role IN ('admin', 'instructor')

             OR (
               role IN ('user', 'student')
               AND track_id = 1
               AND id != ?
             )
           )

           AND id != ?

           ORDER BY role, fullname`,
          [userId, userId],
        );
      }

      // TESDA
      else if (trackId === 2) {
        [rows] = await pool.query(
          `SELECT
             id,
             fullname AS name,
             role
           FROM users

           WHERE (
             role IN ('admin', 'trainer')

             OR (
               role IN ('user', 'student')
               AND track_id = 2
               AND id != ?
             )
           )

           AND id != ?

           ORDER BY role, fullname`,
          [userId, userId],
        );
      }

      // NO TRACK
      else {
        [rows] = await pool.query(
          `SELECT
             id,
             fullname AS name,
             role
           FROM users

           WHERE role = 'admin'

           ORDER BY fullname`,
        );
      }
    }

    // INSTRUCTOR
    else if (me.role === "instructor") {
      [rows] = await pool.query(
        `SELECT
           id,
           fullname AS name,
           role
         FROM users

         WHERE role IN (
           'admin',
           'user',
           'student',
           'instructor'
         )

         AND id != ?

         ORDER BY role, fullname`,
        [userId],
      );
    }

    // TRAINER
    else if (me.role === "trainer") {
      [rows] = await pool.query(
        `SELECT
           id,
           fullname AS name,
           role
         FROM users

         WHERE (
           role IN ('admin', 'trainer')

           OR (
             role IN ('user', 'student')
             AND track_id = 2
           )
         )

         AND id != ?

         ORDER BY role, fullname`,
        [userId],
      );
    }

    // FALLBACK
    else {
      [rows] = await pool.query(
        `SELECT
           id,
           fullname AS name,
           role
         FROM users

         WHERE role = 'admin'

         ORDER BY fullname`,
      );
    }

    return res.json(rows);
  } catch (err) {
    console.error("getContacts error:", err);

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const otherUserId = Number(req.params.userId);

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Not logged in",
      });
    }

    if (!Number.isFinite(otherUserId) || otherUserId <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID",
      });
    }

    const [convRows] = await pool.query(
      `SELECT c.id
       FROM conversations c

       JOIN conversation_participants cp1
         ON c.id = cp1.conversation_id
        AND cp1.user_id = ?

       JOIN conversation_participants cp2
         ON c.id = cp2.conversation_id
        AND cp2.user_id = ?

       LIMIT 1`,
      [userId, otherUserId],
    );

    if (convRows.length === 0) {
      return res.json({
        status: "ok",
        message: "No conversation found",
      });
    }

    const conversationId = convRows[0].id;

    await pool.query("DELETE FROM messages WHERE conversation_id = ?", [
      conversationId,
    ]);

    await pool.query(
      `DELETE FROM conversation_participants
       WHERE conversation_id = ?`,
      [conversationId],
    );

    await pool.query("DELETE FROM conversations WHERE id = ?", [
      conversationId,
    ]);

    return res.json({
      status: "ok",
      message: "Conversation deleted",
    });
  } catch (err) {
    console.error("deleteConversation error:", err);

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const messageId = Number(req.params.id);
    const message = String(req.body?.message || "").trim();

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Not logged in",
      });
    }

    if (!Number.isFinite(messageId) || messageId <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid message ID",
      });
    }

    if (!message) {
      return res.status(400).json({
        status: "error",
        message: "Message text required",
      });
    }

    const [[existing]] = await pool.query(
      "SELECT sender_id FROM messages WHERE id = ?",
      [messageId],
    );

    if (!existing) {
      return res.status(404).json({
        status: "error",
        message: "Message not found",
      });
    }

    if (Number(existing.sender_id) !== Number(userId)) {
      return res.status(403).json({
        status: "error",
        message: "You can only edit your own messages",
      });
    }

    await pool.query("UPDATE messages SET message = ? WHERE id = ?", [
      message,
      messageId,
    ]);

    return res.json({
      status: "ok",
      message: "Message updated",
    });
  } catch (err) {
    console.error("editMessage error:", err);

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const messageId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Not logged in",
      });
    }

    if (!Number.isFinite(messageId) || messageId <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid message ID",
      });
    }

    const [[existing]] = await pool.query(
      "SELECT sender_id FROM messages WHERE id = ?",
      [messageId],
    );

    if (!existing) {
      return res.status(404).json({
        status: "error",
        message: "Message not found",
      });
    }

    if (Number(existing.sender_id) !== Number(userId)) {
      return res.status(403).json({
        status: "error",
        message: "You can only delete your own messages",
      });
    }

    await pool.query("DELETE FROM messages WHERE id = ?", [messageId]);

    return res.json({
      status: "ok",
      message: "Message deleted",
    });
  } catch (err) {
    console.error("deleteMessage error:", err);

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
