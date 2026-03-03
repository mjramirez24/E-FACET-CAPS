const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/trainerCertificatesController");

// ✅ make sure this path is correct
const {
  requireAuth,
  requireTrainer, // ✅ trainer, NOT instructor
} = require("../middlewares/authMiddleware");

// ✅ protect all routes here
router.use(requireAuth);
router.use(requireTrainer);

// TESDA trainer certificate endpoints
router.get(
  "/trainer/certificates/tesda/completions",
  ctrl.listTesdaCompletions,
);
router.post("/trainer/certificates/tesda/generate", ctrl.generateTesda);
router.get("/trainer/certificates/tesda/:id/view", ctrl.viewTesdaPdf);
router.get("/trainer/certificates/tesda/:id/download", ctrl.downloadTesdaPdf);

router.get("/trainer/certificates/_debug", (req, res) => {
  res.json({
    user_id: req.session?.user_id,
    role: req.session?.role,
    route: "trainerCertificatesRoutes hit",
  });
});

module.exports = router;
