# TrackStack: Presentation Script

**The deck itself is [`presentation/index.html`](presentation/index.html).** Open it in a browser
and present from it; this document is the script and the Q&A prep behind it.

> **Read [`plain-english.md`](plain-english.md) first** if you want the short version of what the
> app is. This page is the talk itself.

| | |
|---|---|
| **Deck** | `docs/presentation/index.html`: open in Chrome or Edge, no install, works offline |
| **PowerPoint** | `docs/presentation/TrackStack-Presentation.pptx`: 14 slides with all speaker notes, 16:9. Regenerate with `npm run deck:pptx` |
| **PDF** | `submission/TrackStack-Presentation.pdf`: 14 slides, one per page, 16:9 |
| **Advert** | `submission/TrackStack-Ad.mp4`: 30-second STAR advert, played at 3:30 |
| **Navigate** | `→` / `Space` next · `←` previous · `Home` / `End` jump · `F` fullscreen |
| **Speaker notes** | press `N`: each slide's script and timing are built in |
| **Timer** | press `T` to start/pause, `R` to reset |
| **Deep link** | `…/index.html#slide-7` opens straight to a slide |

**Live URL:** `https://trackstack-zin9.onrender.com` is already set on the closing slide and in the
PowerPoint. If I redeploy under a different URL, I update `docs/presentation/index.html` and the
`LIVE_URL` default in `scripts/build-pptx.cjs`, then run `npm run deck:pptx`.

**Format:** 4 minutes total, including the 30-second advert. Then 1 minute of questions. I stop at
5 minutes even if a question is still open. The slides carry very few words on purpose. They are
prompts, not a document.

The talk is six short sections: **Idea → Demo → How it works → Design → Proof → Reflection**. The
deck has **14 slides**, and several slides sit inside one section. I say one clear thing per slide,
then move on.

---

## Timing plan (4:00 + 1:00 questions)

| Slide | Section | Time | Running |
|---|---|---|---|
| **1 · Title** | None | 0:00-0:10 | 0:10 |
| **2 · What TrackStack actually is** | Idea | 0:10-0:25 | 0:25 |
| **3 · The album is shared. Your copy is personal.** | Idea | 0:25-0:40 | 0:40 |
| **4 · Six things you can do** | Idea | 0:40-0:52 | 0:52 |
| **5 · The demo: one record's journey** (*switch to the app*) | Demo | 0:52-1:37 | 1:37 |
| **6 · Browser → the API I built → database** | How it works | 1:37-1:52 | 1:52 |
| **7 · One app, four layers** | How it works | 1:52-2:10 | 2:10 |
| **8 · Why these tools?** | How it works | 2:10-2:22 | 2:22 |
| **9 · Shared album. Personal copy.** | How it works | 2:22-2:37 | 2:37 |
| **10 · Same app, two shapes** | Design | 2:37-2:49 | 2:49 |
| **11 · Where the app actually runs** | Proof | 2:49-2:59 | 2:59 |
| **12 · Proof: it works** | Proof | 2:59-3:11 | 3:11 |
| **13 · What worked, what didn't** | Reflection | 3:11-3:30 | 3:30 |
| **Video · STAR advert** | Proof | 3:30-4:00 | 4:00 |
| **14 · Questions** | Close | 4:00 onward | 5:00 hard stop |

There is still no slack in the plan. The times assume a clear pace. If I am running late, I cut the
final line of slide 8 and skip the Android hold-up on slide 12. I never skip the advert.

Run order: **open the live app before I start**, present slides 1 to 4, switch to the app for the
demo, switch back for slides 6 to 13, play the advert, then open slide 14 for questions. I keep the
app in a second window so the first click is instant.

---

## Slide 1 · Title (0:00)

```
TrackStack
A home for your record collection.
Find a record, add your copy, organise a shelf, share it.

Idea → Demo → How it works → Design → Proof → Reflection
```

**Say:** "TrackStack is a web app for people who collect records. In the next four minutes I'll show
you what it does, how it works, and the result."

---

## Slides 2–4 · The idea (0:10–0:52)

### Slide 2 · What TrackStack actually is (0:10–0:25)

```
Find          Save my copy          Build a stack          Share
Shared        Format, condition,    A named shelf;         A read-only link
catalogue     price, notes          one album on many
```

**Say:** "This is a record collection app. I search the shared catalogue, save my own copy with its
condition and price, organise copies into stacks, and share a shelf with a link. A stack is just a
collection. The extras sit around that core."

