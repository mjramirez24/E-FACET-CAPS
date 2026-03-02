// backend/src/routes/adminTesdaReportsRoutes.js
const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/adminTesdaReportsController");

// Optional: if may admin guard middleware ka, pwede mo i-enable
// const { requireAdmin } = require("../middleware/authMiddleware");
// router.use(requireAdmin);

router.get("/summary", ctrl.getSummary);
router.get("/trend", ctrl.getTrend);
router.get("/top-courses", ctrl.getTopCourses);
router.get("/gender-breakdown", ctrl.getGenderBreakdown);
router.get("/detailed", ctrl.getDetailed);

// exports
router.get("/export/overview", ctrl.exportOverview);
router.get("/export/top-courses", ctrl.exportTopCourses);
router.get("/export/course-monthly", ctrl.exportCourseMonthly);
router.get("/export/detailed", ctrl.exportDetailed);
router.get("/export/all", ctrl.exportAll);

module.exports = router;
