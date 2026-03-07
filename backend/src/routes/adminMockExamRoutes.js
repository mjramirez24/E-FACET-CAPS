// backend/src/routes/adminMockExamRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");

// ================= MIDDLEWARE =================
router.use(requireAuth);
router.use(requireAdmin);

// ================= QUESTION BANK MANAGEMENT =================

// Get all questions from question_bank
router.get("/questions", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        topic,
        symbol,
        stem_en,
        stem_tl,
        choice_a_en,
        choice_a_tl,
        choice_b_en,
        choice_b_tl,
        choice_c_en,
        choice_c_tl,
        correct_key,
        rationale_en,
        rationale_tl,
        is_active,
        created_at,
        updated_at
      FROM question_bank
      ORDER BY created_at DESC
    `);

    // Parse topic JSON for each question
    const formattedQuestions = rows.map(q => {
      let topicArray = [];
      
      if (q.topic) {
        try {
          // Try to parse as JSON if it's a string
          if (typeof q.topic === 'string') {
            if (q.topic.startsWith('[')) {
              topicArray = JSON.parse(q.topic);
            } else {
              // If it's a single topic, wrap in array
              topicArray = [q.topic];
            }
          } else if (Array.isArray(q.topic)) {
            topicArray = q.topic;
          }
        } catch (e) {
          console.error('Error parsing topic for question', q.id, e);
          topicArray = [q.topic];
        }
      }
      
      return {
        ...q,
        topic: topicArray
      };
    });

    res.json({
      status: "success",
      data: formattedQuestions
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch questions"
    });
  }
});

// Get single question
router.get("/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT * FROM question_bank WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Question not found"
      });
    }

    const question = rows[0];
    
    // Parse topic
    let topicArray = [];
    if (question.topic) {
      try {
        if (typeof question.topic === 'string' && question.topic.startsWith('[')) {
          topicArray = JSON.parse(question.topic);
        } else if (typeof question.topic === 'string') {
          topicArray = [question.topic];
        } else if (Array.isArray(question.topic)) {
          topicArray = question.topic;
        }
      } catch (e) {
        topicArray = [question.topic];
      }
    }
    
    question.topic = topicArray;

    res.json({
      status: "success",
      data: question
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch question"
    });
  }
});

// Create new question
router.post("/questions", async (req, res) => {
  try {
    const {
      topics, // this should be an array
      symbol,
      stem_en,
      stem_tl,
      choice_a_en,
      choice_a_tl,
      choice_b_en,
      choice_b_tl,
      choice_c_en,
      choice_c_tl,
      correct_key,
      rationale_en,
      rationale_tl,
      is_active = 1
    } = req.body;

    // Validate required fields
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "At least one topic is required"
      });
    }

    if (!stem_en || !stem_tl) {
      return res.status(400).json({
        status: "error",
        message: "Both English and Tagalog questions are required"
      });
    }

    if (!choice_a_en || !choice_a_tl || !choice_b_en || !choice_b_tl || !choice_c_en || !choice_c_tl) {
      return res.status(400).json({
        status: "error",
        message: "All choices in both languages are required"
      });
    }

    if (!correct_key || !['a', 'b', 'c'].includes(correct_key)) {
      return res.status(400).json({
        status: "error",
        message: "Valid correct answer (a, b, or c) is required"
      });
    }

    // Convert topics array to JSON string for storage
    const topicJson = JSON.stringify(topics);

    const [result] = await pool.execute(`
      INSERT INTO question_bank (
        topic, symbol, stem_en, stem_tl,
        choice_a_en, choice_a_tl, choice_b_en, choice_b_tl, choice_c_en, choice_c_tl,
        correct_key, rationale_en, rationale_tl, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      topicJson, symbol || null, stem_en, stem_tl,
      choice_a_en, choice_a_tl, choice_b_en, choice_b_tl, choice_c_en, choice_c_tl,
      correct_key, rationale_en || null, rationale_tl || null, is_active
    ]);

    res.status(201).json({
      status: "success",
      message: "Question created successfully",
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create question"
    });
  }
});

