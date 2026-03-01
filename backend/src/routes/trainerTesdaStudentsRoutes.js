// backend/src/routes/trainerTesdaStudentsRoutes.js
const express = require("express");
const router = express.Router();

const { requireTrainer } = require("../middlewares/authMiddleware");
const trainerTesdaStudentsController = require("../controllers/trainerTesdaStudentsController");

// protect all routes under this file
router.use(requireTrainer);

// GET /api/trainer/tesda/students
router.get(
  "/tesda/students",
  trainerTesdaStudentsController.listMyTesdaStudents,
);

module.exports = router;
