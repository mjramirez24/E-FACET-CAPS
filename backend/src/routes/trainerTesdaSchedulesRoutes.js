// backend/src/routes/trainerTesdaSchedulesRoutes.js
const express = require("express");
const router = express.Router();

const { requireTrainer } = require("../middlewares/authMiddleware");

// ✅ destructure para siguradong function
const {
  listSchedulesByCourse,
} = require("../controllers/trainerTesdaSchedulesController");

// protect these endpoints
router.use(requireTrainer);

// /api/trainer/tesda/schedules?course_id=123
router.get("/tesda/schedules", listSchedulesByCourse);

module.exports = router;
