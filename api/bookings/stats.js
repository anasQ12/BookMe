// api/bookings/stats.js
import { getDb } from '../../lib/db.js';
import { cors, requireAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireAdmin(req, res)) return;

  try {
    const sql = getDb();
    const [stats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE payment_status = 'paid')::int    AS total_bookings,
        COALESCE(SUM(amount) FILTER (WHERE payment_status = 'paid'), 0)::int AS total_revenue,
        COUNT(*) FILTER (WHERE payment_status = 'pending')::int AS pending
      FROM bookings
    `;
    const [slots] = await sql`SELECT COUNT(*)::int as open_slots FROM slots WHERE status = 'open'`;
    res.json({ ...stats, open_slots: slots.open_slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
