// Protects routes so that only logged-in users can access them

module.exports = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};
