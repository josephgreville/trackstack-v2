# TrackStack — Architecture Document

**TrackStack** is a home for physical music collections: browse the iTunes catalogue, build multiple
collections, track the format / condition / price of each copy, keep a wantlist and listening journal,
and share your shelves with other collectors.

This document covers the tech stack and why it was chosen, the data model, the API surface, security
decisions, the hosting plan and the risks we know about.

---

## 1. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Language (API) | **JavaScript (ESM) on Node.js 20** | One language across client and server. The brief lets the AI write most of the code — a single language means one set of mental models and one linter/formatter config. Node is also the best-supported runtime for the "API + Postgres" pattern we need. |
| Framework (API) | **Express 5** | Small, boring, and the most-documented HTTP framework for Node. Express 5 has native async error propagation, which removed a whole class of "unhandled promise rejection" bugs. |
| Database | **PostgreSQL 16** | The data is relational and highly relational-constraint friendly: users own collections, collections join albums, and we have follows, likes, comments and stories. Postgres gives us real foreign keys, `CHECK` constraints, `jsonb` for flexible metadata, transactional writes and a `connect-pg-simple` session store. A document DB would have meant hand-rolling integrity. |
| DB access | **`pg` (node-postgres)** + a thin query layer | No heavyweight ORM. The queries are explicit SQL, which is easier to reason about for a graded project where "understand your database" matters. Writes that touch multiple tables run inside a transaction (`server/src/db/transaction.js`). |
| Migrations | **Plain numbered `.sql` files** run by `server/src/db/migrate.js` | Version-controlled, reviewable, and idempotent — each file is applied once and recorded in `schema_migrations`. No migration framework to learn. |
| Validation | **zod** | Every request body, query and param is validated in a `validate()` middleware before a controller runs. Invalid input never reaches SQL. |
| Auth | **`express-session` + `connect-pg-simple`** | Server-side sessions in the `sessions` table. The cookie is only a signed session id — no JWT in `localStorage`, so an XSS bug can't steal a long-lived token. Sessions are revocable server-side, which JWTs are not. |
| Password hashing | **bcryptjs** | Pure-JS bcrypt, no native build step (important for a Dockerfile that must build anywhere). Cost factor is applied at hash time. |
| Language (client) | **React 19** | Component model that maps cleanly to "one page = one component", and the ecosystem we know well. |
| Routing | **React Router 7** | Declarative, nested routes with layouts, plus `RequireAuth` / `GuestOnly` guards. |
| Build tool | **Vite 6** | Instant dev server, fast production builds, simple static output (`client/dist`) — the same folder can be served by Netlify *or* by Express in production. |
| Styling | **Tailwind CSS 3 + CSS variables** | Utility classes for layout consistency, a token file (`client/src/styles/tokens.css`) for the palette so the "sticker book" look lives in one place. |
| Animation | **Framer Motion** | Spring physics and layout animation, all gated behind `prefers-reduced-motion`. |
| Third-party API | **iTunes Search API** | Album catalogue + artwork + 30s preview clips. Chosen because it needs **no API key**, returns structured JSON, and is not rate-limited for a demo. All calls go through the server (`server/src/services/itunesService.js`), never from the browser. |
| Mobile | **Capacitor 8 (Android)** | The same React build runs in a native shell; `android/` in the repo. The API base URL is runtime-configurable from the app. |
| Tests | **Vitest + Testing Library + Supertest** | Vitest shares Vite's config, so one command runs both client and server suites. Supertest drives the real Express app against a real Postgres test database. |

### Repository layout

```
trackstack-v2/
├── client/                 React 19 SPA (Vite)
│   ├── src/api/            fetch wrapper (single place that knows the API base URL)
│   ├── src/components/     shared UI
│   ├── src/context/        Auth, Toast, Player
│   ├── src/layout/         AppLayout (tabs/rail), AuthLayout
│   ├── src/pages/          one file per route
│   └── src/styles/         design tokens + component CSS
├── server/                 Express 5 API
│   ├── migrations/         numbered SQL schema changes
│   ├── src/controllers/    HTTP shape: parse request → call service → send response
│   ├── src/services/       business logic + SQL
│   ├── src/routes/         URL → middleware → controller
│   ├── src/middleware/     auth, validation, rate limit, error handling
│   └── src/db/             pool, transactions, migration runner
├── android/                Capacitor native shell
├── docs/                   architecture, hosting, testing
└── docker-compose.yml      local PostgreSQL 16
```

The client/server split is a **monorepo with npm workspaces**, not two repos. One `package.json`
at the root installs both, one `npm run dev` starts both with hot reload, and one GitHub push
ships both.

