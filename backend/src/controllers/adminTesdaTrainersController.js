// backend/src/controllers/adminTesdaTrainersController.js
const pool = require("../config/database");

// helper
function normalizeStatus(s) {
  const v = String(s || "active").toLowerCase();
  return v === "inactive" ? "inactive" : "active";
}

async function getTrainers(req, res) {
  try {
   const activeOnly = req.query.active === "true";

      const [rows] = await pool.execute(
        `SELECT
          trainer_id,
          trainer_code,
          firstname,
          lastname,
          CONCAT(firstname, ' ', lastname) AS fullname,
          email,
          contact_number,
          specialization,
          status,
          created_at,
          updated_at,
          user_id
        FROM trainers
        ${activeOnly ? "WHERE status = 'active'" : ""}
        ORDER BY trainer_id DESC`
      );

    return res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("getTrainers error:", err);
    return res.status(500).json({ status: "error", message: "Failed to load TESDA trainers" });
  }
}

// ✅ POST /api/admin/tesda/trainers
async function createTrainer(req, res) {
  try {
    const {
      trainer_code,
      firstname,
      lastname,
      email,
      contact_number,
      specialization,
      status,
      user_id,
    } = req.body;

    if (!trainer_code || !firstname || !lastname) {
      return res.status(400).json({
        status: "error",
        message: "trainer_code, firstname, and lastname are required",
      });
    }

    const [result] = await pool.execute(
      `
      INSERT INTO trainers
        (trainer_code, firstname, lastname, email, contact_number, specialization, status, user_id)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        String(trainer_code).trim(),
        String(firstname).trim(),
        String(lastname).trim(),
        email ? String(email).trim() : null,
        contact_number ? String(contact_number).trim() : null,
        specialization ? String(specialization).trim() : null,
        normalizeStatus(status),
        user_id ? Number(user_id) : null,
      ]
    );

    return res.status(201).json({
      status: "success",
      message: "Trainer created",
      trainer_id: result.insertId,
    });
  } catch (err) {
    console.error("createTrainer error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to create trainer",
      debug: {
        code: err.code,
        sqlMessage: err.sqlMessage,
        message: err.message,
      },
    });
  }
}

async function updateTrainer(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ status: "error", message: "Invalid trainer id" });
    }

    const { trainer_code, firstname, lastname, email, contact_number, specialization, status, user_id } = req.body;

    const [result] = await pool.execute(
      `UPDATE trainers
       SET trainer_code = ?, firstname = ?, lastname = ?, email = ?,
           contact_number = ?, specialization = ?, status = ?, user_id = ?
       WHERE trainer_id = ?`,
      [
        String(trainer_code || "").trim(),
        String(firstname || "").trim(),
        String(lastname || "").trim(),
        email ? String(email).trim() : null,
        contact_number ? String(contact_number).trim() : null,
        specialization ? String(specialization).trim() : null,
        normalizeStatus(status),
        user_id ? Number(user_id) : null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Trainer not found" });
    }

    // ✅ If set to inactive, remove all course assignments
    if (normalizeStatus(status) === "inactive") {
      const assignTables = ["tesda_course_trainers", "course_trainers"];
      for (const tbl of assignTables) {
        const [tblExists] = await pool.query("SHOW TABLES LIKE ?", [tbl]);
        if (tblExists.length) {
          await pool.execute(`DELETE FROM ${tbl} WHERE trainer_id = ?`, [id]);
        }
      }
    }

    return res.json({ status: "success", message: "Trainer updated" });
  } catch (err) {
    console.error("updateTrainer error:", err);
    return res.status(500).json({ status: "error", message: "Failed to update trainer" });
  }
}

// ✅ DELETE /api/admin/tesda/trainers/:id
async function deleteTrainer(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ status: "error", message: "Invalid trainer id" });
    }

    const [result] = await pool.execute(
      `DELETE FROM trainers WHERE trainer_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Trainer not found" });
    }

    return res.json({ status: "success", message: "Trainer deleted" });
  } catch (err) {
    console.error("deleteTrainer error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete trainer",
      debug: {
        code: err.code,
        sqlMessage: err.sqlMessage,
        message: err.message,
      },
    });
  }
}

module.exports = {
  getTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
};
