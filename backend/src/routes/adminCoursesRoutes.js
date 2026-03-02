const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminCoursesController");

router.get("/courses", ctrl.getAdminCourses);

module.exports = router;
