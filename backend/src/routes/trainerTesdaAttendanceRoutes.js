const express = require("express");
const router = express.Router();

const {
  getAttendanceSheet,
  saveAttendance,
  listAttendanceHistory,
  getAttendanceByDate,
  exportAttendanceExcel,
  exportAttendancePdf,
} = require("../controllers/trainerTesdaAttendanceController");

// ✅ same middleware style as your certificates
const {
  requireAuth,
  requireTrainer,
} = require("../middlewares/authMiddleware");

router.use(requireAuth);
router.use(requireTrainer);

// Sheet
router.get("/tesda/attendance", getAttendanceSheet);
router.post("/tesda/attendance", saveAttendance);

// History
router.get("/tesda/attendance/history", listAttendanceHistory);
router.get("/tesda/attendance/history/:date", getAttendanceByDate);

// Export (for selected date)
router.get("/tesda/attendance/export/excel", exportAttendanceExcel);
router.get("/tesda/attendance/export/pdf", exportAttendancePdf);

module.exports = router;
