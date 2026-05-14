// api/cron/reminders.js
// Vercel Cron Job — runs every minute (configured in vercel.json)
// Sends Zoom links to clients before their session
import { getDb } from '../../lib/db.js';
import { sendZoomReminder } from '../../lib/email.js';

export default async function handler(req, res) {
  // Vercel cron requests include this header for security
  const cronSecret = req.headers['authorization'];
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sql = getDb();

    // Find reminders due right now (within a 90 second window to handle timing drift)
    const pending = await sql`
      SELECT
        r.id          AS reminder_id,
        r.booking_id,
        b.client_name,
        b.client_email,
        b.notif_method,
        b.payment_status,
        TO_CHAR(s.date, 'YYYY-MM-DD') AS date,
        s.time,
        s.label,
        s.duration
      FROM reminders r
      JOIN bookings b ON b.id = r.booking_id
      JOIN slots    s ON s.id = b.slot_id
      WHERE r.sent = FALSE
        AND b.payment_status = 'paid'
        AND r.scheduled_at <= NOW() + INTERVAL '90 seconds'
    `;

    if (pending.length === 0) return res.json({ sent: 0 });

    // Get Zoom link from admin settings
    const [adminSettings] = await sql`SELECT zoom_link FROM admin LIMIT 1`;
    const zoomLink = adminSettings?.zoom_link || process.env.ZOOM_MEETING_LINK || '';

    let sent = 0;
    for (const row of pending) {
      try {
        await sendZoomReminder(
          { id: row.booking_id, client_name: row.client_name, client_email: row.client_email },
          { date: row.date, label: row.label, duration: row.duration },
          zoomLink
        );

        await sql`
          UPDATE reminders SET sent = TRUE, sent_at = NOW() WHERE id = ${row.reminder_id}
        `;
        await sql`
          UPDATE bookings SET zoom_link_sent = TRUE WHERE id = ${row.booking_id}
        `;
        sent++;
        console.log(`✅ Zoom reminder sent to ${row.client_email}`);
      } catch (err) {
        console.error(`❌ Failed for booking ${row.booking_id}:`, err.message);
      }
    }

    res.json({ sent, total: pending.length });
  } catch (err) {
    console.error('Cron error:', err);
    res.status(500).json({ error: err.message });
  }
}
