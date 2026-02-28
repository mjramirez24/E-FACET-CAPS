// backend/src/routes/adminCertificateRoutes.js
const express = require("express");
const router = express.Router();

const adminCertificateController = require("../controllers/adminCertificateController");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");

/**
 * ✅ LIST DONE students
 * GET /api/admin/certificates/completions
 */
router.get(
  "/completions",
  requireAuth,
  requireAdmin,
  adminCertificateController.listCompletions,
);

/**
 * ✅ DRIVING
 * POST /api/admin/certificates/driving/generate
 * GET  /api/admin/certificates/driving/:id/view
 * GET  /api/admin/certificates/driving/:id/download
 * PATCH /api/admin/certificates/driving/:id/revoke
 */
router.post(
  "/driving/generate",
  requireAuth,
  requireAdmin,
  adminCertificateController.generateDriving,
);

router.get(
  "/driving/:id/view",
  requireAuth,
  requireAdmin,
  adminCertificateController.viewDrivingPdf,
);

router.get(
  "/driving/:id/download",
  requireAuth,
  requireAdmin,
  adminCertificateController.downloadDrivingPdf,
);

router.patch(
  "/driving/:id/revoke",
  requireAuth,
  requireAdmin,
  adminCertificateController.revokeDriving,
);

/**
 * ✅ TESDA
 * POST /api/admin/certificates/tesda/generate
 * GET  /api/admin/certificates/tesda/:id/view
 * GET  /api/admin/certificates/tesda/:id/download
 * PATCH /api/admin/certificates/tesda/:id/revoke
 */
router.post(
  "/tesda/generate",
  requireAuth,
  requireAdmin,
  adminCertificateController.generateTesda,
);

router.get(
  "/tesda/:id/view",
  requireAuth,
  requireAdmin,
  adminCertificateController.viewTesdaPdf,
);

router.get(
  "/tesda/:id/download",
  requireAuth,
  requireAdmin,
  adminCertificateController.downloadTesdaPdf,
);

router.patch(
  "/tesda/:id/revoke",
  requireAuth,
  requireAdmin,
  adminCertificateController.revokeTesda,
);



module.exports = router;
