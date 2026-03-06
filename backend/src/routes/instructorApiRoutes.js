const express = require("express");
const router = express.Router();

const {
  requireAuth,
  requireInstructor,
} = require("../middlewares/authMiddleware");

// ✅ protect everything
router.use("/instructor", requireAuth, requireInstructor);

const instructorStudentsController = require("../controllers/instructorStudentsController");
const {
  getDrivingInstructorClasses,
} = require("../controllers/drivingInstructorClassesController");
const { getTesdaClasses } = require("../controllers/tesdaClassesController");

const {
  getInstructorSchedulesList,
} = require("../controllers/instructorScheduleController");

const {
  getInstructorDashboardSummary,
} = require("../controllers/instructorDashboardController");

// ✅ debug route para sure ka na gumagana ang mount
router.get("/instructor/ping", (req, res) => {
  return res.json({
    status: "success",
    message: "OK /api/instructor/* routes working",
  });
});

// ✅ students
router.get(
  "/instructor/students/list",
  instructorStudentsController.getInstructorStudentsListOnly,
);
router.get(
  "/instructor/students",
  instructorStudentsController.getInstructorStudents,
);

// ✅ classes (assigned)
router.get("/instructor/driving/classes", getDrivingInstructorClasses);
router.get("/instructor/tesda/classes", getTesdaClasses);

router.get("/instructor/schedules/list", getInstructorSchedulesList);

router.get("/instructor/dashboard/summary", getInstructorDashboardSummary);


module.exports = router;
