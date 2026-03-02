const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminTesdaStudentsCrudController");

router.post("/students", ctrl.createTesdaStudent);
router.put("/students/:id", ctrl.updateTesdaStudent);
router.delete("/students/:id", ctrl.deleteTesdaStudent);

module.exports = router;
