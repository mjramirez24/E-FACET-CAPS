// backend/src/routes/trainerDashboardRoutes.js
const express = require("express");
const router = express.Router();

const {
  requireAuth,
  requireTrainer,
} = require("../middlewares/authMiddleware");
const {
  getTrainerDashboardSummary,
} = require("../controllers/trainerDashboardController");

router.use(requireAuth);
router.use(requireTrainer);

router.get("/dashboard/summary", getTrainerDashboardSummary);

module.exports = router;
