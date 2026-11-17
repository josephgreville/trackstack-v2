# TrackStack: Project Brief

| | |
|---|---|
| **Project** | TrackStack, a web app for people who collect records |
| **Course** | Final Project, Vibe Coding Web App |
| **Route chosen** | **Route B: records** |
| **Author** | Joseph Greville |
| **Repo** | <https://github.com/josephgreville/trackstack-v2> |
| **Live app** | <https://trackstack-zin9.onrender.com> |
| **Demo login** | `joey@example.com` / `Password123!` |

> **Route.** The brief lets you choose **Route A or Route B**. This project chose **Route B:
> records**. Users own collections, and collections hold records. The "Brief (Route A)" label in
> the deliverables list refers to the brief document; no separate Route A app is required.

---

## 1. The assignment

Build and present a full-stack web application for people who share an interest to share
information about their things. The app must:

- be built on an **API you wrote**, backed by a real database;
- model a **many-to-many** relationship (users → collections → things);
- ship a **responsive** desktop and mobile interface;
- keep **no private keys** in the frontend or in GitHub;
- live in a **public GitHub repository** with a **public URL** (or a documented hosting plan);
- be presented in **10 minutes**: 6 minutes presenting, 4 minutes of questions.

Deliverables: brief, architecture document, page designs, GitHub repo, live URL or hosting plan,
and the presentation.

## 2. Route and domain

**Route B: records.** TrackStack is a home for physical music collections. A collector browses a
real album catalogue, builds one or more collections, and records the details of their own copy:
format, condition, purchase date, price and edition notes.

**Why records:** the data is genuinely relational. One album can sit in many collections, while
each physical *copy* is personal to its owner. That makes the join table, not the album table,
the interesting part of the model, which is exactly what the brief is asking students to
demonstrate.

## 3. Users, collections and records

```
users ──┬──< collections ──< collection_albums >── albums
        │                         (many-to-many)      │
        │                         copy details        │
        ├──< wantlist_items >─────────────────────────┤
        ├──< listening_history >──────────────────────┘
        ├──< listening_sessions >── albums
        └──< sessions  (server-side auth)
```

| Entity | Relationship | What it holds |
|---|---|---|
| **User** | has many collections | account, profile, XP and level |
| **Collection** | belongs to one user, has many albums | name, description, visibility, share token |
| **Album** | shared catalogue record | artist, title, year, genre, artwork, iTunes id |
| **Collection album** | join of collection and album | format, condition, price, purchase date, notes |

A shared `albums` row is never duplicated per user. Everything personal lives on the join table or
on user-scoped tables, so two collectors owning the same pressing still share one catalogue row.
The full 16-table schema is in [`architecture.md`](architecture.md#2-data-model).

## 4. Required pages

| Brief page | Shipped route | Status |
|---|---|---|
| Home | `/` | ✅ |
| Browse all [things] | `/browse` | ✅ |
| [Thing] detail | `/album/:albumId`, `/album/catalog/:externalId` | ✅ |
| Collection page | `/collections/:collectionId` | ✅ |
| My collections (logged in) | `/collections` | ✅ |
| Add / edit [thing] form | `/collections/:collectionId/add` | ✅ |
| Log in / Register | `/login`, `/register` | ✅ |

Extra pages built on the same model: Community (`/social`), Notifications (`/notifications`),
Discover Weekly (`/discover`), Achievements (`/achievements`), Wrapped (`/wrapped`), Collection
Room (`/collection-room`), Wantlist (`/wantlist`), Listening History (`/listening-history`),
Story timeline (`/stories`), public profile (`/users/:username`) and shared collection
(`/share/:token`). Wireframes for every page: [`page-designs.md`](page-designs.md).

## 5. Scope

**In scope and delivered**

- Account registration, login, logout and server-side sessions.
- iTunes catalogue search, album detail, previews and related albums.
- Multiple collections per user, with copy-level details and CSV import/export.
- Wantlist, listening history, album stories and a visual collection room.
- Social layer: follows, activity feed, likes, comments and notifications.
- Gamification: XP, levels, badges and TrackStack Wrapped.
- Responsive desktop rail / mobile bottom dock, keyboard and reduced-motion support.
- Android build of the same client, pointed at the deployed HTTPS app.
- Docker image, Render Blueprint, migrations that run at container start, and a live deployment.

**Deliberately out of scope**

- Tags (designed but deferred; the schema pattern is documented in the Q&A prep).
- Offline writes and background sync in the Android app.
- Email verification, password reset and third-party sign-in.
- Payments, recommendations learned from a model, and multi-region hosting.

## 6. Acceptance criteria and evidence

| Criterion | How it is met | Evidence |
|---|---|---|
| Users have many collections, collections many records | `collections`, `collection_albums`, `albums` with foreign keys and a unique `(collection_id, album_id)` pair | [`architecture.md`](architecture.md#2-data-model) · migrations in `server/migrations/` |
| Own API, not a third-party backend | Express 5 API is the source of truth; iTunes only supplies catalogue metadata | `/api/v1` and `/api/v1/2` endpoint tables in [`architecture.md`](architecture.md#3-api) |
| No private keys in frontend or GitHub | iTunes needs no key and is called server-side only; `DATABASE_URL` and `SESSION_SECRET` come from the environment; `.env` is git-ignored | `.env.example`, `server/src/config/env.js`, [`architecture.md`](architecture.md#4-security) |
| Responsive desktop and mobile | Left rail ≥1024px, bottom dock <768px, mobile type ramp | [`page-designs.md`](page-designs.md) |
| Public repo and live URL | Public GitHub repo, Render deployment with managed Postgres | <https://github.com/josephgreville/trackstack-v2> · <https://trackstack-zin9.onrender.com> |
| Access control | Every personal query is scoped by `user_id`; another user's collection returns 404 | `server/src/services/`, `collections.test.js` |
| It actually works | 128 tests across 13 files against a real Postgres database; production image smoke-tested | [`testing.md`](testing.md) · `npm test` |
| 10-minute presentation | 11-slide deck with speaker notes, a timed demo journey and Q&A prep | [`presentation.md`](presentation.md) · [`presentation/index.html`](presentation/index.html) · [`TrackStack-Presentation.pptx`](presentation/TrackStack-Presentation.pptx) |

## 7. Constraints and risks

- **Free hosting sleeps.** The Render web service spins down after 15 minutes idle; the first
  request can take ~30 seconds. Open the app before presenting.
- **Free database expires.** The Render Postgres instance expires on **2026-12-17**. Before then,
  move to a paid instance or re-seed a new database.
- **Single region, no backups.** Adequate for coursework, not for production use.
- **External catalogue.** If iTunes is unavailable, search and artwork degrade; collections and
  all personal data still work.
- **Scope is large.** The 2.0 feature set is intentionally broad; the core CRUD path is what the
  demo and the marking criteria depend on.
