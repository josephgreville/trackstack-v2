# TrackStack — Presentation

**The deck itself is [`presentation/index.html`](presentation/index.html)** — a self-contained slide
deck. Open it in a browser and present it; this document is the script and the Q&A prep behind it.

| | |
|---|---|
| **Deck** | `docs/presentation/index.html` — open in Chrome or Edge, no install, works offline |
| **PowerPoint** | `docs/presentation/TrackStack-Presentation.pptx` — 14 slides with all speaker notes, 16:9. Regenerate with `npm run deck:pptx` |
| **Navigate** | `→` / `Space` next · `←` previous · `Home` / `End` jump · `F` fullscreen |
| **Speaker notes** | press `N` — each slide's script and timing are built in |
| **Timer** | press `T` to start/pause, `R` to reset — the six-minute budget is in the notes |
| **PDF** | `Ctrl` + `P` prints one slide per page at 16:9 |
| **Deep link** | `…/index.html#slide-7` opens straight to a slide |

**Live URL:** `https://trackstack-zin9.onrender.com` is already set on the closing slide and in the
PowerPoint. If you redeploy under a different URL, update `docs/presentation/index.html` and the
`LIVE_URL` default in `scripts/build-pptx.cjs`, then run `npm run deck:pptx`.

**Format:** 10 minutes total — 6 minutes presenting, 4 minutes questions.
**Slides:** keep to the words shown. The script notes are what you *say*, not what you read.

The script is organised as **seven beats** because that is how the talk is assessed: demo,
architecture, design, reflection. The deck has **fourteen slides**; several slides sit inside one
beat. The timing table below is the single source of truth and is copied into the deck's speaker
notes.

---

## Timing plan (6:00)

| Beat | Deck slides | Time | Running |
|---|---|---|---|
| **1 · Title** | 1 | 0:00–0:15 | 0:15 |
| **2 · Brief, model, screens** | 2–4 | 0:15–1:25 | 1:25 |
| **3 · Live demo** — *switch to the app* | 5 | 1:25–2:45 | 2:45 |
| **4 · Architecture** — shape, why, API, security | 6–9 | 2:45–4:35 | 4:35 |
| **5 · Design** | 10 | 4:35–5:05 | 5:05 |
| **6 · Hosting and verification** | 11–12 | 5:05–5:30 | 5:30 |
| **7 · Reflection and close** | 13–14 | 5:30–6:00 | 6:00 |

Leave no slack in the plan — the times already assume you speak at a normal pace. If you are
running late, cut the second half of the **Why** slide and the **Verification** slide; both are
written up in [`architecture.md`](architecture.md) and [`testing.md`](testing.md).

Run order: **open the live app before you start**, present the slides from beat 1, switch to the
app for beat 3, then switch back to the slides for beat 4 onwards. Keep the app in a second window
so the first click is instant and never talk over a slow page load.

---

## Beat 1 · Title — deck slide 1 (0:00)

```
TrackStack
A home for your record collection

Final Project — Vibe Coding Web App
Joseph Greville · [Date]
github.com/josephgreville/trackstack-v2
```

**Say:** "This is TrackStack — a web app for people who collect records. You browse a catalogue,
build multiple collections, track the condition and price of each copy, keep a wantlist, and share
your shelves."

---

## Beat 2 · Brief, model and screens — deck slides 2–4 (0:15)

### Slide 2 · The brief (0:15–0:50)

```
Route B: records

Every user      → many collections
Every collection → many records

+ wantlist, listening journal, stories
+ follows, likes, comments, badges, Wrapped
```

**Say:** "The brief asked for people who share an interest to share information about their things
or collections of things. I chose records, because the data is genuinely relational — one record can
sit in many collections, and each *copy* has its own format, condition and price. That's the
interesting modelling problem in it. I added a wantlist, a listening journal, album stories and a
social layer around it."

**If asked why not books or board games:** "The schema would be nearly identical — I'd swap `album`
for `book` and add ISBN/author instead of iTunes ids. The architecture was built to survive that
swap."

### Slide 3 · Data model (0:50–1:15)

```
users ──< collections ──< collection_albums >── albums
          (one user's   (many-to-many +     (shared
           stacks)       copy details)       catalogue)
```