### Request flow

```
Browser ──HTTPS──▶ Express (helmet, CORS, rate limit, session)
                        │
                        ├─ validate()  → zod schema per route
                        ├─ requireAuth → session id → users row
                        ├─ controller  → shapes the HTTP response
                        └─ service     → SQL against Postgres  ──┐
                                                                │
Browser ◀──JSON────────── Express ◀──rows──────────────────────┘
```

Controllers never write SQL; services never touch `req`/`res`. That split is what makes the code
testable and is the main thing I'd point at if someone asks "how do you know it works".

---

## 2. Data model

PostgreSQL, 16 tables, all UUID primary keys (`gen_random_uuid()`), all timestamps `timestamptz`.

### Core (the required "users → collections → things" shape)

```
users ──┬──< collections ──< collection_albums >── albums
        │                         (many-to-many)      │
        │                                             │
        ├──< wantlist_items >─────────────────────────┤
        ├──< listening_history >──────────────────────┘
        ├──< listening_sessions >── albums
        └──< sessions  (server-side auth)
```

**users** — `id`, `username`, `email`, `password_hash`, `xp`, `level`, `bio`, `avatar_url`,
`location`, `website`, `profile_public`, timestamps.
Unique indexes on `lower(email)` and `lower(username)` — case-insensitive login without
colliding "Joey" and "joey".

**collections** — `id`, `user_id` → users, `name`, `description`, `is_public`, `share_token`,
`shelf_theme`, `layout_pref`, timestamps.
`UNIQUE (user_id, lower(name))` — one collector cannot have two "Vinyl" stacks.
`share_token` is a random UUID used for read-only share links (`/share/:token`).

**albums** — shared catalogue metadata: `id`, `title`, `artist`, `release_year`, `genre`,
`artwork_url`, `external_id` (the iTunes collection id, `UNIQUE`), `track_count`, `source`
(`'itunes' | 'manual'`), timestamps.

> **Design decision:** album *metadata* is global and shared, but a *copy* is personal. If two
> people own the same pressing we do not duplicate the album row — we insert two rows into
> `collection_albums`. The copy-specific fields (format, condition, price…) live on the join table.

**collection_albums** — the join table, and also the "my copy" entity:
`collection_id`, `album_id` (composite PK), `added_at`, `format`, `condition`, `purchase_date`,
`price`, `edition_notes`. `CHECK` constraints keep `format` in
`vinyl|cassette|cd|digital|other` and `condition` in `mint…poor`, so bad data can't be inserted
even if a client is bypassed.

**sessions** — `sid`, `sess` (jsonb), `expire`. Required column names by `connect-pg-simple`.

### TrackStack 2.0 tables

| Table | Purpose |
|---|---|
| `wantlist_items` | `(user_id, album_id)` PK, `preferred_edition`, `notes`, `priority` (1–3), `price_alert` |
| `listening_history` | `listened_at`, `rating` (1–5), `review` — the journal |
| `listening_queue_items` | "listen next" queue with position ordering |
| `listening_sessions` | playback sessions for the Wrapped recap |
| `recommendations` | `kind` (similar / genre / hidden_gem / new_to_you), `score`, `dismissed` |
| `achievements` / `user_achievements` | badge definitions with `jsonb` criteria + earned rows |
| `user_follows` | `(follower_id, following_id)` PK, no self-follow constraint |
| `activity_feed` | `type`, `target_type`, `target_id`, `metadata` jsonb |
| `notifications` | `type`, `actor_id`, `message`, `read` |
| `likes` | `(user_id, target_type, target_id)` unique — polymorphic, likeable collections or albums |
| `comments` | `target_type`, `target_id`, `body` — same polymorphic pattern |
| `album_stories` | one personal memory per `(user_id, album_id)`, `location`, `occurred_at`, `is_public` |
| `album_photos` | photos of the physical record, `is_cover`, optional `story_id` |

**Polymorphic targets** (`likes`, `comments`) deliberately use `target_type` + `target_id` instead of
two nullable FK columns: one index serves both target types, and the code has a single
like/unlike path. The trade-off is that the database cannot enforce the foreign key for you —
mitigated by never accepting a `target_type`/`target_id` pair without a lookup inside the same
service call.

### Indexes

Every hot path is indexed: `collections(user_id)`, `albums(lower(title))`, `albums(lower(artist))`,
`collection_albums(collection_id, added_at DESC)`, `activity_feed(created_at DESC)`,
`notifications(user_id, read, created_at DESC)`, `likes(target_type, target_id)`,
`recommendations(user_id, kind, score DESC)`. `updated_at` is maintained by a PostgreSQL trigger
(`set_updated_at()`), so the application never has to remember to set it.

