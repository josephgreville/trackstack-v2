# TrackStack — Hosting & Deployment Runbook

Two deployment shapes are supported. **Option A** (one Docker service) is the recommended one and
is what the live demo should use. Option B (split across a CDN and an API host) is documented
because the client is already a static bundle and the Android app needs an absolute API URL.

---

## Option A — Render (recommended: API + client + Postgres in one place)

### Why

* The client and the API share one origin → the session cookie can stay `SameSite=Lax`, there is
  no CORS preflight, and CSRF defences stay at their strongest.
* The Express app already serves `client/dist` in production, so one container is the whole app.
* One URL for the demo: `https://trackstack.onrender.com`.
* `render.yaml` in this repo is a Blueprint: it creates the service *and* the database with the
  right environment variables already set.

### Deploy

**Step 1 — push the repo**

```sh
git push origin main
```

**Step 2 — create the Blueprint**

1. Go to <https://render.com> → **New → Blueprint**.
2. Connect the GitHub repository (`.../trackstack-v2`).
3. Render reads `render.yaml` from the repo root and shows the resources it will create:
   * `trackstack` — a Docker web service (free plan).
   * `trackstack-db` — a PostgreSQL 16 database (free plan, **expires after 30 days**).
4. Click **Apply**.

**Step 3 — check the environment variables**

Render fills these from the Blueprint. Confirm in *Environment*:

| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enables static serving of `client/dist` |
| `DATABASE_URL` | from the database | Set automatically by the Blueprint |
| `SESSION_SECRET` | generated | `generateValue: true` in the Blueprint — rotate it if you ever leak it |
| `CLIENT_ORIGIN` | `https://trackstack.onrender.com` | Must match the public URL exactly, no trailing slash |
| `COOKIE_SECURE` | `true` (implied) | Forced on when `NODE_ENV=production` |
| `COOKIE_SAMESITE` | `lax` | One origin, so `Lax` is safe and stronger than `None` |
| `TRUST_PROXY` | `true` | Render terminates TLS in front of the service |
| `ITUNES_COUNTRY` | `GB` | Change to `US` etc. if you want a different storefront |

**Step 4 — watch the first deploy**

The build runs `docker build`. Migrations run automatically at container start (the `CMD` in the
`Dockerfile` runs `npm run db:migrate --workspace server` before starting the server). Watch the
**Logs** tab for:

```
Applying 001_initial.sql…
Applying 002_current_schema_compatibility.sql…
…
Database is up to date.
TrackStack API listening on http://localhost:4000 (production)
```

**Step 5 — smoke test**

```sh
curl https://trackstack.onrender.com/api/v1/health
# {"status":"ok","service":"trackstack-api"}
```

Then open the URL in a browser, register an account and add one album to a collection.

**Step 6 — seed the demo data (optional but recommended)**

The service container has the seed script, so use Render's **Shell** tab on the service:

```sh
npm run db:seed
```

```
Seed complete.
  demo_joey  ·  joey@example.com  ·  Password123!
  sam_beats  ·  sam@example.com   ·  Password123!
```

> **If your URL is not `https://trackstack.onrender.com`** (the name is taken, or you renamed the
> service), update `CLIENT_ORIGIN` in the service's *Environment* tab to your exact URL, then
> **Save & Deploy**. If it doesn't match, login silently fails — the cookie is rejected and the
> browser bounces you back to the login screen.

**Step 7 — verify the whole thing**

```sh
# API
curl -s https://trackstack.onrender.com/api/v1/health

# SPA served by the same container
curl -s -o /dev/null -w '%{http_code}\n' https://trackstack.onrender.com/
# 200

# Deep link falls back to index.html
curl -s -o /dev/null -w '%{http_code}\n' https://trackstack.onrender.com/collections
# 200
```

Then open the site, log in as `joey@example.com` / `Password123!`, and walk the demo journey in
`docs/presentation.md`.

### Redeploying after a code change

Push to `main` and Render redeploys automatically. Migrations are idempotent, so re-running them is
safe.

### Custom domain (optional)