**Say:** "Album *metadata* is global — one row per record, shared. But my *copy* of it is personal:
format, condition, price, purchase date live on the join table. So if two people own the same
pressing we don't duplicate the row. Sixteen tables in total, including wants, history, follows,
likes, comments, stories and badges."

**One extra sentence if there is time:** "Likes and comments use a polymorphic `target_type` +
`target_id` instead of two nullable foreign keys — one index serves both, and the trade-off is that
the database can't check the reference, so the service looks the target up before every write."

### Slide 4 · Screens (1:15–1:25)

```
Home · Browse · Album · Collection · Add / edit · Login / register
+ Community · Wantlist · Journal · Stories · Wrapped · Collection room
```

**Say:** "Seven screens from the brief, plus the extras — wantlist, journal, stories, community,
badges and Wrapped."

---

## Beat 3 · The demo — deck slide 5 (1:25) — *switch to the app*

### The journey, in order — 80 seconds

| Step | Screen | What I say (one line each) | Time |
|---|---|---|---|
| 1 | **Register** | "Register — the app is private by default, so everything starts with an account." | 0:08 |
| 2 | **Home** | "Home is the dashboard: featured records, recent adds, quick actions." | 0:07 |
| 3 | **Browse → search "Daft Punk"** | "Browse hits the iTunes catalogue through *our* API — not Apple directly from the browser." | 0:12 |
| 4 | **Album detail** | "Album page: tracks, preview clips, related albums." | 0:05 |
| 5 | **Add to collection** | "Add it, and record the copy: vinyl, near mint, £28." | 0:12 |
| 6 | **Collection detail → Stats** | "My collection, broken down by format, genre and decade." | 0:08 |
| 7 | **Collection room + share link** | "The collection room; one click to share a read-only link that opens signed out." | 0:13 |
| 8 | **Wantlist / Journal** | "Wantlist and listening journal — the two personal lists." | 0:05 |
| 9 | **Community + You** | "Follows and comments, then XP, badges and Wrapped." | 0:05 |
| 10 | **Resize to phone width** | "Same app, five tabs become a floating bottom dock." | 0:05 |

**Say while switching back:** "Every one of those screens is one React route talking to one Express
endpoint. No hard-coded data anywhere — the demo account was registered ten minutes ago."

**Pre-flight checklist:**
- [ ] App tab open at `https://trackstack-zin9.onrender.com` (or `http://localhost:4001`)
- [ ] Logged in as `joey@example.com` / `Password123!` — seeded with 3 collections, a wantlist, a journal, a story and a follower
- [ ] The public "Vinyl Shelf" collection is shared, so the share link works signed out
- [ ] Browser at ~1100 px for desktop shots, then drag to 390 px for mobile
- [ ] Audio muted (iTunes previews play 30-second clips)

---

## Beat 4 · Architecture — deck slides 6–9 (2:45)

### Slide 6 · The shape (2:45–3:15)

```
Client   React 19 · React Router 7 · Vite 6 · Tailwind · Framer Motion
API      Node 20 · Express 5 · zod validation · express-session
Data     PostgreSQL 16 (Docker locally, managed in production)
Third    iTunes Search API (no API key) — called from the server only
```

**Say:** "One monorepo: React 19 client, Express 5 API, PostgreSQL 16. iTunes is the third-party
catalogue — but every call goes through our server, never from the browser."

**Point at the layers box:** "routes → controllers → services → SQL. Controllers never write SQL,
services never touch `req`/`res` — that's what makes it testable."

### Slide 7 · Why these choices (3:15–3:50)

| Choice | Reason (say it in one breath) |
|---|---|
| **PostgreSQL** | "The data is relational and I wanted the database to enforce it — foreign keys, CHECK constraints on format and condition, unique indexes on lower(email). A document store would have meant hand-rolling integrity." |
| **No ORM** | "Explicit SQL, so I can explain every query and every index. That's the part I was asked to understand." |
| **Sessions, not JWT** | "The cookie is only a signed id — it can't be stolen by an XSS bug, and I can revoke a session server-side." |
| **Own API as the database** | "The brief says ideally build your own API. So our Express API *is* the source of truth for users, collections, albums, everything. iTunes only supplies catalogue metadata." |
| **Monorepo** | "One repo, one `npm install`, one `npm run dev`, one push ships client and API together." |

