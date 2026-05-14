// api/bookings/[id]/cancel.js
import { getDb } from '../../../lib/db.js';
import { cors } from '../../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.query;
  try {
    const sql = getDb();
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.payment_status === 'paid') return res.status(409).json({ error: 'Cannot cancel a paid booking' });

    await sql`UPDATE slots SET status = 'open' WHERE id = ${booking.slot_id}`;
    await sql`UPDATE bookings SET payment_status = 'cancelled' WHERE id = ${id}`;

    res.json({ message: 'Booking cancelled and slot released' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
