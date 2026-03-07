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

// ─────────────────────────────────────────────────────────────────────────────
// Authentication middleware
// Supports both session shapes:
//   - Flat:   req.session.user_id  (regular student / instructor / admin)
//   - Nested: req.session.user.user_id  (TESDA student)
// ─────────────────────────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  // Resolve user_id from either session shape
  const userId =
    req.session?.user_id ??
    req.session?.user?.user_id ??
    req.session?.user?.id ??
    null;

  // Resolve role from either session shape
  const role = String(
    req.session?.role || req.session?.user?.role || ""
  ).toLowerCase();

  if (userId && userId > 0) {
    const allowedRoles = ["user", "student", "instructor", "admin", "trainer"];
    if (allowedRoles.includes(role)) {
      // Normalize so downstream controllers can always use req.session.user_id
      req.session.user_id = Number(userId);
      req.session.role = role;
      next();
    } else {
      res.status(403).json({ status: "error", message: "Access denied" });
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