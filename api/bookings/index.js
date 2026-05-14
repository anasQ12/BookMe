// api/bookings/[id]/index.js  →  PATCH /api/bookings/:id
import { getDb } from '../../../lib/db.js';
import { cors, requireAdmin } from '../../../lib/auth.js';
import { sendBookingConfirmation } from '../../../lib/email.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'PATCH') return res.status(405).end();

  const { id } = req.query;
  const { payment_status, notes } = req.body;

  try {
    const sql = getDb();
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    await sql`
      UPDATE bookings SET
        payment_status = COALESCE(${payment_status ?? null}, payment_status),
        notes          = COALESCE(${notes ?? null}, notes)
      WHERE id = ${id}
    `;

    // If admin is manually confirming a bank transfer
    if (payment_status === 'paid' && booking.payment_status !== 'paid') {
      await sql`UPDATE slots SET status = 'booked' WHERE id = ${booking.slot_id}`;
      const [slot] = await sql`SELECT * FROM slots WHERE id = ${booking.slot_id}`;

      const mins = parseInt(process.env.ZOOM_REMINDER_MINUTES || '15');
      const dateStr = slot.date instanceof Date ? slot.date.toISOString().slice(0,10) : String(slot.date).slice(0,10);
      const sessionDT = new Date(`${dateStr}T${slot.time}:00`);
      const reminderDT = new Date(sessionDT.getTime() - mins * 60000);
      await sql`INSERT INTO reminders (booking_id, scheduled_at) VALUES (${id}, ${reminderDT.toISOString()})`;

      sendBookingConfirmation({ ...booking, id }, slot).catch(console.error);
    }

    res.json({ message: 'Booking updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
