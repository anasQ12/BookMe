// api-client.js — place in root alongside index.html
const API_BASE = 'https://book-me-ten.vercel.app/api';
let _token = localStorage.getItem('ahc_token') || null;

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (_token) headers['Authorization'] = 'Bearer ' + _token;
  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function apiLogin(password) {
  const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ password }) });
  _token = data.token;
  localStorage.setItem('ahc_token', _token);
  return data;
}
function apiLogout() { _token = null; localStorage.removeItem('ahc_token'); }
function isAdminLoggedIn() { return !!_token; }

// ── Slots ─────────────────────────────────────────────────────────────────────
async function apiGetAvailableDates() { return apiFetch('/slots/dates'); }
async function apiGetSlotsByDate(date) { return apiFetch('/slots?date=' + date); }
async function apiGetAdminSlots() { return apiFetch('/slots?admin=1'); }
async function apiCreateSlot(slot) {
  return apiFetch('/slots', { method: 'POST', body: JSON.stringify(slot) });
}
async function apiDeleteSlot(id) {
  return apiFetch('/slots/' + id, { method: 'DELETE' });
}

// ── Bookings ──────────────────────────────────────────────────────────────────
async function apiCreateBooking(data) {
  return apiFetch('/bookings', { method: 'POST', body: JSON.stringify(data) });
}
async function apiConfirmPayment(bookingId, paymentRef, paymentMethod) {
  return apiFetch('/bookings/' + bookingId + '/confirm-payment', {
    method: 'POST',
    body: JSON.stringify({ payment_ref: paymentRef, payment_method: paymentMethod }),
  });
}
async function apiCancelBooking(bookingId) {
  return apiFetch('/bookings/' + bookingId + '/cancel', { method: 'POST' });
}
async function apiGetBookings() { return apiFetch('/bookings'); }
async function apiGetStats() { return apiFetch('/bookings/stats'); }
async function apiUpdateBooking(id, data) {
  return apiFetch('/bookings/' + id, { method: 'PATCH', body: JSON.stringify(data) });
}

// ── Settings ──────────────────────────────────────────────────────────────────
async function apiGetSettings() { return apiFetch('/settings'); }
async function apiSaveSettings(data) {
  return apiFetch('/settings', { method: 'PATCH', body: JSON.stringify(data) });
}
