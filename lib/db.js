// lib/db.js
import { neon } from '@neondatabase/serverless';

export function getDb() {
  return neon(process.env.DATABASE_URL);
}

// Run this ONCE to create all tables — call /api/setup to initialize
export async function setupSchema() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS admin (
      id               SERIAL PRIMARY KEY,
      password         TEXT NOT NULL,
      zoom_link        TEXT DEFAULT '',
      zoom_id          TEXT DEFAULT '',
      zoom_pass        TEXT DEFAULT '',
      reminder_minutes INTEGER DEFAULT 15,
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS slots (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date       DATE NOT NULL,
      time       TEXT NOT NULL,
      label      TEXT NOT NULL,
      duration   INTEGER NOT NULL DEFAULT 60,
      price      INTEGER NOT NULL,
      slot_type  TEXT NOT NULL DEFAULT 'regular',
      status     TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(date, time)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slot_id        UUID NOT NULL REFERENCES slots(id),
      client_name    TEXT NOT NULL,
      client_email   TEXT NOT NULL,
      client_phone   TEXT,
      notif_method   TEXT NOT NULL DEFAULT 'email',
      notes          TEXT,
      amount         INTEGER NOT NULL,
      payment_method TEXT,
      payment_ref    TEXT,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      zoom_link_sent BOOLEAN DEFAULT FALSE,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reminders (
      id           SERIAL PRIMARY KEY,
      booking_id   UUID NOT NULL REFERENCES bookings(id),
      scheduled_at TIMESTAMPTZ NOT NULL,
      sent         BOOLEAN DEFAULT FALSE,
      sent_at      TIMESTAMPTZ
    )
  `;

  return true;
}
