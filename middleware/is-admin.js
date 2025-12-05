
// This helps access the route only if user is an admin and has admin acess (if not gives a 403)

module.exports = function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next(); 
  }
  res.status(403).send('Forbidden: Admins only');
};