Render → *Settings → Custom Domains* → point a CNAME at `trackstack.onrender.com`. Then update
`CLIENT_ORIGIN` to the new domain and redeploy.

### Free-tier caveats

| Limit | What happens | What to do |
|---|---|---|
| Web service sleeps after 15 min idle | First request takes ~30 s to wake up | Wake it before the demo (hit `/api/v1/health` 5 minutes early) |
| Free Postgres expires after 30 days | Database is deleted | Before it expires: *Settings → Upgrade* to a paid instance, or export with `pg_dump` and restore to a new database |
| 750 idle hours/month | Service pauses | Fine for a single demo |

---

## Option B — Split deployment (Netlify for the client + Railway/Render for the API)

Use this when you want a CDN in front of the client, or when you already have a Railway project.

```
Browser ──▶ Netlify (static client)  ──▶ /api proxy ──▶ Railway (Express) ──▶ Postgres
```

### B1 — Netlify proxy rewrite (recommended for the split)

`netlify.toml` rewrites `/api/*` to the API host, so the browser still talks to a **single
origin**. That keeps the session cookie first-party (`SameSite=Lax`) and avoids CORS entirely.

1. Deploy the API to Railway (or Render with `runtime: node`, no static serving) and note the URL,
   e.g. `https://trackstack-api.up.railway.app`.
2. In `netlify.toml`, set the rewrite target to your API URL:

   ```toml
   [[redirects]]
   from = "/api/*"
   to = "https://trackstack-api.up.railway.app/api/:splat"
   status = 200
   force = true
   ```

3. Deploy the client to Netlify:
   * **Site configuration → Build settings**
   * Base directory: *(leave empty — the repo root holds the workspaces)*
   * Build command: `npm ci && npm run build --workspace client`
   * Publish directory: `client/dist`
   * Environment: `NODE_VERSION = 20`
4. On the API host set:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | the Railway Postgres connection string |
   | `SESSION_SECRET` | a long random string |
   | `CLIENT_ORIGIN` | `https://<your-site>.netlify.app` |
   | `TRUST_PROXY` | `true` |
   | `COOKIE_SAMESITE` | `lax` (the proxy keeps requests same-origin) — set to `none` if you use B2 |

5. Railway: add a Postgres plugin, set `DATABASE_URL` from it, and run migrations once —
   `npm run db:migrate --workspace server` from a Railway shell, or add it to the start command.

### B2 — Absolute API URL (needed for the native Android app)

The Android build loads from `https://localhost`, so it cannot use a relative `/api` path. The
client reads its API base from `VITE_API_URL` at build time, overridable at runtime from the app's
server settings screen (`client/src/api/client.js`).

* Netlify build environment: `VITE_API_URL = https://trackstack-api.up.railway.app/api/v1`
* API host: `CLIENT_ORIGIN = https://<your-site>.netlify.app` and `COOKIE_SAMESITE = none`
  (the Android app is a third-party origin, so the cookie must be `None; Secure`).

### Why the Android app exists here

Capacitor wraps the same React build in a native shell. `android/` is checked in and the API base
is runtime-configurable, so one APK can point at a local dev API, a staging API or production
without a rebuild.

---

## Running it entirely locally (no hosting account needed)

```sh
# 1. Postgres 16 in Docker
docker compose up -d db

# 2. Install and set up
npm install
cp .env.example .env          # then edit DATABASE_URL / SESSION_SECRET
npm run db:migrate

# 3. Run API (:4000) and client (:5173) together
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` to the API on port 4000, so there is no CORS in
development.

### Portable container (no hosting account needed, but deployable anywhere)

```sh
docker build -t trackstack .
docker run -p 4000:4000 --env-file .env trackstack
```

The image contains the built client and the API, and serves both on port 4000. It runs unchanged
on Render, Railway, Fly.io, Azure Container Apps, AWS ECS or a university VM — that is the
answer to "it runs locally, so how would you host it?".

---

## Configuration reference

