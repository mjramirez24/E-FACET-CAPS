const express = require("express");
const router = express.Router();

const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");

const tesdaCoursesController = require("../controllers/adminTesdaCoursesController");
const tesdaTrainersController = require("../controllers/adminTesdaTrainersController");
const tesdaAssignmentController = require("../controllers/adminTesdaAssignmentController");
const tesdaSched = require("../controllers/adminTesdaScheduleController");

// ✅ Require login first, then admin
router.use(requireAuth, requireAdmin);

// ===================== TESDA COURSES =====================
router.get("/courses", tesdaCoursesController.getTesdaCourses);
router.post("/courses", tesdaCoursesController.createTesdaCourse);
router.put("/courses/:id", tesdaCoursesController.updateTesdaCourse);
router.delete("/courses/:id", tesdaCoursesController.deleteTesdaCourse);

// ===================== TESDA TRAINERS =====================
router.get("/trainers", tesdaTrainersController.getTrainers);
router.post("/trainers", tesdaTrainersController.createTrainer);
router.put("/trainers/:id", tesdaTrainersController.updateTrainer);
router.delete("/trainers/:id", tesdaTrainersController.deleteTrainer);

// ================= COURSE ⇄ TRAINER ASSIGNMENT =================
router.get("/course-trainers", tesdaAssignmentController.getCourseTrainers);
router.post(
  "/course-trainers",
  tesdaAssignmentController.assignTrainerToCourse,
);

// ✅ mas safe na may trainerId para specific delete
// Example: DELETE /api/admin/tesda/course-trainers/12/3 (courseId=12, trainerId=3)
router.delete(
  "/course-trainers/:courseId/:trainerId",
  tesdaAssignmentController.removeTrainerFromCourse,
);

// ===================== TESDA SCHEDULES CRUD =====================
router.get("/schedules", tesdaSched.getTesdaSchedules);
router.post("/schedules", tesdaSched.createTesdaSchedule);
router.put("/schedules/:id", tesdaSched.updateTesdaSchedule);
router.delete("/schedules/:id", tesdaSched.deleteTesdaSchedule);

module.exports = router;
