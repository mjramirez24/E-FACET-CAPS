const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  getPreferences,
  updatePreferences,
} = require("../controllers/settingsController");

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png files are allowed"));
    }
  },
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user_id) {
    const allowedRoles = ["user", "student", "instructor", "admin", "trainer"];

    // ✅ normalize to lowercase para di case-sensitive
    const role = String(req.session.role || "").toLowerCase();

    if (allowedRoles.includes(role)) {
      // optional: keep normalized for downstream code
      req.session.role = role;
      next();
    } else {
      res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }
  } else {
    res.status(401).json({
      status: "error",
      message: "Authentication required",
    });
  }
};

// Profile routes
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePassword);
router.post("/avatar", requireAuth, upload.single("avatar"), uploadAvatar);

// Preferences routes
router.get("/preferences", requireAuth, getPreferences);
router.put("/preferences", requireAuth, updatePreferences);

module.exports = router;
