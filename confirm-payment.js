// api/bookings/[id]/confirm-payment.js
import { getDb } from '../../../lib/db.js';
import { cors } from '../../../lib/auth.js';
import { sendBookingConfirmation } from '../../../lib/email.js';

function scheduleReminder(sql, bookingId, slotDate, slotTime) {
  const mins = parseInt(process.env.ZOOM_REMINDER_MINUTES || '15');
  // slotDate is a Date object from Postgres, slotTime is "HH:MM"
  const dateStr = slotDate instanceof Date
    ? slotDate.toISOString().slice(0, 10)
    : String(slotDate).slice(0, 10);
  const sessionDT = new Date(`${dateStr}T${slotTime}:00`);
  const reminderDT = new Date(sessionDT.getTime() - mins * 60000);
  return sql`
    INSERT INTO reminders (booking_id, scheduled_at)
    VALUES (${bookingId}, ${reminderDT.toISOString()})
  `;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.query;
  const { payment_ref, payment_method } = req.body;
  if (!payment_ref) return res.status(400).json({ error: 'payment_ref is required' });

  try {
    const sql = getDb();
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.payment_status === 'paid') return res.status(409).json({ error: 'Already paid' });

    // Mark booking paid
    await sql`
      UPDATE bookings
      SET payment_status = 'paid', payment_method = ${payment_method || 'card'}, payment_ref = ${payment_ref}
      WHERE id = ${id}
    `;

    // Lock the slot
    await sql`UPDATE slots SET status = 'booked' WHERE id = ${booking.slot_id}`;

    // Get slot details
    const [slot] = await sql`SELECT * FROM slots WHERE id = ${booking.slot_id}`;

    // Schedule Zoom reminder
    await scheduleReminder(sql, id, slot.date, slot.time);

    // Send confirmation email (non-blocking)
    sendBookingConfirmation({ ...booking, id }, slot).catch(err =>
      console.error('Email error:', err.message)
    );

    res.json({ message: 'Booking confirmed', booking_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