---

## 3. API

Base URL: `/api/v1`. JSON in, JSON out. Every response is either a JSON object or a JSON error
`{ "error": { "code", "message", "details" } }` produced by one central error handler.

### Authentication

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | public | Create account, start a session |
| POST | `/api/v1/auth/login` | public | Log in |
| POST | `/api/v1/auth/logout` | public | Destroy session |
| GET | `/api/v1/auth/me` | public | Current user or `null` |
| PATCH | `/api/v1/auth/profile` | user | Update username / email / bio |

### Catalogue (third-party iTunes data, proxied and cached by our API)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/catalog/search` | Search by term, genre, artist, year range; paginated |
| GET | `/api/v1/catalog/featured` | Curated shelf of eight landmark albums |
| GET | `/api/v1/catalog/albums/:externalId` | Album + track list + 30s previews + related |

### Collections and albums (the "my things" endpoints)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/collections` | My collections |
| POST | `/api/v1/collections` | Create a collection |
| GET | `/api/v1/collections/:id` | One collection + its albums |
| PATCH | `/api/v1/collections/:id` | Rename / edit / shelf theme |
| DELETE | `/api/v1/collections/:id` | Delete |
| GET | `/api/v1/collections/:id/stats` | Breakdown by format, genre, decade, artist |
| GET | `/api/v1/collections/:id/export` | CSV export |
| POST | `/api/v1/collections/:id/import` | CSV import |
| POST | `/api/v1/collections/:id/albums` | **Add an album** (with copy details) |
| PATCH | `/api/v1/collections/:id/albums/:albumId` | **Edit** format / condition / price / notes |
| DELETE | `/api/v1/collections/:id/albums/:albumId` | **Remove** from collection |
| GET | `/api/v1/albums/:id` | Album detail + which of my collections hold it |
| GET | `/api/v1/albums/recent` | Recently added across my collections |

### Personal features (`/api/v1/me`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/v1/me/wantlist` | List / add |
| PATCH/DELETE | `/api/v1/me/wantlist/:id` | Edit / remove |
| POST | `/api/v1/me/wantlist/:id/acquire` | Move a wantlist item into a collection |
| GET | `/api/v1/me/queue` · POST `/api/v1/me/queue` | "Listen next" queue |
| POST | `/api/v1/me/queue/build` | Build a queue from a collection |
| POST | `/api/v1/me/queue/:id/listen` | Play an item → writes history + session |
| GET | `/api/v1/me/history` · POST | Listening journal |
| PATCH | `/api/v1/me/history/:historyId` | Rating / review |
| GET | `/api/v1/me/history/insights` | Journal insights |

### Public / sharing

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/public/share/:token` | Read-only shared collection |
| GET | `/api/v1/public/users/:username` | Public collector profile |

### TrackStack 2.0 (`/api/v1/2`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/2/me` | Profile, XP, level, progress |
| PATCH | `/api/v1/2/profile` | Update collector profile |
| GET | `/api/v1/2/achievements` | Badge catalogue + earned state |
| POST | `/api/v1/2/achievements/check` | Re-evaluate badges |
| GET | `/api/v1/2/wrapped?range=year\|month\|all` | Recap |
| POST | `/api/v1/2/wrapped/sessions` | Log a listening session |
| GET | `/api/v1/2/recommendations` | Discover Weekly picks |
| POST | `/api/v1/2/recommendations/discover-weekly` | Regenerate picks |
| DELETE | `/api/v1/2/recommendations/:id/dismiss` | Dismiss a pick |
| POST/DELETE | `/api/v1/2/social/follow/:userId` | Follow / unfollow |
| GET | `/api/v1/2/social/followers\|following\|follow-status/:userId` | Social graph |
| GET | `/api/v1/2/social/activity` · `/activity/global` | Activity feed |
| GET | `/api/v1/2/social/notifications` · `/notifications/count` | Notifications |
| PATCH | `/api/v1/2/social/notifications/:id/read` · `/read-all` | Mark read |
| POST/DELETE/GET | `/api/v1/2/social/like/:targetType/:targetId` | Likes |
| POST/GET | `/api/v1/2/social/comments/:targetType/:targetId` | Comments |
| GET/PUT | `/api/v1/2/stories/albums/:albumId/story` | Read / write an album story |
| GET | `/api/v1/2/stories` · `/stories/albums/:albumId/stories/public` | Story timeline / public stories |
| POST | `/api/v1/2/stories/stories/:storyId/photos` | Attach a photo |
| DELETE | `/api/v1/2/stories/photos/:photoId` | Delete a photo |

