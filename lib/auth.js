// lib/auth.js
import jwt from 'jsonwebtoken';

export function verifyAdmin(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    return payload.role === 'admin' ? payload : null;
  } catch {
    return null;
  }
}

export function requireAdmin(req, res) {
  const admin = verifyAdmin(req);
  if (!admin) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
