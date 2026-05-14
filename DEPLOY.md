# Deploy to Vercel + Neon + Resend

## Your folder structure after this
```
BookMe/
├── index.html          ← the website (already done)
├── api-client.js       ← connects website to backend
├── vercel.json         ← Vercel config + cron job
├── package.json        ← dependencies
├── .env                ← your secrets (never commit this)
├── .gitignore
├── lib/
│   ├── db.js           ← Neon database
│   ├── auth.js         ← JWT helpers
│   └── email.js        ← Resend emails
└── api/
    ├── setup.js        ← one-time DB init
    ├── auth/login.js
    ├── slots/
    ├── bookings/
    ├── settings/
    └── cron/reminders.js
```

---

## Step 1 — Add api-client.js to index.html

Open `index.html`. Find the closing `</body>` tag and add ONE line before it:

```html
  <script src="api-client.js"></script>
</body>
```

---

## Step 2 — Create .gitignore

Create a file called `.gitignore` in your project root:
```
.env
node_modules/
```
⚠️ IMPORTANT: Never commit `.env` — it contains your secret keys.

---

## Step 3 — Push to GitHub

```bash
cd your-project-folder
git add .
git commit -m "Add backend"
git push
```

---

## Step 4 — Add Environment Variables in Vercel

1. Go to vercel.com → your project (BookMe) → Settings → Environment Variables
2. Add each variable from `.env` one by one:

| Name | Value |
|------|-------|
| DATABASE_URL | postgresql://neondb_owner:... (your full Neon string) |
| RESEND_API_KEY | re_an6RPBzy_... |
| EMAIL_FROM | Dr. Abdullah Hadi Consulting <onboarding@resend.dev> |
| JWT_SECRET | (generate one: go to https://generate-secret.vercel.app/64) |
| ADMIN_PASSWORD | Admin@DrAbdullah2024 |
| SETUP_SECRET | setup_drAbdullah_2024 |
| ZOOM_MEETING_LINK | https://zoom.us/j/YOUR_REAL_MEETING_ID |
| ZOOM_REMINDER_MINUTES | 15 |
| CRON_SECRET | cron_drAbdullah_2024 |
| FRONTEND_URL | https://book-aqljozd5c-anas-q-s-projects.vercel.app |

3. Click "Save" then go to Deployments → Redeploy

---

## Step 5 — Initialize the Database (ONCE)

After deploying, open this URL in your browser:

```
https://book-aqljozd5c-anas-q-s-projects.vercel.app/api/setup?secret=setup_drAbdullah_2024
```

You should see:
```json
{ "ok": true, "message": "Database ready. Admin account exists." }
```

✅ Done! Your database tables are created.

---

## Step 6 — Set up Resend domain (optional but recommended)

Right now emails send from `onboarding@resend.dev` (Resend's test address).
To send from your own domain:
1. Go to resend.com → Domains → Add Domain
2. Follow their DNS instructions
3. Change `EMAIL_FROM` in Vercel env vars to `Dr. Abdullah Hadi Consulting <noreply@yourdomain.com>`

---

## Step 7 — Test it

1. Go to your site
2. Admin panel → password: `Admin@DrAbdullah2024`
3. Add a slot for today
4. Book it as a client
5. Check your email for the confirmation

---

## Zoom Cron (automatic Zoom link delivery)

Vercel automatically runs `/api/cron/reminders` every minute.
It checks for sessions starting soon and emails the Zoom link.

To test it manually, visit:
```
https://your-site.vercel.app/api/cron/reminders
```
(Add `Authorization: Bearer cron_drAbdullah_2024` header if it blocks you)
