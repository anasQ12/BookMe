// lib/email.js
import { Resend } from 'resend';

function client() {
  return new Resend(process.env.RESEND_API_KEY);
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Booking Confirmation ──────────────────────────────────────────────────────
export async function sendBookingConfirmation(booking, slot) {
  const resend = client();
  const dateFormatted = formatDate(slot.date);

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Dr. Abdullah Hadi Consulting <onboarding@resend.dev>',
    to: booking.client_email,
    subject: `Booking Confirmed — ${dateFormatted} at ${slot.label}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 16px;background:#FAF7F2;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid rgba(184,149,74,0.2);border-radius:4px;overflow:hidden;">
    
    <div style="background:#1A1612;padding:28px 32px;text-align:center;">
      <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#D4B07A;margin:0 0 8px 0;">Booking Confirmed</p>
      <h1 style="font-size:26px;color:#FAF7F2;margin:0;font-weight:400;font-family:Georgia,serif;">Dr. Abdullah Hadi</h1>
      <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#7A6E65;margin:6px 0 0 0;">Consulting</p>
    </div>

    <div style="padding:32px;">
      <p style="font-size:16px;color:#3D3530;margin:0 0 12px;">Dear ${booking.client_name},</p>
      <p style="color:#7A6E65;line-height:1.7;margin:0 0 24px;">
        Your consulting session has been confirmed and payment received. We look forward to speaking with you.
      </p>

      <div style="background:#FAF7F2;border:1px solid rgba(184,149,74,0.2);border-radius:4px;padding:20px 24px;margin:0 0 20px;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr>
            <td style="color:#7A6E65;padding:8px 0;border-bottom:1px solid rgba(184,149,74,0.1);">Date</td>
            <td style="text-align:right;padding:8px 0;border-bottom:1px solid rgba(184,149,74,0.1);font-weight:600;color:#1A1612;">${dateFormatted}</td>
          </tr>
          <tr>
            <td style="color:#7A6E65;padding:8px 0;border-bottom:1px solid rgba(184,149,74,0.1);">Time</td>
            <td style="text-align:right;padding:8px 0;border-bottom:1px solid rgba(184,149,74,0.1);font-weight:600;color:#1A1612;">${slot.label}</td>
          </tr>
          <tr>
            <td style="color:#7A6E65;padding:8px 0;border-bottom:1px solid rgba(184,149,74,0.1);">Duration</td>
            <td style="text-align:right;padding:8px 0;border-bottom:1px solid rgba(184,149,74,0.1);color:#1A1612;">${slot.duration} minutes</td>
          </tr>
          <tr>
            <td style="color:#7A6E65;padding:8px 0;border-bottom:1px solid rgba(184,149,74,0.1);">Amount Paid</td>
            <td style="text-align:right;padding:8px 0;border-bottom:1px solid rgba(184,149,74,0.1);font-weight:600;color:#B8954A;">SAR ${booking.amount}</td>
          </tr>
          <tr>
            <td style="color:#7A6E65;padding:8px 0;">Booking Ref</td>
            <td style="text-align:right;padding:8px 0;font-family:monospace;font-size:12px;color:#1A1612;">${booking.id}</td>
          </tr>
        </table>
      </div>

      <div style="background:#EBF4FF;border:1px solid #B5D4F4;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
        <p style="font-size:14px;color:#185FA5;margin:0;line-height:1.6;">
          <strong>📹 Your Zoom link will be sent ${process.env.ZOOM_REMINDER_MINUTES || 15} minutes before your session.</strong><br>
          Please ensure you are available at the scheduled time.
        </p>
      </div>

      <p style="font-size:13px;color:#7A6E65;margin:0;">If you have any questions, please reply to this email.</p>
    </div>

    <div style="padding:16px 32px;border-top:1px solid rgba(184,149,74,0.15);text-align:center;">
      <p style="font-size:12px;color:#7A6E65;margin:0;">Dr. Abdullah Hadi Consulting · Private &amp; Confidential</p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ── Zoom Reminder ─────────────────────────────────────────────────────────────
export async function sendZoomReminder(booking, slot, zoomLink) {
  const resend = client();
  const dateFormatted = formatDate(slot.date);
  const reminderMins = process.env.ZOOM_REMINDER_MINUTES || 15;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Dr. Abdullah Hadi Consulting <onboarding@resend.dev>',
    to: booking.client_email,
    subject: `Your session starts in ${reminderMins} minutes — Join Zoom`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 16px;background:#FAF7F2;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid rgba(184,149,74,0.2);border-radius:4px;overflow:hidden;">
    
    <div style="background:#1A1612;padding:28px 32px;text-align:center;">
      <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#D4B07A;margin:0 0 8px 0;">Session Starting Soon</p>
      <h1 style="font-size:26px;color:#FAF7F2;margin:0;font-weight:400;font-family:Georgia,serif;">Dr. Abdullah Hadi</h1>
    </div>

    <div style="padding:32px;">
      <p style="font-size:16px;color:#3D3530;margin:0 0 12px;">Dear ${booking.client_name},</p>
      <p style="color:#7A6E65;line-height:1.7;margin:0 0 24px;">
        Your consulting session begins in <strong style="color:#1A1612;">${reminderMins} minutes</strong>. Please click the button below to join.
      </p>

      <div style="text-align:center;margin:0 0 28px;">
        <a href="${zoomLink}" style="display:inline-block;background:#B8954A;color:#1A1612;padding:14px 40px;border-radius:2px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.04em;">
          Join Zoom Session →
        </a>
      </div>

      <div style="background:#FAF7F2;border:1px solid rgba(184,149,74,0.2);border-radius:4px;padding:16px 20px;font-size:13px;color:#7A6E65;line-height:1.8;">
        <strong style="color:#1A1612;">Session Details</strong><br>
        Date: ${dateFormatted}<br>
        Time: ${slot.label} &nbsp;·&nbsp; Duration: ${slot.duration} min<br>
        Link: <a href="${zoomLink}" style="color:#185FA5;word-break:break-all;">${zoomLink}</a>
      </div>
    </div>
  </div>
</body>
</html>`,
  });
}