**If asked what a stack is:** "Stack is the name in the interface. The code and API call it a
collection. It is one shelf of records."

### Slide 3 · The album is shared. Your copy is personal. (0:25–0:40)

```
Album: artist, title and year from the shared catalogue
Copy: my format, condition, price and notes
Collection: a named shelf that can hold many albums
Route B: the brief offered records, and I chose records
```

**Say:** "Album means the shared details from iTunes. Copy means my own format, condition, price
and notes. Collection means a shelf I can share. Rumours can sit on many shelves, but my copy stays
mine. I chose Route B, records."

**The one sentence to land:** "The album is shared. My copy is personal."

### Slide 4 · Six things you can do (0:40–0:52)

```
Find a record · Add your copy · Build shelves
Keep a wantlist · Share a shelf · Follow collectors
```

**Say:** "Six actions: find a record, add my copy, build shelves, keep a wantlist, share a shelf, and
follow other collectors. There is also a journal, album stories, badges and a yearly recap. Those are
extras."

**If asked why not books or board games:** "The schema would be nearly identical. I would swap
`album` for `book` and add ISBN and author instead of iTunes ids. The architecture was built to
survive that swap."

---

## Slide 5 · The demo: one record's journey (0:52–1:37) (*switch to the app*)

The slide is a **four-step roadmap**. Leave it up for a second, then switch to the app.

```
1  START             2  FIND              3  ADD & ORGANISE        4  SHARE
Register             Browse and search    Add the copy            Open the read-only link
Home dashboard       Album detail         Shelf, stats, wantlist  Community and Wrapped
                                                                     Resize to phone width
```

### Inside those four steps (45 seconds)

| Step | Screen | What I say | Time |
|---|---|---|---|
| 1 | **Home** | "Register, then land on the dashboard." | 0:06 |
| 2 | **Discover → search "Rumours"** | "Discover searches the iTunes catalogue through the API I built." | 0:10 |
| 3 | **Album detail** | "The album page has the tracks and preview clips." | 0:06 |
| 4 | **Add to a shelf** | "I add my copy: vinyl, near mint, £28." | 0:09 |
| 5 | **Shelf detail → stats** | "My shelf, broken down by format, genre and decade." | 0:08 |
| 6 | **Resize to phone** | "Same app, five tabs, now a floating bottom dock." | 0:06 |

**Say while switching back:** "Every screen is one React route talking to one Express endpoint. No
hard-coded data. The demo account was created minutes before this talk."

**Pre-flight checklist:**

- [ ] App tab open at `https://trackstack-zin9.onrender.com` (or `http://localhost:4001`)
- [ ] Logged in as `joey@example.com` / `Password123!` (seeded with 3 shelves, a wantlist, a journal, a story and a follower)
- [ ] The public "Vinyl Shelf" collection is shared, so the share link works signed out
- [ ] Discover search tested with "Rumours" before I start
- [ ] Browser at ~1100 px for desktop, then dragged to 390 px for mobile
- [ ] Android APK installed on a phone or emulator if I want the native follow-up during slide 11
- [ ] Audio muted, because iTunes previews play 30-second clips

---

## Slides 6–9 · How it works (1:37–2:37)

### Slide 6 · Browser → API → database (1:37–1:52)

```
Browser   React pages, showing the pages
   ↓
API       Express, checks input and applies the rules
   ↓
Database  PostgreSQL, stores users, shelves, copies

Side note: iTunes supplies album metadata. The API calls it first.
```

**Say:** "The browser talks to the API I built; the API talks to Postgres. iTunes supplies catalogue
data, and the API calls it first. There is a read-only browser fallback if a host blocks the server
request. The browser never talks to the database directly. Each piece has one job, and the client and
API ship together."

**Detail if needed:** "routes → controllers → services → SQL. Controllers never write SQL, and
services never touch the request. That is what makes it testable."

### Slide 7 · One app, four layers (1:52–2:10)

```
Pages     React 19        Seven routes, shared components
Rules     Express 5       Routes → controllers → services → SQL
Data      Postgres 16     Migrations, constraints, 16 tables
Delivery  Docker + Render One container, one URL
```

**Say:** "Four layers, each with one job. React renders the routes from shared components. Express
handles rules through routes, controllers and services, then SQL. Postgres holds the data with
migrations and constraints. Docker and Render deliver one container and one URL."

### Slide 8 · Why these tools? (2:10–2:22)