Every variable lives in `.env` locally and in the host's dashboard in production. `.env` is
git-ignored; `.env.example` is the committed template.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | in production | `development` | `production` enables static client serving and secure cookies |
| `PORT` | no | `4000` | API port |
| `DATABASE_URL` | **yes** | local docker value | Postgres connection string |
| `TEST_DATABASE_URL` | for tests | `…/trackstack_test` | Separate database so tests never touch dev data |
| `SESSION_SECRET` | **yes** (≥32 chars in production) | dev fallback | Signs the session cookie |
| `SESSION_MAX_AGE_DAYS` | no | `14` | Session lifetime |
| `COOKIE_SECURE` | no | auto (`true` in production) | `Secure` flag on the cookie |
| `COOKIE_SAMESITE` | no | `lax` / `none` in production | Needed `none` for cross-origin clients |
| `TRUST_PROXY` | no | `false` | Set `true` behind a TLS-terminating proxy |
| `CLIENT_ORIGIN` | **yes** in production | `http://localhost:5173` | Comma-separated allow-list of front-end origins |
| `ITUNES_BASE_URL` | no | `https://itunes.apple.com` | Catalogue API base URL |
| `ITUNES_COUNTRY` | no | `GB` | Storefront country |
| `ITUNES_TIMEOUT_MS` | no | `8000` | Upstream timeout |
| `ITUNES_CACHE_TTL_MS` | no | `300000` | Catalogue cache lifetime |
| `VITE_API_URL` | no | `/api/v1` | Absolute API base for the client build (Android / split hosting) |

### Secret handling

* `.env` is in `.gitignore`; `.env.example` contains placeholders only.
* `SESSION_SECRET` is generated on the host, never committed, and can be rotated by updating the
  host variable and redeploying (this signs everyone out — acceptable).
* `DATABASE_URL` is injected by the platform's database plugin, never written into the image.
* The iTunes Search API requires **no API key**, which removes the most common way a key leaks
  into front-end code. If a keyed API is ever added, the call must live in
  `server/src/services/` and the key must come from the host's environment — never from
  `import.meta.env`, which is inlined into the JavaScript bundle and readable by anyone.

---

## Pre-demo checklist

```sh
# 1. The service is awake (free tier sleeps after 15 minutes)
curl -s https://trackstack.onrender.com/api/v1/health

# 2. The database is reachable and migrated
npm run db:migrate

# 3. The demo data is in place (safe to re-run; only touches the demo accounts)
npm run db:seed

# 4. The tests pass against a fresh test database
npm test

# 5. The client builds
npm run build
```

Demo logins: `joey@example.com` / `Password123!` (the collector) and `sam@example.com` /
`Password123!` (a second collector who follows them).

Then, in the browser:

- [ ] Register a new account (not just log in) — the demo journey starts at registration.
- [ ] Browse → search an artist → open an album → add it to a collection with format/condition.
- [ ] Stacks → open the collection → stats → CSV export.
- [ ] Community → follow a seeded user → like their collection.
- [ ] You → Wrapped (year) → Achievements.
- [ ] Share a collection → open the share link in a private window (it works signed out).
- [ ] Resize the window to phone width to show the bottom-tab dock.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Missing required environment variable: SESSION_SECRET` | Not set in production | Set it on the host (32+ random chars) and redeploy |
| `Could not connect to PostgreSQL` | `DATABASE_URL` wrong, or DB not ready | Check the platform's database is provisioned; Render links it via the Blueprint |
| Login succeeds then immediately logs out | `CLIENT_ORIGIN` mismatch → cookie rejected | `CLIENT_ORIGIN` must exactly match the front-end origin, no trailing slash |
| CORS error in the browser console | Split deployment without the proxy rewrite | Add `CLIENT_ORIGIN` on the API and use the Netlify proxy rewrite (B1) |
| Blank page, `GET /` 404 | Client not built or `NODE_ENV` not `production` | Ensure the build ran and `client/dist` exists in the image |
| Browse is empty | iTunes unreachable | Check outbound network; the 5-minute cache means results appear after the first successful call |
| First request takes 30 s | Free tier waking up | Expected — wake it before the demo |
