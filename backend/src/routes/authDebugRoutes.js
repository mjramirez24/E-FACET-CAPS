const router = require("express").Router();
const { me } = require("../controllers/authDebugController");

router.get("/me", (req, res) => {
  res.json({
    ok: true,
    session: req.session || null,
    user: req.user || null,
    role: req.session?.role || req.user?.role || null,
    user_id:
      req.session?.user_id ||
      req.session?.userId ||
      req.user?.user_id ||
      req.user?.id ||
      null,
  });
});

module.exports = router;