```
JavaScript + Node   One language across the app
React + Vite        One component per page, fast static builds
Express 5           Small rules layer, good async errors
Postgres + SQL      Foreign keys, constraints, reviewable queries
iTunes API          No key, structured JSON, server-side first
Render + Capacitor  One URL, then the same build on Android
```

**Say:** "The AI used familiar, well-documented tools because each one reduced risk. JavaScript kept
one language across the app. React maps pages to components, Express is a small rules layer, and
Postgres enforces the data rules with foreign keys and constraints. iTunes needs no key, Render gives
one URL, and Capacitor reuses the same build on Android."

**If pushed on AI:** "I set the architecture, data model and acceptance checks first. AI wrote inside
that contract, and the tests decided whether the code was allowed in."

### Slide 9 · Shared album. Personal copy. (2:22–2:37)

```
THE ALBUM (shared)                  YOUR COPY (personal)
title · artist · year               format · condition · price · notes
one row per record                  one row per shelf
               ↕ linked by collection_albums
```

**Say:** "This is the one idea worth remembering. The album row is shared, one row per record. My copy
is a separate row that links my shelf to that album and holds the condition, price and notes. Editing
my copy never changes anyone else's record, and the database enforces the links."

**Why it matters, in one sentence:** "A collection is a join table, not a list of album ids."

---

## Slide 10 · Design (2:37–2:49)

```
Desktop:  left rail with five tabs, multi-column grids
Mobile:   same five tabs as a floating bottom dock
Look:     near-black surfaces, soft elevation, coral accent
```

**Say:** "It is the same app in two shapes. On desktop the five tabs are a left rail. Under 768 pixels
the same tabs become a floating bottom dock, because a thumb reaches the bottom of a phone but not
the top. The look is deliberate: near-black surfaces, soft elevation, Manrope type and an orange
accent. Every animation respects reduced motion."

**If asked about the design process:** "The first pass was generic AI output. I rebuilt it with a
deliberate voice. Palette, type pairing and border weights are all choices, not defaults."

---

## Slides 11–12 · Proof (2:49–3:11)

### Slide 11 · Where the app actually runs (2:49–2:59)

```
Browser   opens one URL
   ↓
Render    runs one HTTPS service
   ↓
Docker    built React site + Express API in one container
   ↓
Postgres  records, users and sessions
```

**Say:** "The browser opens one address. Render runs one Docker image at that address. The image
contains the built React site and the Express API. Data and sessions live in managed Postgres. Because
the site and API share one origin, the login cookie works automatically. Migrations run at container
start, so redeploys are repeatable."

### Slide 12 · Proof: it works (2:59–3:11)

```
131  automated tests against a real Postgres database
   1  live URL: the container builds, migrates, serves and logs in
   3  seeded shelves, so the demo is never empty
```

**Say:** "131 automated tests run the real API against a real Postgres database: ownership,
constraints and permissions. The live container builds, migrates, serves the app, handles deep links
and logs in. The demo data means the app is never empty. The same client also runs as an Android app."

---

## Slide 13 · Reflection (3:11–3:30)

| Worked | Didn't | Learned |
|---|---|---|
| Schema first, so every feature followed | Scope was too big | A collection is a join table, not a list |
| One feature per commit | The first UI looked generic | Real-database tests catch more |
| AI wrote code inside boundaries I set | Free hosting sleeps on demo day | Saying no is part of design |

**Say:** "What worked: schema first, small commits, and AI writing inside boundaries I set. What didn't:
the scope was too big, the first UI looked generic, and free hosting sleeps. What I learned: a
collection is a join table, not a list; real-database tests catch more; and saying no is part of
design."

**Showing the Android version (5 seconds, optional):** Hold the phone up during this slide. Show one
shelf and the bottom dock, then put the phone down. The APK is
`android/app/build/outputs/apk/debug/app-debug.apk`; build instructions are in [`android.md`](android.md).
If the device is not ready, I say the line and move on. I do not spend demo time installing it.

Then say: "Here is the 30-second advert." and play `submission/TrackStack-Ad.mp4`.

---

## Video advert · STAR story (3:30–4:00)

| Beat | Time | On screen |
|---|---|---|
| **Situation** | 0:00-0:07 | Records everywhere, details nowhere, the collection in my head |
| **Target** | 0:07-0:14 | One home for every record, with search and preview |
| **Action** | 0:14-0:23 | Save my copy, build a shelf, share a link, browse without an account |
| **Result** | 0:23-0:30 | An organised, searchable collection and one live URL |

The advert uses screenshots from the live app. I do not narrate over it; the captions carry the
story, so it works with the sound off.

---

