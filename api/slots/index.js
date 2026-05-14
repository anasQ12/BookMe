// api/slots/index.js  →  GET /api/slots  +  POST /api/slots
import { getDb } from '../../lib/db.js';
import { cors, requireAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  // GET — public: return all open slots (optionally filtered by ?date=YYYY-MM-DD)
  if (req.method === 'GET') {
    const { date, month } = req.query;
    try {
      let rows;
      if (date) {
        rows = await sql`
          SELECT id, date, time, label, duration, price, slot_type
          FROM slots WHERE status = 'open' AND date = ${date}
          ORDER BY time
        `;
      } else if (month) {
        rows = await sql`
          SELECT id, date, time, label, duration, price, slot_type
          FROM slots WHERE status = 'open' AND TO_CHAR(date,'YYYY-MM') = ${month}
          ORDER BY date, time
        `;
      } else {
        rows = await sql`
          SELECT id, date, time, label, duration, price, slot_type
          FROM slots WHERE status = 'open'
          ORDER BY date, time
        `;
      }
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST — admin only: create a slot
  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const { date, time, label, duration, price, slot_type } = req.body;
    if (!date || !time || !price) {
      return res.status(400).json({ error: 'date, time, and price are required' });
    }
    try {
      // Auto-generate label if not provided
      const [h, m] = time.split(':');
      const hour = parseInt(h);
      const autoLabel = label || `${(hour % 12) || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;

      const [slot] = await sql`
        INSERT INTO slots (date, time, label, duration, price, slot_type)
        VALUES (${date}, ${time}, ${autoLabel}, ${duration || 60}, ${parseInt(price)}, ${slot_type || 'regular'})
        ON CONFLICT (date, time) DO NOTHING
        RETURNING id
      `;
      if (!slot) return res.status(409).json({ error: 'A slot already exists at this date and time' });
      return res.status(201).json({ id: slot.id, message: 'Slot created' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).end();
}
