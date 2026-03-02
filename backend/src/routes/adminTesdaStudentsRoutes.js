const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/adminTesdaStudentsController");

router.get("/students", ctrl.getTesdaStudents);

module.exports = router;