### API conventions

- **All** personal data is scoped to the signed-in collector server-side. A request for someone
  else's private collection returns `404`, never another user's data.
- Validation is explicit: `validate({ body, params, query })` runs the zod schema and returns
  `400` with field-level `details` on failure.
- Mutating routes use the correct verb and status code (`201` on create, `204` on delete).
- Versioning: `/api/v1` for the original surface, `/api/v1/2/*` for the 2.0 feature groups, so the
  original endpoints never change shape underneath a published client.
- `GET /api/v1/health` returns `{"status":"ok"}` after a real `SELECT 1` — used by the host's
  health check.

---

## 4. Security

| Concern | What we did |
|---|---|
| Secrets | `.env` is git-ignored; `.env.example` documents every variable with no real values. The only secrets are `DATABASE_URL` and `SESSION_SECRET` (32+ chars enforced in production). |
| Third-party API keys | The iTunes Search API needs **no key**, so there is no key to leak. The catalogue URL is a server-side env var and all upstream calls are made from `server/src/services/itunesService.js` — the browser never talks to Apple directly, so no key *could* end up in front-end code. |
| Password storage | bcryptjs hash, never logged, never returned by any endpoint. |
| Sessions | Signed, `httpOnly` cookie (`ts.sid`), `SameSite=Lax` locally and `SameSite=None; Secure` in production (needed because the native Android app and a Netlify-hosted client are different origins). Session rows are stored server-side and can be revoked. |
| XSS | React escapes by default; a strict Content-Security-Policy is set via helmet (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`). No `dangerouslySetInnerHTML` anywhere. |
| CSRF | `SameSite` cookies + an origin allow-list check on every request that carries an `Origin` header + `credentials: 'include'` only for allow-listed origins. |
| SQL injection | Parameterised queries only. No string-concatenated user input in SQL, ever. |
| Brute force | `express-rate-limit` — a strict limiter on `/auth/login` and `/auth/register`, a general limiter on `/api`. |
| Authorisation | `requireAuth` for logged-in routes, and an ownership check inside every service that touches user data. |
| Input limits | JSON body limited to 100 kB; string lengths constrained by zod *and* by `CHECK` constraints. |
| Data leakage | Private collections, wantlist, journal and unpublished stories are filtered out of every public endpoint. |

**Residual risk (stated honestly):** the session cookie is `SameSite=None` in production so the
Android app and a CDN-hosted client can share one API. `None` cookies are sent on cross-site
requests, so the origin allow-list and CSP are doing the CSRF work. If the Android app were
dropped, `SameSite=Lax` should be restored.

---

## 5. Responsive design

- **Desktop (≥1024px):** five-tab layout in a left-hand rail; content area is a multi-column grid.
- **Tablet (768–1023px):** rail collapses to icons, grids drop to two columns.
- **Mobile (<768px):** tabs become a floating bottom dock; single-column cards, larger tap
  targets, larger type (a dedicated `client/src/styles/mobile.css` scales the type ramp up).
- The visual collection room renders albums as records on shelves and reflows from a wall of
  shelves to a horizontal scroll on narrow screens.
- All motion respects `prefers-reduced-motion`.

---

## 6. Testing

`npm test` runs Vitest across both workspaces.

| Suite | Location | Covers |
|---|---|---|
| Server auth | `server/tests/auth.test.js` | Register, login, logout, session behaviour |
| Server albums / collections | `server/tests/albums.test.js`, `collections.test.js` | CRUD, ownership, validation |
| Server features | `server/tests/personalFeatures.test.js`, `features2.test.js` | Wantlist, history, wrapped, social |
| Server security | `server/tests/security.test.js` | Authz, XSS/CSP, injection attempts |
| Database | `server/tests/database.test.js` | Migrations apply, constraints hold |
| Client | `client/src/tests/*.test.jsx` | Login/Register, Browse, page flows, 2.0 features |

Tests run against a **separate Postgres database** (`trackstack_test`) created by
`npm run db:test:setup`, so a test run can never wipe development data.

---

## 7. Hosting plan

Full step-by-step runbook: **[docs/hosting.md](./hosting.md)**.

**Recommended: one Docker service on Render, with Render-managed Postgres.**

```
                    ┌──────────────── Render ────────────────┐
  Browser ──HTTPS──▶ trackstack (Docker)  ──▶  Postgres 16
                      ├── /api/v1/*        Express + sessions
                      └── /*               client/dist (static)
```

Why one service:

1. **The client and API share an origin**, so the session cookie can be `SameSite=Lax` and there
   is no CORS preflight on every request. Simpler and safer.
2. The Express app already serves `client/dist` in production (`server/src/app.js`), so one
   container covers both halves of the app.
3. One URL for the demo: `https://trackstack-zin9.onrender.com` serves the whole app, and
   `/api/v1/health` is the health check.
4. A split deployment (Netlify + Railway) is still supported and is written up as **Option B** in
   the hosting doc — it needs `VITE_API_URL`, a `CLIENT_ORIGIN` allow-list and
   `COOKIE_SAMESITE=none`.

Deployment artefacts that live in the repo:

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage build: Vite client build → slim Node server image |
| `render.yaml` | Render Blueprint: web service + Postgres, with env vars |
| `netlify.toml` | SPA rewrites + build settings for the split Option B |
| `docker-compose.yml` | Local Postgres 16 for development |
| `server/src/db/migrate.js` | Migrations run automatically at container start |

**If public hosting is not available** (examiner's machine / offline), the app runs entirely
locally with `docker compose up -d db && npm install && npm run db:migrate && npm run dev`, and
the same Dockerfile builds a portable image: `docker build -t trackstack . && docker run -p 4000:4000
--env-file .env trackstack`. That image runs on any container host (Render, Railway, Fly.io, a
university VM) with no code changes.

---

## 8. Risks and how we would handle them

| # | Risk | Impact | Mitigation / plan |
|---|---|---|---|
| 1 | **Free-tier hosting sleeps or expires.** Render's free Postgres expires after ~30 days; free web services idle out. | Demo fails on the day. | Keep the Docker image as the fallback: it is portable to any host in minutes. Before the demo, wake the service and run the smoke-test script in `docs/hosting.md`. |
| 2 | **iTunes Search API rate limits or outage.** No SLA, no key, no support. | Browse / Discover degrade. | Server-side 5-minute TTL cache + in-flight request de-duplication; the album pages already degrade gracefully when related-album lookups fail. Fallback: seed the `albums` table from a local JSON dump so the app works offline. |
| 3 | **Single-region Postgres on a free tier.** No backups, no replicas. | Data loss on a bad deploy. | Migrations are additive and forward-only, so a rollback is "redeploy the previous image". For a real launch: managed Postgres with automated backups and a read replica. |
| 4 | **Two-origin deployment weakens CSRF defences.** `SameSite=None` cookies travel on cross-site requests. | Forged writes if the origin allow-list leaks. | Strict `CLIENT_ORIGIN` allow-list, CSP, `SameSite=None` only where required. Fix: serve client and API from one origin (Option A) and restore `SameSite=Lax`. |
| 5 | **Shared `albums` table means one user's edit could affect another's copy.** | Data inconsistency. | Album metadata rows are effectively immutable catalogue records; all personal data lives on `collection_albums`, `wantlist_items`, `listening_history` and `album_stories`, which are strictly user-scoped. |
| 6 | **Polymorphic `likes` / `comments` have no FK enforcement.** | Orphaned rows. | Every write validates the target exists first; a cleanup job would delete orphans. |
| 7 | **No refresh-token flow.** Sessions last 14 days. | Long-lived sessions on shared devices. | `httpOnly` + `Secure` + `SameSite` cookies, "log out everywhere" would clear the `sessions` table for a user. |
| 8 | **Rate limiting is in-process.** | Per-instance limits on a multi-instance deploy. | Would move to a shared store (Redis) before scaling out. |
| 9 | **The iTunes preview clips are Apple's property.** | Licensing issue if commercialised. | Previews are streamed directly from Apple and never stored or re-hosted. |
| 10 | **Vibe-coded code needs review.** | Hidden bugs in generated code. | Layered architecture (routes → controllers → services → SQL), zod validation on every boundary, and a test suite that exercises the real database. |

---

## 9. Trade-offs we accepted

- **No ORM.** More SQL to write, but total control over queries and a data model we can explain.
- **Server-side sessions instead of JWT.** Extra database read per request, but revocable sessions
  and no token in `localStorage`.
- **Shared `albums` table with a per-user join table.** Slightly more complex than a naive
  "albums belong to users" model, but it removes duplicate catalogue rows and makes the
  many-to-many requirement of the brief explicit.
- **One deployed service instead of a CDN + API split.** Simpler, safer cookies, one URL. The
  split option remains documented for when a CDN is genuinely needed.
- **`/api/v1/2/*` for the 2.0 features.** Slightly unusual versioning, but it means the original
  published endpoints never changed shape.
