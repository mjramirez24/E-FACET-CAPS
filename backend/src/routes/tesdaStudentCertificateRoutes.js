const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/tesdaStudentCertificateController");
const { requireStudent } = require("../middlewares/authMiddleware");

router.get("/", requireStudent, ctrl.listMyTesdaCertificates);
router.get("/:id/view", requireStudent, ctrl.viewMyTesdaPdf);
router.get("/:id/download", requireStudent, ctrl.downloadMyTesdaPdf);

module.exports = router;
