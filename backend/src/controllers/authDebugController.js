exports.me = (req, res) => {
  return res.json({
    user: req.user || null,
    session: req.session || null,
  });
};
