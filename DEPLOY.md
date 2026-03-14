# Lost & Found — Deployment Guide

A zero-cost, privacy-first lost-item gallery for schools.
Built on Cloudflare Workers + D1 + R2 + Pages. No egress fees.

---

## Prerequisites

- A free Cloudflare account (cloudflare.com)
- Node.js 18+ installed
- A Google account for OAuth setup

---

## Step 1 — Google OAuth Credentials

1. Go to https://console.cloud.google.com
2. Create a new project (e.g. "Lost and Found")
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name it anything (e.g. "Lost and Found App")
7. Under **Authorized redirect URIs**, add:
   ```
   https://kids-lose-stuff.YOUR_SUBDOMAIN.workers.dev/api/auth/callback
   ```
   *(You'll know your worker URL after Step 3 — come back and add it)*
8. Click **Create** and note your **Client ID** and **Client Secret**

---

## Step 2 — Install Wrangler & Log In

```bash
npm install -g wrangler
wrangler login
```

This opens a browser to authenticate with your Cloudflare account.

---

## Step 3 — Create Cloudflare Resources

```bash
# Create the D1 database
wrangler d1 create kids-lose-stuff
# → Note the database_id it prints

# Create the R2 bucket
wrangler r2 bucket create kids-lose-stuff-photos
```

---

## Step 4 — Configure the Worker

Edit `worker/wrangler.toml`:

```toml
[[d1_databases]]
database_id = "PASTE_YOUR_D1_ID_HERE"

[vars]
FRONTEND_URL = "https://YOUR_PROJECT.pages.dev"   # fill after Step 7
WORKER_URL   = "https://kids-lose-stuff.YOUR_SUBDOMAIN.workers.dev"
```

To find your worker URL subdomain, run `wrangler whoami`.
Your worker URL will be `https://kids-lose-stuff.ACCOUNTNAME.workers.dev`.

---

## Step 5 — Set Secrets

```bash
cd worker

wrangler secret put GOOGLE_CLIENT_ID
# paste your Google OAuth Client ID

wrangler secret put GOOGLE_CLIENT_SECRET
# paste your Google OAuth Client Secret

wrangler secret put JWT_SECRET
# paste a long random string — generate one with: openssl rand -hex 32

wrangler secret put SUPERADMIN_EMAIL
# paste YOUR Google email address — this gets full superadmin access
```

---

## Step 6 — Initialize the Database

```bash
cd worker
npm run db:init
```

This runs `schema.sql` and creates the tables.

---

## Step 7 — Deploy the Worker

```bash
cd worker
npm install
npm run deploy
```

Note the URL it prints, e.g.:
```
https://kids-lose-stuff.myaccount.workers.dev
```

Go back to **Step 4** and update `WORKER_URL` in `wrangler.toml`, then redeploy:
```bash
npm run deploy
```

Also go back to **Step 1** and add the callback URL to your Google OAuth client:
```
https://kids-lose-stuff.myaccount.workers.dev/api/auth/callback
```

---

## Step 8 — Deploy the Frontend

```bash
cd frontend
npm install
npm run build
```

Then deploy to Cloudflare Pages:

```bash
wrangler pages deploy dist --project-name kids-lose-stuff
```

On first run it will create the project and give you a URL like:
```
https://kids-lose-stuff.pages.dev
```

Go back to **Step 4** and update `FRONTEND_URL` in `wrangler.toml`, then redeploy the worker:
```bash
cd ../worker && npm run deploy
```

Also create a `.env` file in `frontend/`:
```
VITE_API_URL=https://kids-lose-stuff.YOUR_SUBDOMAIN.workers.dev
```
Rebuild and redeploy the frontend:
```bash
cd frontend && npm run build
wrangler pages deploy dist --project-name kids-lose-stuff
```

---

## Step 9 — First Login & Setup

1. Visit your Pages URL and click **Sign in with Google** using your superadmin email
2. You'll land on the Dashboard
3. Click **⚙️ Admin** in the navbar
4. Click **+ Add School**, fill in the school name and slug
   - Slug becomes the gallery URL: `/gallery/lincoln-elementary`
5. Add faculty members by their Google email addresses
   - **Staff**: can upload items and mark them returned
   - **School Admin**: can also manage faculty

---

## Step 10 — Share the Gallery

From the Admin panel, click the gallery link for a school.
Share this URL with parents via email, group chat, or your school newsletter:
```
https://kids-lose-stuff.pages.dev/gallery/YOUR-SCHOOL-SLUG
```

Parents can browse without any login and tap **Claim This Item** on anything they recognize.

---

## Adding More Schools

Repeat Step 9 for each school. Each gets its own `/gallery/slug` URL and its own isolated faculty list.

---

## Local Development

### Worker (with live D1 + R2)
```bash
cd worker
npm run dev
# Runs on http://localhost:8787
```

### Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
# Proxies /api/* to localhost:8787
```

---

## Free Tier Limits (Cloudflare)

| Resource     | Free Limit              | Expected Usage    |
|-------------|------------------------|-------------------|
| R2 Storage  | 10 GB                  | ~50K photos       |
| R2 Egress   | **Free forever** ✅    | unlimited         |
| D1 Reads    | 25M / day              | well under        |
| D1 Storage  | 5 GB                   | negligible        |
| Workers     | 100K requests / day    | well under        |
| Pages       | Unlimited bandwidth    | ✅                |

You will not receive a bill for normal school usage.

---

## Privacy Notes

- **No parent accounts** are created. Parents browse anonymously.
- Claims store only: child's initials, teacher's name. No full names, no contact info.
- When an item is marked **Returned**, the photo is permanently deleted from R2
  and the database row (including claim) is hard-deleted. Nothing is archived.
- Faculty authenticate via Google OAuth — no passwords stored.
