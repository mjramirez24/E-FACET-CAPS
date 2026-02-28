const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middlewares/authMiddleware");

const tesdaPublicController = require("../controllers/tesdaPublicController");
const tesdaScheduleController = require("../controllers/tesdaScheduleController");
const tesdaReservationController = require("../controllers/tesdaReservationController");

// courses
router.get("/courses", tesdaPublicController.getActiveCourses);

// schedules with slots
router.get("/schedules", tesdaScheduleController.listSchedulesByCourse);

// reservations (student)
router.get(
  "/my-reservations",
  requireAuth,
  tesdaReservationController.myReservations,
);
router.post(
  "/reservations",
  requireAuth,
  tesdaReservationController.createReservation,
);

module.exports = router;
