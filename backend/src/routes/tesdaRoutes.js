// backend/src/routes/tesdaRoutes.js
const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const uploadRequirementsMw = require("../middlewares/uploadRequirements");

const tesdaReq = require("../controllers/tesdaRequirementsController");
const tesdaSchedule = require("../controllers/tesdaScheduleController");
const tesdaReservation = require("../controllers/tesdaReservationController");
const tesdaStudentSched = require("../controllers/tesdaStudentScheduleController");

const tesdaStudentDashboardSummaryController = require("../controllers/tesdaStudentDashboardSummaryController");

// --------------------
// helpers: prevent server crash when a handler is undefined
// --------------------
function mustFn(fn, label) {
  if (typeof fn === "function") return fn;
  return (req, res) => {
    res.status(500).json({
      status: "error",
      message: `Missing handler: ${label} (not a function). Check exports/imports.`,
    });
  };
}

function pickFn(obj, names, label) {
  for (const n of names) {
    if (obj && typeof obj[n] === "function") return obj[n];
  }
  return mustFn(undefined, `${label} expected one of: ${names.join(", ")}`);
}

// --------------------
// middlewares (safe)
// --------------------
const requireAuth = mustFn(auth?.requireAuth, "authMiddleware.requireAuth");
const requireStudent = pickFn(
  auth,
  ["requireStudent", "requireStudentOnly", "requireRoleStudent"],
  "auth middleware student guard",
);

// ✅ For legacy/multi upload endpoint (/requirements/upload) -> expects files[]
const requirementsUploadMw =
  uploadRequirementsMw && typeof uploadRequirementsMw.array === "function"
    ? uploadRequirementsMw.array("files", 20)
    : typeof uploadRequirementsMw === "function"
      ? uploadRequirementsMw
      : mustFn(
          undefined,
          "uploadRequirements middleware (multer .array or function)",
        );

// ✅ NEW: For upload-one endpoint (/requirements/upload-one) -> expects file
// Works whether uploadRequirementsMw is multer instance (.single or .array)
const requirementsUploadOneMw =
  uploadRequirementsMw && typeof uploadRequirementsMw.single === "function"
    ? uploadRequirementsMw.single("file")
    : uploadRequirementsMw && typeof uploadRequirementsMw.array === "function"
      ? (req, res, next) => {
          // accept 1 file even if only .array is available
          uploadRequirementsMw.array("file", 1)(req, res, (err) => {
            if (err) return next(err);
            // normalize to req.file for controller
            req.file = req.files && req.files[0] ? req.files[0] : null;
            next();
          });
        }
      : typeof uploadRequirementsMw === "function"
        ? uploadRequirementsMw
        : mustFn(undefined, "uploadRequirements middleware for single file");

// --------------------
// controllers (safe picks)
// --------------------

// schedules list for enrollment (student)
// GET /api/tesda/schedules?course_id=10
const listByCourse = pickFn(
  tesdaSchedule,
  ["listByCourse", "list", "getByCourse"],
  "tesdaScheduleController.listByCourse",
);

// reserve schedule / create reservation
// POST /api/tesda/reservations { schedule_id, course_id }
const createReservation = pickFn(
  tesdaReservation,
  ["createReservation", "createPending", "create", "reserve"],
  "tesdaReservationController.createReservation",
);

// my reservations list
// GET /api/tesda/my-reservations
const myReservations = pickFn(
  tesdaReservation,
  ["myReservations", "listMine", "my"],
  "tesdaReservationController.myReservations",
);

// requirements list
// GET /api/tesda/requirements?course_id=10&reservation_id=optional
const listRequirementsHandler = pickFn(
  tesdaReq,
  ["listMySubmissions", "listMyUploads", "listMyRequirements", "list"],
  "tesdaRequirementsController.listMySubmissions",
);

// ✅ upload ONE requirement
// POST /api/tesda/requirements/upload-one (multipart) file field name = "file"
const uploadOneRequirementHandler = pickFn(
  tesdaReq,
  ["uploadOneRequirement"],
  "tesdaRequirementsController.uploadOneRequirement",
);

// ✅ submit requirements validation
// POST /api/tesda/requirements/submit (json)
const submitRequirementsHandler = pickFn(
  tesdaReq,
  ["submitRequirements"],
  "tesdaRequirementsController.submitRequirements",
);

// (optional legacy) multi upload endpoint if you still have it
const uploadManyHandler = pickFn(
  tesdaReq,
  ["upload", "uploadMyRequirements", "uploadMyUploads", "create"],
  "tesdaRequirementsController.upload (legacy multi upload)",
);

// --------------------
// routes
// --------------------

router.get("/dashboard/summary", requireAuth, requireStudent, (req, res) =>
  tesdaStudentDashboardSummaryController.getTesdaStudentDashboardSummary(
    req,
    res,
  ),
);

// ✅ schedules list
router.get("/schedules", requireAuth, requireStudent, listByCourse);

// ✅ reserve schedule / pooling reservation
router.post("/reservations", requireAuth, requireStudent, createReservation);

// ✅ my reservations
router.get("/my-reservations", requireAuth, requireStudent, myReservations);

// ✅ requirements list
router.get(
  "/requirements",
  requireAuth,
  requireStudent,
  listRequirementsHandler,
);

// ✅ NEW: upload-one (THIS FIXES YOUR 404 ROUTE NOT FOUND)
router.post(
  "/requirements/upload-one",
  requireAuth,
  requireStudent,
  requirementsUploadOneMw,
  uploadOneRequirementHandler,
);

// ✅ NEW: submit/validate
router.post(
  "/requirements/submit",
  requireAuth,
  requireStudent,
  submitRequirementsHandler,
);

// ✅ OPTIONAL LEGACY: multi upload (keep only if your frontend still calls it)
router.post(
  "/requirements/upload",
  requireAuth,
  requireStudent,
  requirementsUploadMw,
  uploadManyHandler,
);

// ✅ training schedule
router.get(
  "/training-schedule",
  requireAuth,
  requireStudent,
  mustFn(
    tesdaStudentSched?.getMyTrainingSchedule,
    "tesdaStudentScheduleController.getMyTrainingSchedule",
  ),
);

module.exports = router;
