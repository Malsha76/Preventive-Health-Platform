const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authorization header required. Use: Bearer <token>' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Invalidate tokens issued before last password change
    try {
      const u = await User.findById(payload.userId).select('passwordChangedAt role');
      if (u?.passwordChangedAt && payload.iat && (payload.iat * 1000) < new Date(u.passwordChangedAt).getTime()) {
        return res.status(401).json({ message: 'Token invalidated. Please login again.' });
      }
      req.auth = payload;
    } catch (e) {
      return res.status(401).json({ message: 'Invalid auth context' });
    }
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    const role = (req.auth?.role || '').toString();
    const normalized = role.toLowerCase();
    const allowed = roles.map(r => (r || '').toString().toLowerCase());

    if (!normalized || !allowed.includes(normalized)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
