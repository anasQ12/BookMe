// api/setup.js — Visit /api/setup ONCE to create tables + admin account
import { setupSchema, getDb } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import { cors } from '../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Simple protection — require a setup secret so random people can't call this
  const { secret } = req.query;
  if (secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: 'Forbidden. Pass ?secret=YOUR_SETUP_SECRET' });
  }

  try {
    const sql = getDb();
    await setupSchema();

    // Create admin if not exists
    const existing = await sql`SELECT id FROM admin LIMIT 1`;
    if (existing.length === 0) {
      const plain = process.env.ADMIN_PASSWORD || 'admin123';
      const hashed = bcrypt.hashSync(plain, 12);
      await sql`
        INSERT INTO admin (password, zoom_link, zoom_id, zoom_pass, reminder_minutes)
        VALUES (${hashed}, ${process.env.ZOOM_MEETING_LINK || ''}, '', '', 15)
      `;
    }

    res.json({ ok: true, message: 'Database ready. Admin account exists.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
