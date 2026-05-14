// api/auth/login.js
import { getDb } from '../../lib/db.js';
import { cors } from '../../lib/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  try {
    const sql = getDb();
    const [admin] = await sql`SELECT * FROM admin LIMIT 1`;
    if (!admin) return res.status(500).json({ error: 'Run /api/setup first' });

    const valid = bcrypt.compareSync(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign(
      { role: 'admin', id: admin.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
