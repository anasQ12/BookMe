// api/slots/[id].js  →  PATCH /api/slots/:id  +  DELETE /api/slots/:id
import { getDb } from '../../lib/db.js';
import { cors, requireAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireAdmin(req, res)) return;

  const { id } = req.query;
  const sql = getDb();

  if (req.method === 'PATCH') {
    const { price, slot_type, status } = req.body;
    try {
      await sql`
        UPDATE slots SET
          price     = COALESCE(${price ?? null}, price),
          slot_type = COALESCE(${slot_type ?? null}, slot_type),
          status    = COALESCE(${status ?? null}, status)
        WHERE id = ${id}
      `;
      return res.json({ message: 'Slot updated' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const [booked] = await sql`
        SELECT id FROM bookings WHERE slot_id = ${id} AND payment_status = 'paid' LIMIT 1
      `;
      if (booked) return res.status(409).json({ error: 'Cannot delete a slot with a confirmed booking' });
      await sql`DELETE FROM slots WHERE id = ${id}`;
      return res.json({ message: 'Slot deleted' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).end();
}
