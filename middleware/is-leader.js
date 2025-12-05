// Only allow users with role leader access 

module.exports = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'leader') {
    return res.status(403).send('Access denied. Leaders only.');
  }
  next();
};
