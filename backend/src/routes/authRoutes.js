// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/test", authController.test);
router.get("/check", authController.checkAuth);
router.get("/check-admin", authController.checkAdmin);
router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.get("/logout", authController.logout);
router.get("/check-username", authController.checkUsername);

router.get("/me", (req, res) => {
  if (!req.session?.user_id) {
    return res.status(401).json({ status: "error", message: "Not logged in" });
  }
  res.json({
    user: {
      id: req.session.user_id, // ← user_id not userId
      role: req.session.role,
      track: req.session.track_code, // ← track_code not track
    },
  });
});

module.exports = router;
