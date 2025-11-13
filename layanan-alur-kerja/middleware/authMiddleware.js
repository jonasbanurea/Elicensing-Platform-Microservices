const jwt = require('jsonwebtoken');

function validateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7, authHeader.length);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

module.exports = { validateToken, requireRole };
