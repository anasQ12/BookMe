// api/slots/dates.js  →  GET /api/slots/dates
import { getDb } from '../../lib/db.js';
import { cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        COUNT(*)::int            as count,
        MIN(price)               as min_price,
        MAX(price)               as max_price
      FROM slots
      WHERE status = 'open'
      GROUP BY date
      ORDER BY date
    `;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