## Slide 14 · Questions (4:00–5:00)

**Say:** "Happy to go deeper on the data model, the API, security or hosting." Then stop talking and
take questions for one minute. At 5:00 I stop, even if a question is still open.

---

## Questions I should expect (1 minute)

Have answers to these. Say the short version, then stop.

**Q: Why not just use MongoDB?**

"Everything here is relational. A shelf belongs to one user, a join table carries the copy details,
and I wanted the database to enforce unique emails and valid formats. Postgres gives me that for free,
plus JSONB where I needed flexibility, like achievement criteria."

**Q: Where are your API keys?**

"There aren't any. The iTunes Search API needs no key. The API calls it first, and if a host blocks
that request the browser uses a read-only fallback to the same public endpoint. The collection IDs are
identical, so album pages and previews keep working. The only secrets are `DATABASE_URL` and
`SESSION_SECRET`, supplied as environment variables, with `.env` git-ignored."

**Q: How do you prevent one user seeing another's data?**

"Every personal query is scoped by `user_id` from the session inside the service layer, not in the
route. A collection lookup for someone else's collection returns 404, not 403, so it does not even
confirm it exists. There are tests that assert exactly this."

**Q: Why server-side sessions instead of JWT?**

"Revocable. If a user reports a compromised account I can delete their session rows and they are
logged out everywhere. With a JWT the token stays valid until it expires. The cookie is httpOnly, so
an XSS bug cannot read it."

**Q: What's your biggest weakness?**

"Single-region Postgres on a free tier with no backups, and in-process rate limiting that would not
work across multiple instances. For a real launch I would move to managed Postgres with automated
backups and put the rate limiter in Redis."

**Q: How did you use AI without losing control?**

"I wrote the architecture and the schema first, then had AI write one module at a time against that
contract. The layering (routes, controllers, services, SQL) kept it coherent. Every boundary is
validated, so a generated handler that forgets a WHERE clause fails the tests rather than shipping."

**Q: Why did the AI use these tools?**

"Because each one was well documented and easy to check. JavaScript kept one language across the app.
React maps pages to components, Express is a small rules layer, and Postgres enforces the data rules.
iTunes needs no key, Render gives one URL, and Capacitor reuses the same build on Android."

**Q: How would you add tags?**

"A `tags` table and a `collection_albums_tags` join table, the same many-to-many pattern as shelves
and albums. The brief lists it as an extra, and I spent the budget on stories and the social layer
instead."

**Q: Is it deployed?**

"Yes, at <https://trackstack-zin9.onrender.com>. One Docker service on Render with managed Postgres,
migrations running at container start. The free tier sleeps after 15 minutes idle, so the first
request can take about 30 seconds."

**Q: Why did you add gamification, Wrapped and social at all?**

"The brief says scope is flexible. Those features are what make the data model interesting:
activity feeds, notifications and polymorphic likes are where a naive design falls apart. Building
them proved the schema was right."

**Q: What's on your roadmap?**

"Tags, full-text search on the catalogue, offline support in the Android app, and replacing the
rule-based recommendation with something learned from listening history."

---

## Handy facts to remember

| Fact | Value |
|---|---|
| Tables | 16 (+ `sessions`, + `schema_migrations`) |
| Migrations | 8 numbered SQL files, idempotent |
| API version | `/api/v1` and `/api/v1/2` |
| Tests | 131 tests, 13 files, all passing |
| Stack | React 19 · Express 5 · PostgreSQL 16 · Node 20 · Vite 6 · Tailwind |
| Third party | iTunes Search API, server call first with a browser fallback |
| Deploy | 1 Docker service on Render + managed Postgres |
| Live URL | `https://trackstack-zin9.onrender.com` |
| Commits | Small and frequent, one feature per commit |
| Auth | bcryptjs + server-side sessions in Postgres |

---

## Delivery tips

1. Rehearse with a timer at least three times. The target is 3:30 of speaking, 0:30 of advert and
   1:00 of questions.
2. Open the app in a second window *before* I start so the first click is instant.
3. Test Discover with "Rumours" before I start. The first result should be Fleetwood Mac.
4. Do not narrate the UI element by element. Narrate the journey.
5. If a catalogue call is slow, talk over it: "this is the live catalogue, and it caches".
6. Face the audience. Read the slide, not my notes.
7. Have `docs/architecture.md` open in a tab. I can point at it if a question goes deep.
8. **Say one thing per slide.** If I remember only three sentences: *album shared, copy personal;
   browser → API → database; one container, one URL, 131 tests.*
