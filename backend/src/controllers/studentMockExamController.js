// backend/src/controllers/studentMockExamController.js
const pool = require('../config/database');

// ─────────────────────────────────────────────────────────────
// GET /api/student/mock-exam/questions
// Returns ALL active questions from DB (replaces question_bank.json)
// ─────────────────────────────────────────────────────────────
exports.getQuestions = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, topic, stem_en, stem_tl,
              choice_a_en, choice_a_tl,
              choice_b_en, choice_b_tl,
              choice_c_en, choice_c_tl,
              correct_key, rationale_en, rationale_tl, symbol
       FROM question_bank
       WHERE is_active = 1
       ORDER BY id ASC`
    );

    // Shape into same format the Vue component expects
    const questions = rows.map(r => ({
      id: r.id,
      topic: typeof r.topic === 'string' ? JSON.parse(r.topic) : r.topic,
      stem: { en: r.stem_en, tl: r.stem_tl },
      choices: [
        { key: 'a', en: r.choice_a_en, tl: r.choice_a_tl },
        { key: 'b', en: r.choice_b_en, tl: r.choice_b_tl },
        { key: 'c', en: r.choice_c_en, tl: r.choice_c_tl },
      ],
      correct_key: r.correct_key,
      rationale: { en: r.rationale_en || '', tl: r.rationale_tl || '' },
      symbol: r.symbol || null,
    }));

    return res.json({ status: 'success', data: questions });
  } catch (err) {
    console.error('getQuestions error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch questions.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/student/mock-exam/attempts
// Save one completed attempt + upsert mastery map
// ─────────────────────────────────────────────────────────────
exports.saveAttempt = async (req, res) => {
  try {
    const studentId = Number(req.session.user_id);
    if (!studentId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const {
      exam_id,
      exam_title,
      score,
      total_questions,
      correct_answers,
      answers,
      retake_question_ids = null,
      questions,
      language = 'en',
    } = req.body;

    if (!exam_id || !exam_title || !Array.isArray(answers) || !Array.isArray(questions)) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [insertResult] = await conn.execute(
        `INSERT INTO student_exam_attempts
           (student_id, exam_id, exam_title, score, total_questions,
            correct_answers, answers, retake_question_ids, language, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          studentId,
          exam_id,
          exam_title,
          score ?? 0,
          total_questions ?? questions.length,
          correct_answers ?? 0,
          JSON.stringify(answers),
          retake_question_ids ? JSON.stringify(retake_question_ids) : null,
          language,
        ]
      );

      const attemptId = insertResult.insertId;

      // Upsert mastery for every question answered in this attempt
      for (let i = 0; i < questions.length; i++) {
        const q   = questions[i];
        const ans = answers[i] ?? null;
        const isCorrect = ans && ans.toLowerCase() === q.correct_key?.toLowerCase() ? 1 : 0;

        await conn.execute(
          `INSERT INTO student_question_mastery
             (student_id, exam_id, question_id, last_answer, is_correct)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             last_answer = VALUES(last_answer),
             is_correct  = VALUES(is_correct),
             updated_at  = NOW()`,
          [studentId, exam_id, q.id, ans, isCorrect]
        );
      }

      await conn.commit();

      return res.status(201).json({
        status: 'success',
        data: {
          id: attemptId,
          student_id: studentId,
          exam_id,
          exam_title,
          score,
          total_questions,
          correct_answers,
          answers,
          retake_question_ids,
          language,
          completed_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('saveAttempt error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to save attempt.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/student/mock-exam/attempts
// Returns all attempts + full mastery map for logged-in student
// ─────────────────────────────────────────────────────────────
exports.getAttempts = async (req, res) => {
  try {
    const studentId = Number(req.session.user_id);
    if (!studentId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const [attempts] = await pool.execute(
      `SELECT id, exam_id, exam_title, score, total_questions, correct_answers,
              answers, retake_question_ids, language, completed_at
       FROM   student_exam_attempts
       WHERE  student_id = ?
       ORDER  BY completed_at DESC`,
      [studentId]
    );

    const parsed = attempts.map(a => ({
      ...a,
      answers: typeof a.answers === 'string' ? JSON.parse(a.answers) : a.answers,
      retake_question_ids: a.retake_question_ids
        ? (typeof a.retake_question_ids === 'string'
            ? JSON.parse(a.retake_question_ids)
            : a.retake_question_ids)
        : null,
      completed_at: a.completed_at instanceof Date
        ? a.completed_at.toISOString()
        : a.completed_at,
    }));

    // Mastery: { 'quiz-0': { 'Q001': { answer, correct }, ... } }
    const [masteryRows] = await pool.execute(
      `SELECT exam_id, question_id, last_answer, is_correct
       FROM   student_question_mastery
       WHERE  student_id = ?`,
      [studentId]
    );

    const mastery = {};
    for (const row of masteryRows) {
      if (!mastery[row.exam_id]) mastery[row.exam_id] = {};
      mastery[row.exam_id][row.question_id] = {
        answer:  row.last_answer,
        correct: !!row.is_correct,
      };
    }

    return res.json({ status: 'success', data: { attempts: parsed, mastery } });
  } catch (err) {
    console.error('getAttempts error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch attempts.' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/student/mock-exam/attempts/:examId
// Delete all attempts + mastery for one quiz
// ─────────────────────────────────────────────────────────────
exports.deleteAttemptsByExam = async (req, res) => {
  try {
    const studentId = Number(req.session.user_id);
    if (!studentId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const { examId } = req.params;
    if (!examId) return res.status(400).json({ status: 'error', message: 'examId is required.' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `DELETE FROM student_exam_attempts    WHERE student_id = ? AND exam_id = ?`,
        [studentId, examId]
      );
      await conn.execute(
        `DELETE FROM student_question_mastery WHERE student_id = ? AND exam_id = ?`,
        [studentId, examId]
      );
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return res.json({ status: 'success', message: 'Quiz results deleted.' });
  } catch (err) {
    console.error('deleteAttemptsByExam error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to delete results.' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/student/mock-exam/attempts
// Clear ALL attempts + mastery for logged-in student
// ─────────────────────────────────────────────────────────────
exports.clearAllAttempts = async (req, res) => {
  try {
    const studentId = Number(req.session.user_id);
    if (!studentId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `DELETE FROM student_exam_attempts    WHERE student_id = ?`, [studentId]
      );
      await conn.execute(
        `DELETE FROM student_question_mastery WHERE student_id = ?`, [studentId]
      );
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return res.json({ status: 'success', message: 'All results cleared.' });
  } catch (err) {
    console.error('clearAllAttempts error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to clear results.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/student/mock-exam/language
// ─────────────────────────────────────────────────────────────
exports.updateLanguage = async (req, res) => {
  try {
    const studentId = Number(req.session.user_id);
    if (!studentId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const { language } = req.body;
    if (!['en', 'tl'].includes(language)) {
      return res.status(400).json({ status: 'error', message: 'Invalid language. Use en or tl.' });
    }

    await pool.execute(
      `INSERT INTO student_preferences (student_id, preferred_language)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         preferred_language = VALUES(preferred_language),
         updated_at         = NOW()`,
      [studentId, language]
    );

    return res.json({ status: 'success', data: { language } });
  } catch (err) {
    console.error('updateLanguage error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to update language.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/student/mock-exam/language
// ─────────────────────────────────────────────────────────────
exports.getLanguage = async (req, res) => {
  try {
    const studentId = Number(req.session.user_id);
    if (!studentId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const [rows] = await pool.execute(
      `SELECT preferred_language FROM student_preferences WHERE student_id = ?`,
      [studentId]
    );

    return res.json({
      status: 'success',
      data: { language: rows[0]?.preferred_language || 'en' },
    });
  } catch (err) {
    console.error('getLanguage error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch language.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/mock-exam/exams
// All distinct exam titles from student_exam_attempts
// ─────────────────────────────────────────────────────────────
exports.getAdminExamList = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
         exam_id                                    AS id,
         exam_title                                 AS title,
         COUNT(*)                                   AS totalAttempts,
         COUNT(DISTINCT student_id)                 AS uniqueStudents,
         ROUND(AVG(score), 1)                       AS avgScore,
         ROUND(MAX(score), 1)                       AS highestScore,
         MAX(completed_at)                          AS lastAttempt
       FROM student_exam_attempts
       GROUP BY exam_id, exam_title
       ORDER BY exam_title ASC`
    );
    return res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error('getAdminExamList error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch exam list.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/mock-exam/recent-attempts
// Last 20 attempts across all students with student name
// ─────────────────────────────────────────────────────────────
exports.getAdminRecentAttempts = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         a.id,
         a.student_id,
         COALESCE(u.fullname, u.username, CONCAT('Student #', a.student_id)) AS studentName,
         a.exam_id,
         a.exam_title                                AS examTitle,
         a.score,
         a.correct_answers,
         a.total_questions,
         a.completed_at                              AS date,
         attempt_counts.totalAttempts                AS attemptCount,
         attempt_counts.avgScore                     AS studentAvgScore
       FROM student_exam_attempts a
       LEFT JOIN users u ON u.id = a.student_id
       INNER JOIN (
         SELECT student_id, exam_id,
                MAX(completed_at)      AS latest,
                COUNT(*)               AS totalAttempts,
                ROUND(AVG(score), 1)   AS avgScore
         FROM student_exam_attempts
         GROUP BY student_id, exam_id
       ) attempt_counts ON attempt_counts.student_id = a.student_id
                       AND attempt_counts.exam_id    = a.exam_id
                       AND attempt_counts.latest     = a.completed_at
       ORDER BY a.completed_at DESC
       LIMIT 50`
    );

    const parsed = rows.map(r => ({
      ...r,
      date: r.date instanceof Date ? r.date.toISOString() : r.date,
    }));

    return res.json({ status: 'success', data: parsed });
  } catch (err) {
    console.error('getAdminRecentAttempts error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch recent attempts.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/mock-exam/stats
// Aggregate stats for the 4 stat cards
// ─────────────────────────────────────────────────────────────
exports.getAdminStats = async (req, res) => {
  try {
    const [[totals]] = await pool.execute(
      `SELECT
         COUNT(DISTINCT exam_id)       AS totalExams,
         COUNT(DISTINCT student_id)    AS totalStudents,
         COUNT(*)                      AS totalAttempts,
         ROUND(AVG(score), 1)          AS averageScore
       FROM student_exam_attempts`
    );
    return res.json({
      status: 'success',
      data: {
        totalExams:    totals.totalExams    || 0,
        totalStudents: totals.totalStudents || 0,
        totalAttempts: totals.totalAttempts || 0,
        averageScore:  totals.averageScore  || 0,
      }
    });
  } catch (err) {
    console.error('getAdminStats error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch stats.' });
  }
};
exports.addQuestion = async (req, res) => {
  try {
    const {
      topic,
      symbol,
      stem_en, stem_tl,
      choice_a_en, choice_a_tl,
      choice_b_en, choice_b_tl,
      choice_c_en, choice_c_tl,
      correct_key,
      rationale_en, rationale_tl,
      is_active = 1,
    } = req.body;

    // Basic validation
    if (!stem_en || !stem_tl || !correct_key ||
        !choice_a_en || !choice_b_en || !choice_c_en) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO question_bank
         (topic, symbol,
          stem_en, stem_tl,
          choice_a_en, choice_a_tl,
          choice_b_en, choice_b_tl,
          choice_c_en, choice_c_tl,
          correct_key,
          rationale_en, rationale_tl,
          is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        JSON.stringify(Array.isArray(topic) ? topic : [topic]),
        symbol   || null,
        stem_en,
        stem_tl,
        choice_a_en,
        choice_a_tl || null,
        choice_b_en,
        choice_b_tl || null,
        choice_c_en,
        choice_c_tl || null,
        correct_key.toLowerCase(),
        rationale_en || null,
        rationale_tl || null,
        is_active ? 1 : 0,
      ]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Question added successfully.',
      data: { id: result.insertId },
    });
  } catch (err) {
    console.error('addQuestion error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to add question.' });
  }
};
// GET /api/admin/mock-exam/questions  — all questions (active + inactive)
exports.getAdminQuestions = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, topic, stem_en, stem_tl,
              choice_a_en, choice_a_tl, choice_b_en, choice_b_tl, choice_c_en, choice_c_tl,
              correct_key, rationale_en, rationale_tl, symbol, is_active, created_at
       FROM question_bank ORDER BY id DESC`
    )
    return res.json({ status: 'success', data: rows })
  } catch(err) {
    console.error('getAdminQuestions error:', err)
    return res.status(500).json({ status: 'error', message: 'Failed to fetch questions.' })
  }
}

// PUT /api/admin/mock-exam/questions/:id  — update question
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params
    const { topic, symbol, stem_en, stem_tl, choice_a_en, choice_a_tl,
            choice_b_en, choice_b_tl, choice_c_en, choice_c_tl,
            correct_key, rationale_en, rationale_tl, is_active } = req.body

    await pool.execute(
      `UPDATE question_bank SET
         topic=?, symbol=?, stem_en=?, stem_tl=?,
         choice_a_en=?, choice_a_tl=?, choice_b_en=?, choice_b_tl=?,
         choice_c_en=?, choice_c_tl=?, correct_key=?,
         rationale_en=?, rationale_tl=?, is_active=?
       WHERE id=?`,
      [
        JSON.stringify(Array.isArray(topic) ? topic : [topic]),
        symbol||null, stem_en, stem_tl,
        choice_a_en, choice_a_tl||null, choice_b_en, choice_b_tl||null,
        choice_c_en, choice_c_tl||null, correct_key.toLowerCase(),
        rationale_en||'', rationale_tl||'', is_active?1:0, id
      ]
    )
    return res.json({ status: 'success', message: 'Question updated.' })
  } catch(err) {
    console.error('updateQuestion error:', err)
    return res.status(500).json({ status: 'error', message: 'Failed to update question.' })
  }
}

// DELETE /api/admin/mock-exam/questions/:id
exports.deleteQuestion = async (req, res) => {
  try {
    await pool.execute(`DELETE FROM question_bank WHERE id=?`, [req.params.id])
    return res.json({ status: 'success', message: 'Question deleted.' })
  } catch(err) {
    console.error('deleteQuestion error:', err)
    return res.status(500).json({ status: 'error', message: 'Failed to delete question.' })
  }
}