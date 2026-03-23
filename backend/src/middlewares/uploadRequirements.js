const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ✅ backend/uploads folders (outside src)
const uploadRoot = path.join(__dirname, "..", "..", "uploads");
const requirementsDir = path.join(uploadRoot, "requirements");
const twoByTwoDir = path.join(uploadRoot, "2x2");

fs.mkdirSync(requirementsDir, { recursive: true });
fs.mkdirSync(twoByTwoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ✅ 2x2 goes to /uploads/2x2
    if (file.fieldname === "picture_2x2") {
      return cb(null, twoByTwoDir);
    }

    // ✅ all other files go to /uploads/requirements
    return cb(null, requirementsDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();

    let safeExt = ext;
    if (!safeExt) {
      if (file.mimetype === "image/jpeg") safeExt = ".jpg";
      else if (file.mimetype === "image/png") safeExt = ".png";
      else if (file.mimetype === "image/webp") safeExt = ".webp";
      else if (file.mimetype === "application/pdf") safeExt = ".pdf";
      else safeExt = ".dat";
    }

    if (file.fieldname === "picture_2x2") {
      const reservationId =
        String(req.params?.reservationId || req.params?.id || "0").trim() ||
        "0";
      const name = `2x2_${reservationId}_${Date.now()}_${Math.round(Math.random() * 1e9)}${safeExt}`;
      return cb(null, name);
    }

    const name = `req_${Date.now()}_${Math.round(Math.random() * 1e9)}${safeExt}`;
    return cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new Error("Invalid file type. Only JPG/PNG/WEBP/PDF allowed."));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});
