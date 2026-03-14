# Kids Lose Stuff v2

This version includes:

- Public gallery with search and filters
- Claim modal with minimal PII
- Admin page for uploads
- Client-side image compression before upload
- Claim review table
- Returned-item hard delete

## Folder structure

- `apps-script/Code.gs`
- `apps-script/appsscript.json`
- `public/index.html`
- `public/admin.html`
- `public/styles.css`
- `public/app.js`
- `public/admin.js`

## Google Sheet tabs

Create one spreadsheet with these tabs and header rows:

### items
`id | photoFileId | category | color | notes | dateFound | status | createdAt`

### claims
`id | itemId | parentEmail | studentFirst | studentLastInitial | note | date | status`

### admins
`email`

Add your email address to the `admins` tab.

## Setup

1. Create a Google Drive folder for photos.
2. Copy the Sheet ID and Drive folder ID.
3. Paste them into `apps-script/Code.gs`.
4. Create a new Google Apps Script project and paste in:
   - `Code.gs`
   - `appsscript.json`
5. Deploy as a Web App.
6. Replace `PASTE_APPS_SCRIPT_WEB_APP_URL` in:
   - `public/app.js`
   - `public/admin.js`

## Local testing

From the `public` folder, run one of these:

```bash
npx serve .
```

or

```bash
python3 -m http.server 8080
```

Then open:

- `http://localhost:3000/index.html` if using serve
- `http://localhost:3000/admin.html` if using serve

or

- `http://localhost:8080/index.html` if using Python
- `http://localhost:8080/admin.html` if using Python

## Caveat

For simplicity, public images currently use Google Drive thumbnail URLs.
That is fine for testing the workflow, but the next hardening pass should proxy image delivery through the backend.