**Say:** pick two or three rows, not all five. Postgres is the strongest answer.

### Slide 8 · The API (3:50–4:10)

```
/api/v1          auth · catalogue · collections · albums · me · public
/api/v1/2        gamification · social · stories · recommendations · wrapped
```

**Say:** "Version 1 is the original surface; the 2.0 features live under `/2` so the published
endpoints never changed shape. Every body, param and query is validated with zod before it reaches
SQL, and every response is JSON with a consistent error shape."

### Slide 9 · Security (4:10–4:35)

```
No API keys in the browser. Secrets in environment variables.
Sessions in Postgres — revocable. Every query scoped by user_id.
```

**Say:** "There are no API keys to leak — the iTunes API doesn't need one, and all calls are
server-side. The only secrets are `DATABASE_URL` and `SESSION_SECRET`, in environment variables,
with `.env` git-ignored. Sessions are server-side in Postgres and revocable. Every personal query is
scoped by `user_id` inside the service layer, and another user's collection returns 404 rather than
403, so it doesn't even confirm it exists."

---

## Beat 5 · Design — deck slide 10 (4:40)

```
Desktop:  left rail with 5 tabs      Mobile: floating bottom dock
Sticker-book aesthetic: 2px outlines, solid offset shadows, pill buttons
Fredoka (display) + Nunito (text) · every animation respects prefers-reduced-motion
```

**Say:** "The layout was designed before the code: seven screens, desktop and mobile, each one
built from the same four blocks — a title, a primary action, a card grid, and a detail panel.
On desktop those five tabs are a left rail; under 768px the same tabs become a floating dock at
the bottom, because a thumb reaches the bottom of a phone but not the top.

The visual language is a sticker book: chunky two-pixel outlines, solid offset shadows with no
blur, pill buttons, and spring motion instead of easing. The whole thing is token-driven — the
palette lives in one CSS file — so a colour change is one edit, not a sweep."

**If asked about the design process:** "The first pass was generic. I rebuilt it with a deliberate
voice — the colour palette, the type pairing and the border weights are all deliberate, and the
reduced-motion support was added from the start rather than patched in later."

---

## Beat 6 · Hosting and verification — deck slides 11–12 (5:05)

### Slide 11 · Hosting (5:05–5:20)

```
Live:       1 Docker service on Render + managed Postgres 16
            → one origin → SameSite=Lax cookie → no CORS → one URL
Also:       Netlify + Railway (split), documented in docs/hosting.md
Fallback:   docker compose up -d db && npm run db:migrate && npm run dev
```

**Say:** "One container runs the API *and* serves the built client, so the app is on a single
origin — that keeps the session cookie first-party and removes CORS entirely. Migrations are
numbered SQL files and run automatically at container start, and they're idempotent so every
redeploy is safe. I also wrote the split Netlify-plus-Railway option up, because the Android build
needs an absolute API URL."

### Slide 12 · Verification (5:20–5:30)

```
128 tests · 13 files · real Postgres
Production image smoke-tested before deploy: boot · migrate · SPA · deep links · login
```

**Say:** "128 tests across 13 files, running the real app against a real Postgres test database —
migrations, constraints, ownership, authz. I also built and ran the production container locally
before deploying it: boot, migrate, serve the SPA, handle deep links, log in."

---

## Beat 7 · Reflection and close — deck slides 13–14 (5:30)

### Slide 13 · Reflection (5:30–5:55)

**Say:** "What went well: the schema was decided first, and it made every feature obvious. What
didn't: the 2.0 feature set took twice as long as the original app, and I should have cut it
earlier — and the first version of the UI was generic AI output that I had to push into something
with a voice. What I learnt: the interesting part of this brief isn't the CRUD, it's modelling a
copy versus a catalogue entry."

### Slide 14 · Questions (5:55–6:00)

**Say:** "Happy to go deeper on the schema, the API, the security model or the deployment." Then stop
talking and let the questions come.

---

## Questions I should expect (4 minutes)

Have answers to these. Say the short version, then stop.

