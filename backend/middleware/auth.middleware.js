const jwt = require('jsonwebtoken');

function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7);
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function requireAdmin(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Giris gerekli' });
  }

  try {
    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Admin yetkisi gerekli' });
    }
    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Gecersiz veya suresi dolmus token' });
  }
}

function requireCustomer(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Giris gerekli' });
  }

  try {
    const payload = verifyToken(token);
    if (payload.role !== 'customer' || !payload.userId) {
      return res.status(401).json({ success: false, error: 'Musteri girisi gerekli' });
    }
    req.user = { id: payload.userId, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Gecersiz veya suresi dolmus token' });
  }
}

module.exports = { requireAdmin, requireCustomer };
