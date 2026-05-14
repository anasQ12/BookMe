// api/bookings/index.js
import { getDb } from '../../lib/db.js';
import { cors, requireAdmin, verifyAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  // POST — public: create a booking reservation
  if (req.method === 'POST') {
    const { slot_id, client_name, client_email, client_phone, notif_method, notes } = req.body;
    if (!slot_id || !client_name || !client_email) {
      return res.status(400).json({ error: 'slot_id, client_name, and client_email are required' });
    }
    try {
      // Check slot is still open
      const [slot] = await sql`SELECT * FROM slots WHERE id = ${slot_id} AND status = 'open'`;
      if (!slot) return res.status(409).json({ error: 'This slot is no longer available' });

      // Reserve immediately to prevent double-booking
      await sql`UPDATE slots SET status = 'reserved' WHERE id = ${slot_id}`;

      const [booking] = await sql`
        INSERT INTO bookings (slot_id, client_name, client_email, client_phone, notif_method, notes, amount)
        VALUES (${slot_id}, ${client_name}, ${client_email}, ${client_phone || null},
                ${notif_method || 'email'}, ${notes || null}, ${slot.price})
        RETURNING id, amount
      `;

      return res.status(201).json({ booking_id: booking.id, amount: booking.amount });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET — admin only: list all bookings
  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;
    const { status } = req.query;
    try {
      const rows = status
        ? await sql`
            SELECT b.*, TO_CHAR(s.date,'YYYY-MM-DD') as date, s.time, s.label, s.duration
            FROM bookings b JOIN slots s ON s.id = b.slot_id
            WHERE b.payment_status = ${status}
            ORDER BY s.date DESC, s.time DESC`
        : await sql`
            SELECT b.*, TO_CHAR(s.date,'YYYY-MM-DD') as date, s.time, s.label, s.duration
            FROM bookings b JOIN slots s ON s.id = b.slot_id
            ORDER BY s.date DESC, s.time DESC`;
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).end();
}
