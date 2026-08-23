const express = require("express");
const router = express.Router();

const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const c = require("../controllers/adminReportsController");

// ✅ PROTECT ALL ROUTES (ADMIN ONLY)
router.use(requireAuth, requireAdmin);

// ==========================
// JSON endpoints (UI)
// ==========================
router.get("/detailed", c.getDetailed);
router.get("/summary", c.getSummary);
router.get("/trend", c.getTrend);
router.get("/top-courses", c.getTopCourses);
router.get("/gender-breakdown", c.getGenderBreakdown);
router.get("/course-monthly-preview", c.getCourseMonthlyPreview);

// 🔥 FIXED ATTENDANCE (IMPORTANT)
router.get("/attendance", c.getAttendanceReport); // ✅ ginagamit ng frontend
router.get("/attendance-report", c.getAttendanceReport); // ✅ backup (old)

router.get("/forecast", c.getForecast);
router.get("/forecast-backtest", c.getForecastBacktest);

// 🔥 PROMO FLAGS (NEW)
router.get("/promo-flags", c.getPromoFlags);
router.post("/promo-flags", c.setPromoFlag);

// 🔥 REVENUE
router.get("/revenue-preview", c.getRevenuePreview);

// ==========================
// CERTIFICATES
// ==========================
router.get("/certificates-summary", c.getIssuedCertificatesSummary);

// ==========================
// EXPORT endpoints
// ==========================
router.get("/export/overview", c.exportOverview);
router.get("/export/top-courses", c.exportTopCourses);
router.get("/export/course-monthly", c.exportCourseMonthly);
router.get("/export/revenue", c.exportRevenue);
router.get("/export/detailed", c.exportDetailed);
router.get("/export/all", c.exportAll);

module.exports = router;
