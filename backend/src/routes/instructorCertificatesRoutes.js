// backend/src/routes/instructorCertificatesRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/instructorCertificatesController");

const {
  requireAuth,
  requireInstructor,
} = require("../middlewares/authMiddleware");

// ✅ protect everything
router.use("/instructor", requireAuth, requireInstructor);

// DRIVING only
router.get(
  "/instructor/certificates/driving/completions",
  ctrl.listDrivingCompletions,
);
router.post("/instructor/certificates/driving/generate", ctrl.generateDriving);
router.get("/instructor/certificates/driving/:id/view", ctrl.viewDrivingPdf);
router.get(
  "/instructor/certificates/driving/:id/download",
  ctrl.downloadDrivingPdf,
);

module.exports = router;
