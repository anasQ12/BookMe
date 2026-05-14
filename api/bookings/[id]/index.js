// api/settings/index.js
import { getDb } from '../../lib/db.js';
import { cors, requireAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireAdmin(req, res)) return;

  const sql = getDb();

  if (req.method === 'GET') {
    const [settings] = await sql`
      SELECT zoom_link, zoom_id, zoom_pass, reminder_minutes FROM admin LIMIT 1
    `;
    return res.json(settings || {});
  }

  if (req.method === 'PATCH') {
    const { zoom_link, zoom_id, zoom_pass, reminder_minutes } = req.body;
    await sql`
      UPDATE admin SET
        zoom_link        = COALESCE(${zoom_link ?? null}, zoom_link),
        zoom_id          = COALESCE(${zoom_id ?? null}, zoom_id),
        zoom_pass        = COALESCE(${zoom_pass ?? null}, zoom_pass),
        reminder_minutes = COALESCE(${reminder_minutes != null ? parseInt(reminder_minutes) : null}, reminder_minutes),
        updated_at       = NOW()
    `;
    return res.json({ message: 'Settings saved' });
  }

  res.status(405).end();
}