// Update question
router.put("/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      topics,
      symbol,
      stem_en,
      stem_tl,
      choice_a_en,
      choice_a_tl,
      choice_b_en,
      choice_b_tl,
      choice_c_en,
      choice_c_tl,
      correct_key,
      rationale_en,
      rationale_tl,
      is_active
    } = req.body;

    // Validate required fields
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "At least one topic is required"
      });
    }

    // Convert topics array to JSON string for storage
    const topicJson = JSON.stringify(topics);

    const [result] = await pool.execute(`
      UPDATE question_bank SET
        topic = ?,
        symbol = ?,
        stem_en = ?,
        stem_tl = ?,
        choice_a_en = ?,
        choice_a_tl = ?,
        choice_b_en = ?,
        choice_b_tl = ?,
        choice_c_en = ?,
        choice_c_tl = ?,
        correct_key = ?,
        rationale_en = ?,
        rationale_tl = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      topicJson, symbol || null, stem_en, stem_tl,
      choice_a_en, choice_a_tl, choice_b_en, choice_b_tl, choice_c_en, choice_c_tl,
      correct_key, rationale_en || null, rationale_tl || null, is_active,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Question not found"
      });
    }

    res.json({
      status: "success",
      message: "Question updated successfully"
    });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update question"
    });
  }
});

// Delete question
router.delete("/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(`
      DELETE FROM question_bank WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Question not found"
      });
    }

    res.json({
      status: "success",
      message: "Question deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete question"
    });
  }
});

// ================= EXAM STATISTICS =================

// Get exam stats for dashboard
router.get("/stats", async (req, res) => {
  try {
    // Get total questions count
    const [totalQuestions] = await pool.execute(`
      SELECT COUNT(*) as count FROM question_bank
    `);
    
    // Get active questions count
    const [activeQuestions] = await pool.execute(`
      SELECT COUNT(*) as count FROM question_bank WHERE is_active = 1
    `);
    
    // Get unique topics count
    const [topics] = await pool.execute(`
      SELECT topic FROM question_bank
    `);
    
    const uniqueTopics = new Set();
    topics.forEach(row => {
      if (row.topic) {
        try {
          if (typeof row.topic === 'string' && row.topic.startsWith('[')) {
            const topicArray = JSON.parse(row.topic);
            topicArray.forEach(t => uniqueTopics.add(t));
          } else if (typeof row.topic === 'string') {
            uniqueTopics.add(row.topic);
          }
        } catch (e) {
          uniqueTopics.add(row.topic);
        }
      }
    });

    // Get exam attempts stats (if you have an attempts table)
    // This is a placeholder - adjust based on your actual tables
    const [attempts] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT student_id) as total_students,
        COUNT(*) as total_attempts,
        AVG(score) as avg_score
      FROM mock_exam_attempts
    `).catch(() => [{ total_students: 0, total_attempts: 0, avg_score: 0 }]);

    const stats = {
      totalExams: 0, // If you have an exams table
      totalStudents: attempts[0]?.total_students || 0,
      totalAttempts: attempts[0]?.total_attempts || 0,
      averageScore: Math.round(attempts[0]?.avg_score || 0),
      totalQuestions: totalQuestions[0].count,
      activeQuestions: activeQuestions[0].count,
      uniqueTopics: uniqueTopics.size
    };

    res.json({
      status: "success",
      data: stats
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch stats"
    });
  }
});

// Get all exams (if you have an exams table)
router.get("/exams", async (req, res) => {
  try {
    // This is a placeholder - adjust based on your actual tables
    const [exams] = await pool.execute(`
      SELECT 
        id,
        title,
        description,
        created_at
      FROM mock_exams
      ORDER BY created_at DESC
    `).catch(() => []);

    res.json({
      status: "success",
      data: exams
    });
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch exams"
    });
  }
});

// Get recent attempts
router.get("/recent-attempts", async (req, res) => {
  try {
    // This is a placeholder - adjust based on your actual tables
    const [attempts] = await pool.execute(`
      SELECT 
        a.id,
        u.fullname as studentName,
        e.title as examTitle,
        a.score,
        a.correct_answers,
        a.total_questions,
        a.created_at as date,
        s.avg_score as studentAvgScore,
        s.attempt_count as attemptCount
      FROM mock_exam_attempts a
      JOIN users u ON u.id = a.student_id
      JOIN mock_exams e ON e.id = a.exam_id
      LEFT JOIN (
        SELECT 
          student_id,
          AVG(score) as avg_score,
          COUNT(*) as attempt_count
        FROM mock_exam_attempts
        GROUP BY student_id
      ) s ON s.student_id = a.student_id
      ORDER BY a.created_at DESC
      LIMIT 50
    `).catch(() => []);

    res.json({
      status: "success",
      data: attempts
    });
  } catch (error) {
    console.error("Error fetching attempts:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch attempts"
    });
  }
});

module.exports = router;