**Q: Why not just use MongoDB?**
"Everything here is relational — a collection belongs to exactly one user, a join table carries the
copy details, and I wanted the database to enforce unique emails and valid formats. Postgres gives
me that for free, plus JSONB where I needed flexibility, like achievement criteria."

**Q: Where are your API keys?**
"There aren't any. The iTunes Search API needs no key, and every call to it is made from the
server, so there is no key that *could* end up in the front-end bundle. The only secrets are
`DATABASE_URL` and `SESSION_SECRET`, both read from environment variables, and `.env` is
git-ignored. If I'd added a keyed API it would live in `server/src/services/` and come from the
host's environment — never `import.meta.env`, because that's compiled into the JavaScript."

**Q: How do you prevent one user seeing another's data?**
"Every personal query is scoped by `user_id` from the session inside the service layer, not in the
route. A collection lookup for someone else's collection returns 404, not 403, so it doesn't even
confirm it exists. There are tests that assert exactly this, in `collections.test.js`."

**Q: Why server-side sessions instead of JWT?**
"Revocable. If a user reports a compromised account I can delete their session rows and they're
logged out everywhere. With a JWT the token stays valid until it expires. The cookie is httpOnly,
so an XSS bug can't read it."

**Q: What's your biggest weakness?**
"Single-region Postgres on a free tier with no backups, and in-process rate limiting that wouldn't
work across multiple instances. For a real launch I'd move to a managed Postgres with automated
backups and put the rate limiter in Redis."

**Q: How did you use AI without losing control?**
"I wrote the architecture and the schema first, then had AI write one module at a time against
that contract. The layering — routes, controllers, services, SQL — is what kept it coherent. Every
boundary is validated, so a generated handler that forgets a WHERE clause fails the tests rather
than shipping."

**Q: How would you add tags?**
"A `tags` table and a `collection_albums_tags` join table — same many-to-many pattern as
collections and albums. The brief lists it as an extra; I spent the budget on stories and the
social layer instead, which I'd defend because they use the same relational machinery."

**Q: What about pagination and API docs?**
"The catalogue search and the activity feed are paginated — limit and page, and cursor-style
pagination for the feed. For docs, `docs/architecture.md` is the reference: the full endpoint table,
the data model and the security decisions are all written up there."

**Q: Is it deployed?**
"Yes — <https://trackstack-zin9.onrender.com>. One Docker service on Render with managed Postgres,
migrations running at container start. The fallback if the free tier sleeps is the same image
running locally with one command, and `docs/hosting.md` has the pre-demo checklist I run before I
present."

**Q: Why did you add gamification, wrapped and social at all?**
"The brief says scope is flexible. My reasoning: those features are what make the *data model*
interesting — activity feeds, notifications and polymorphic likes are where a naive design falls
apart, so building them proved the schema was right. If I'd only built CRUD, I wouldn't know
whether the schema held up."

**Q: What's on your roadmap?**
"Tags, a full-text search on the album catalogue, offline support in the Android app, and
replacing the recommendation heuristic with something learned from the listening history instead of
rule-based."

---

## Handy facts to remember

| Fact | Value |
|---|---|
| Tables | 16 (+ `sessions`, + `schema_migrations`) |
| Migrations | 7 numbered SQL files, idempotent |
| API version | `/api/v1` and `/api/v1/2` |
| Tests | 128 tests, 13 files, all passing |
| Stack | React 19 · Express 5 · PostgreSQL 16 · Node 20 · Vite 6 · Tailwind |
| Third party | iTunes Search API (no key, server-side only, 5-minute cache) |
| Deploy | 1 Docker service on Render + managed Postgres |
| Live URL | `https://trackstack-zin9.onrender.com` |
| Commits | Small and frequent, one feature per commit |
| Auth | bcryptjs + server-side sessions in Postgres |

---

## Delivery tips

1. Rehearse with a timer at least three times. If you go past 6:00, cut the **Why** slide's second
   half and the **Verification** slide.
2. Open the app in a second window *before* you start so the first click is instant.
3. Don't narrate the UI element by element — narrate the *journey*.
4. If a call to the iTunes API is slow, talk over it: "this is the live catalogue, it caches for
   five minutes".
5. Face the audience. Read the slide, not your notes.
6. Have `docs/architecture.md` open in a tab — you can point at it if a question goes deep.
