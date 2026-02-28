const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// helper
async function canMessage(senderId, receiverId) {
  const [[sender]] = await db.query("SELECT role FROM users WHERE id=?", [senderId]);
  const [[receiver]] = await db.query("SELECT role FROM users WHERE id=?", [receiverId]);

  if (!sender || !receiver) return false;
  if (sender.role === 'admin') return true;

  // Driving: instructor <-> students (same course)
  if (
    (sender.role === 'instructor' && receiver.role === 'student') ||
    (sender.role === 'student' && receiver.role === 'instructor') ||
    (sender.role === 'student' && receiver.role === 'student')
  ) {
    const [rows] = await db.query(`
      SELECT 1 FROM driving_enrollments d1
      JOIN driving_enrollments d2 ON d1.course_id = d2.course_id
      WHERE d1.user_id=? AND d2.user_id=?
    `, [senderId, receiverId]);
    if (rows.length) return true;
  }

  // TESDA: trainer <-> students (same batch)
  if (
    (sender.role === 'trainer' && receiver.role === 'student') ||
    (sender.role === 'student' && receiver.role === 'trainer')
  ) {
    const [rows] = await db.query(`
      SELECT 1 FROM tesda_batches t1
      JOIN tesda_batches t2 ON t1.batch_id = t2.batch_id
      WHERE t1.user_id=? AND t2.user_id=?
    `, [senderId, receiverId]);
    if (rows.length) return true;
  }

  return false;
}

// Send message (create convo if none)
router.post("/send-direct", async (req, res) => {
  const senderId = req.session.user.id;
  const { receiverId, message } = req.body;

  if (!await canMessage(senderId, receiverId)) {
    return res.status(403).json({ message: "Not allowed to message this user." });
  }

  // find existing convo
  let [[convo]] = await db.query(`
    SELECT c.id FROM conversations c
    JOIN conversation_participants p1 ON p1.conversation_id = c.id
    JOIN conversation_participants p2 ON p2.conversation_id = c.id
    WHERE p1.user_id=? AND p2.user_id=?
  `, [senderId, receiverId]);

  if (!convo) {
    const [{ insertId }] = await db.query(`INSERT INTO conversations (course_type, course_id) VALUES ('driving', 0)`);
    const [[sender]] = await db.query("SELECT role FROM users WHERE id=?", [senderId]);
    const [[receiver]] = await db.query("SELECT role FROM users WHERE id=?", [receiverId]);

    await db.query(`
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES (?, ?, ?), (?, ?, ?)
    `, [insertId, senderId, sender.role, insertId, receiverId, receiver.role]);

    convo = { id: insertId };
  }

  const [[sender]] = await db.query("SELECT role FROM users WHERE id=?", [senderId]);

  await db.query(`
    INSERT INTO messages (conversation_id, sender_id, sender_role, message)
    VALUES (?, ?, ?, ?)
  `, [convo.id, senderId, sender.role, message]);

  res.json({ success: true, conversationId: convo.id });
});

module.exports = router;