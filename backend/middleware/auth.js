const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32 || !process.env.JWT_ISSUER || !process.env.JWT_AUDIENCE) return res.status(503).json({ error: 'Authentication is not configured' });
    const user = jwt.verify(auth.slice(7), secret, { algorithms: ['HS256'], issuer: process.env.JWT_ISSUER, audience: process.env.JWT_AUDIENCE });
    if (!user.id || !user.role || !user.tenantId) throw new Error('missing required claims');
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
