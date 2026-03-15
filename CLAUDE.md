# Kids Lose Stuff — Project Context

## What This Is
A free, privacy-first lost-and-found gallery app for schools. Faculty upload photos of lost items; parents browse a public gallery and claim items by entering their child's initials and homeroom teacher's name. Once an item is returned, it is hard-deleted from every layer of the system (no archives, no PII retained).

## Stack
| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite + TypeScript | CSS Modules, React Router v6 |
| Backend | Cloudflare Worker (TypeScript) | Single `src/index.ts` file router |
| Database | Cloudflare D1 (SQLite) | `kids-lose-stuff` database |
| Storage | Cloudflare R2 | `kids-lose-stuff-photos` bucket |
| Hosting | Cloudflare Pages | `kids-lose-stuff` project |
| Auth | Google OAuth 2.0 + JWT (HttpOnly cookie) | No parent accounts — public gallery is anonymous |

## Deployment
- **Worker URL:** `https://kids-lose-stuff.nerdiesthippie.workers.dev`
- **Frontend URL:** `https://kids-lose-stuff.pages.dev`
- **Worker name:** `kids-lose-stuff`
- **Pages project:** `kids-lose-stuff`
- **D1 database name:** `kids-lose-stuff`
- **R2 bucket name:** `kids-lose-stuff-photos`

## Roles
| Role | Can do |
|---|---|
| `superadmin` | Everything — set via `SUPERADMIN_EMAIL` secret, not stored in DB |
| `schooladmin` | Upload items, mark returned, manage their school's team (Staff/Volunteers) |
| `staff` | Upload items, mark returned |
| `volunteer` | Same as staff (may diverge later) |

Parents have no account — they access `/gallery/:slug` anonymously.

## Project File Structure
```
kids-lose-stuff/
├── DEPLOY.md
├── worker/
│   ├── src/index.ts          # All API routes
│   ├── schema.sql            # D1 schema (must run with --remote flag)
│   ├── wrangler.toml         # Config — worker name, D1 id, R2 bucket
│   ├── tsconfig.json
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── package.json
    ├── .env.production       # VITE_API_URL=https://kids-lose-stuff.nerdiesthippie.workers.dev
    ├── public/
    │   └── _redirects        # SPA fallback only — no proxy rules (Pages doesn't support external proxy)
    └── src/
        ├── main.tsx
        ├── App.tsx           # Router + AuthContext (useAuth hook)
        ├── api.ts            # Typed API client — BASE url hardcoded as fallback
        ├── types.ts          # Shared TS types: School, Item, Me, FacultyMember
        ├── index.css         # Global styles + CSS variables
        ├── vite-env.d.ts     # Required for import.meta.env types
        ├── css.d.ts          # Required for *.module.css imports
        ├── components/
        │   ├── ClaimModal.tsx    # Public claim flow (initials + teacher name)
        │   └── UploadModal.tsx   # Faculty photo upload with client-side compression
        └── pages/
            ├── Login.tsx         # Google OAuth sign-in page
            ├── Gallery.tsx       # Public parent-facing gallery
            ├── Dashboard.tsx     # Faculty dashboard — items table + Team tab (schooladmin+)
            ├── AdminPanel.tsx    # Superadmin — manage schools + faculty
            └── *.module.css      # CSS modules for each page
```

## API Routes (Worker)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/gallery/:slug` | Public | Gallery items for a school |
| GET | `/api/images/:key` | Public | Proxy image from R2 |
| POST | `/api/items/:id/claim` | Public | Submit a claim |
| GET | `/api/auth/login` | — | Redirect to Google OAuth |
| GET | `/api/auth/callback` | — | Google OAuth callback, sets cookie |
| POST | `/api/auth/logout` | — | Clears cookie |
| GET | `/api/me` | Auth | Current user info |
| GET | `/api/dashboard` | Auth | Items + claims for a school |
| POST | `/api/items` | Auth | Upload new item (multipart) |
| DELETE | `/api/items/:id` | Auth | Hard-delete item + R2 photo |
| GET | `/api/schools` | Auth | All schools (superadmin) or own school |
| POST | `/api/schools` | Superadmin | Create school |
| GET | `/api/schools/:id/faculty` | schooladmin+ | List faculty |
| POST | `/api/schools/:id/faculty` | schooladmin+ | Add faculty member |
| DELETE | `/api/schools/:id/faculty/:fid` | schooladmin+ | Remove faculty member |

## D1 Schema (summary)
- `schools` — id, name, slug
- `faculty` — id, school_id, email, name, role
- `items` — id, school_id, description, image_key (R2 key), status, created_by
- `claims` — id, item_id, initials, teacher_name (ON DELETE CASCADE from items)

## Known Issues / Next Steps
- **Image uploads not yet working** — `POST /api/items` accepts multipart with `image`, `description`, `schoolId` fields and writes to R2, but this has not been tested end-to-end. This is the next thing to debug/validate.
- The `UploadModal.tsx` component does client-side JPEG compression (max 1200px) before upload using a canvas element.
- The `capture="environment"` attribute on the file input opens the rear camera on mobile.

## Lessons Learned / Gotchas
- **Incognito + 3rd-party cookies:** Google OAuth login fails silently in Incognito with 3rd-party cookies disabled — the Sign In button just refreshes the page. This is not a bug; tell users not to use Incognito.
- **`VITE_API_URL` env var:** Must be set either in Cloudflare Pages dashboard (Settings → Environment variables) OR hardcoded as a fallback in `api.ts`. The `.env.production` file alone is not reliably picked up by Pages CI builds.
- **Cloudflare Pages `_redirects`:** Does NOT support proxying to external URLs (the `200` rewrite to a `https://` target is a Netlify-only feature). All `/api/*` calls must go directly to the worker URL baked into the JS bundle.
- **D1 schema deployment:** Must use `--remote` flag: `wrangler d1 execute kids-lose-stuff --file=schema.sql --remote`. Without it, changes only apply to the local dev database.
- **`wrangler secret put` must be run from `worker/`** (where `wrangler.toml` lives) or pass `--name kids-lose-stuff`.
- **Worker URL for secrets/deploy:** `wrangler.toml` `name` field must be `kids-lose-stuff` and match the D1/R2 resource names.
