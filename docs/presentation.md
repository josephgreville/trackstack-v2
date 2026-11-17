# TrackStack: Presentation Script

**The deck itself is [`presentation/index.html`](presentation/index.html).** Open it in a browser
and present from it; this document is the script and the Q&A prep behind it.

> **Read [`plain-english.md`](plain-english.md) first** if you want the short version of what the
> app is. This page is the talk itself.

| | |
|---|---|
| **Deck** | `docs/presentation/index.html`: open in Chrome or Edge, no install, works offline |
| **PowerPoint** | `docs/presentation/TrackStack-Presentation.pptx`: 12 slides with all speaker notes, 16:9. Regenerate with `npm run deck:pptx` |
| **Navigate** | `→` / `Space` next · `←` previous · `Home` / `End` jump · `F` fullscreen |
| **Speaker notes** | press `N`: each slide's script and timing are built in |
| **Timer** | press `T` to start/pause, `R` to reset |
| **PDF** | `Ctrl` + `P` prints one slide per page at 16:9 |
| **Deep link** | `…/index.html#slide-7` opens straight to a slide |

**Live URL:** `https://trackstack-zin9.onrender.com` is already set on the closing slide and in the
PowerPoint. If you redeploy under a different URL, update `docs/presentation/index.html` and the
`LIVE_URL` default in `scripts/build-pptx.cjs`, then run `npm run deck:pptx`.

**Format:** 10 minutes total: **6 minutes presenting, 4 minutes questions**.
**Slides:** the slides carry very few words on purpose. They are prompts, not a document.

The talk is six short sections: **Idea → Demo → How it works → Design → Proof → Reflection**. The
deck has **12 slides**, and several slides sit inside one section. Say one clear thing per slide,
then move on.

---

## Timing plan (6:00)

| Slide | Section | Time | Running |
|---|---|---|---|
| **1 · Title** | None | 0:00–0:15 | 0:15 |
| **2 · One album. Many collections. Your copy.** | Idea | 0:15–0:40 | 0:40 |
| **3 · Six things you can do** | Idea | 0:40–0:50 | 0:50 |
| **4 · The demo: one record's journey** (*switch to the app*) | Demo | 0:50–2:20 | 2:20 |
| **5 · Browser → the API I built → database** | How it works | 2:20–2:50 | 2:50 |
| **6 · Four jobs, one path** | How it works | 2:50–3:20 | 3:20 |
| **7 · Shared album. Personal copy.** | How it works | 3:20–3:55 | 3:55 |
| **8 · Same app, two shapes** | Design | 3:55–4:35 | 4:35 |
| **9 · One container, one URL** | Proof | 4:35–5:00 | 5:00 |
| **10 · Proof: it works** | Proof | 5:00–5:25 | 5:25 |
| **11 · What worked, what didn't** | Reflection | 5:25–5:55 | 5:55 |
| **12 · Questions** | Reflection | 5:55–6:00 | 6:00 |

Leave no slack in the plan. The times assume a normal speaking pace. If you are running late, the
two easiest cuts are the last line of slide 7 and the demo-data line on slide 10; both are written up
in [`architecture.md`](architecture.md) and [`testing.md`](testing.md).

Run order: **open the live app before you start**, present slides 1–3, switch to the app for the
demo, then switch back to the slides for slide 5 onwards. Keep the app in a second window so the
first click is instant, and never talk over a slow page load.

---

## Slide 1 · Title (0:00)

```
TrackStack
A home for your record collection.
Find a record, add your copy, organise a shelf, share it.

Idea → Demo → How it works → Design → Proof → Reflection
```

**Say:** "TrackStack is a web app for people who collect records. In the next six minutes I'll show
you what it does, how it works, and what I learned building it."

---

## Slides 2–3 · The idea (0:15–0:50)

### Slide 2 · One album. Many collections. Your copy. (0:15–0:40)

```
A record lives in a shared catalogue
Your copy has its own format, condition and price
A collection is a shelf you can share
The brief offers Route A or B. I chose records
```

**Say:** "There is a shared catalogue of albums. You add your own copy to a shelf. The copy is
yours: its format, condition and price. You can keep several shelves and share one with a link.
The brief offered Route A or B; I chose records, because the same album can be owned by many people
but each copy is different."

**The one sentence to land:** "The album is shared. Your copy is personal."

### Slide 3 · Six things you can do (0:40–0:50)

```
Find a record · Add your copy · Build shelves
Keep a wantlist · Share a shelf · Follow collectors
```

**Say:** "Six actions: find a record, add your copy, build shelves, keep a wantlist, share a shelf,
and follow other collectors. There is also a journal, album stories, badges and a yearly recap.
Those are extras."

**If asked why not books or board games:** "The schema would be nearly identical. I'd swap `album`
for `book` and add ISBN and author instead of iTunes ids. The architecture was built to survive that
swap."

---

## Slide 4 · The demo: one record's journey (0:50–2:20) (*switch to the app*)

The slide is a **four-step roadmap**. Leave it up for a second so the audience knows where the demo
is going, then switch to the app.

```
1  START             2  FIND              3  ADD & ORGANISE        4  SHARE
Register             Browse and search    Add the copy            Open the read-only link
Home dashboard       Album detail         Shelf, stats, wantlist  Community and Wrapped
                                                                    Resize to phone width
```

### Inside those four steps (about 90 seconds)

| Step | Screen | What I say (one line each) | Time |
|---|---|---|---|
| 1 | **Register / home** | "Register, then land on the dashboard." | 0:10 |
| 2 | **Browse → search "Daft Punk"** | "Browse searches the iTunes catalogue through the API I built, not Apple directly." | 0:15 |
| 3 | **Album detail** | "The album page: tracks and preview clips." | 0:08 |
| 4 | **Add to a shelf** | "Add it, and record the copy: vinyl, near mint, £28." | 0:15 |
| 5 | **Shelf detail → stats** | "My shelf, broken down by format, genre and decade." | 0:12 |
| 6 | **Shelf room + share link** | "The shelf room. One click shares a read-only link that opens signed out." | 0:15 |
| 7 | **Wantlist / journal** | "Wantlist and listening journal, the two personal lists." | 0:08 |
| 8 | **Community + Wrapped** | "Follows and comments, then badges and the yearly recap." | 0:07 |
| 9 | **Resize to phone** | "Same app: the five tabs become a floating bottom dock." | 0:05 |

**Say while switching back:** "Every one of those screens is one React route talking to one Express
endpoint. No hard-coded data. The demo account was created minutes before this talk."

**Pre-flight checklist:**
- [ ] App tab open at `https://trackstack-zin9.onrender.com` (or `http://localhost:4001`)
- [ ] Logged in as `joey@example.com` / `Password123!` (seeded with 3 shelves, a wantlist, a journal, a story and a follower)
- [ ] The public "Vinyl Shelf" collection is shared, so the share link works signed out
- [ ] Browser at ~1100 px for desktop, then drag to 390 px for mobile
- [ ] Android APK installed on a phone or emulator if you want the native follow-up during slide 10
- [ ] Audio muted (iTunes previews play 30-second clips)

---

## Slides 5–7 · How it works (2:20–3:55)

### Slide 5 · Browser → API → database (2:20–2:50)

```
Browser   React pages, showing the pages
   ↓
API       Express, checks input and applies the rules
   ↓
Database  PostgreSQL, stores users, shelves, copies

Side note: iTunes supplies album metadata only. Only the API calls it.
```

**Say:** "The browser talks to the API I built; the API talks to Postgres. iTunes only supplies catalogue
data, and only the API calls it. The browser never talks to the database directly. Each piece has
one job, and the client and API ship together. One install, one deploy."

**Point at the layers if you want the detail:** "routes → controllers → services → SQL. Controllers
never write SQL, and services never touch the request. That is what makes it testable."

### Slide 6 · Four jobs, one path (2:50–3:20)

```
Find a record        React → API → iTunes
Save your copy       React → API → Postgres
Build and share      React → API → Postgres
Follow collectors    React → API → Postgres
```

**Say:** "Every core function follows the same shape. React shows the screen. The API I built checks
the request. Postgres keeps the result, except search, where the API fetches catalogue data from
iTunes. Saving a copy writes to the join table. Sharing checks ownership. Follows and likes are
stored as relationships."

**If pushed for the stack:** "React 19 for pages, Express 5 for rules, PostgreSQL 16 for data,
iTunes for catalogue metadata, and Render for hosting."

### Slide 7 · Shared album. Personal copy. (3:20–3:55)

```
THE ALBUM (shared)                  YOUR COPY (personal)
title · artist · year               format · condition · price · notes
one row per record                  one row per shelf
              ↕ linked by collection_albums
```

**Say:** "This is the one idea worth remembering. The album row is shared: one row per record, so
two people owning the same pressing do not duplicate it. Your copy is a separate row that links
your shelf to that album and holds the condition, price and notes. So editing your copy never
changes anyone else's record, and the database enforces the links."

**Why it matters, in one sentence:** "A collection is a join table, not a list of album ids."

**One extra sentence if there is time:** "Sixteen tables in total. The rest are wants, history,
follows, likes, comments, stories and badges."

---

## Slide 8 · Design (3:55–4:35)

```
Desktop:  left rail with five tabs, multi-column grids
Mobile:   same five tabs as a floating bottom dock
Look:     thick outlines, solid shadows, pill buttons, springy motion
```

**Say:** "It is the same app in two shapes. On desktop the five tabs are a left rail. Under 768
pixels the same tabs become a floating bottom dock, because a thumb reaches the bottom of a phone
but not the top. The look is deliberate: thick outlines, solid offset shadows, pill buttons and
springy motion, and every animation respects reduced motion."

**If asked about the design process:** "The first pass was generic AI output. I rebuilt it with a
deliberate voice. Palette, type pairing and border weights are all choices, not defaults."

---

## Slides 9–10 · Proof (4:35–5:25)

### Slide 9 · One container, one URL (4:35–5:00)

```
Docker   built app + API in one image
   ↓
Render   trackstack-zin9.onrender.com (HTTPS, one service)
   ↓
Postgres managed Postgres 16 (data and sessions)
```

**Say:** "One Docker container serves the pages and the API, on Render, with managed Postgres behind
it. Because the pages and the API share one origin, the login cookie just works and there is no
CORS. One URL to demo. Migrations run at container start and can be repeated, so every redeploy is
safe."

### Slide 10 · Proof: it works (5:00–5:25)

```
128  automated tests against a real Postgres database
  1  live URL: the container builds, migrates, serves and logs in
  3  seeded shelves, so the demo is never empty
```

**Say:** "128 automated tests run the real API against a real Postgres database: ownership,
constraints and permissions. The live container builds, migrates, serves the app, handles deep links
and logs in. And the demo data means the app is never empty. The same client also runs as an Android
app."

### Showing the Android version (10 seconds, optional)

If the phone or emulator is ready, hold it up while you say the last sentence on slide 10.
Say: "This is the same React build in a native shell. It loads the deployed site, so the login,
the shelves and the bottom dock are the same code." Show one shelf and the bottom dock, then
put the phone down. The APK is
`android/app/build/outputs/apk/debug/app-debug.apk`; build instructions are in
[`android.md`](android.md). If the device is not ready, say the line and move on. Do not spend
demo time installing it.

---

## Slides 11–12 · Reflection and close (5:25–6:00)

### Slide 11 · What worked, what didn't (5:25–5:55)

| Worked | Didn't | Learned |
|---|---|---|
| Schema first, so every feature followed | Scope was too big | A collection is a join table, not a list |
| One feature per commit | The first UI looked generic | Real-database tests catch more |
| AI wrote code inside boundaries I set | Free hosting sleeps on demo day | Saying no is part of design |

**Say:** "What worked: the schema came first, so every feature followed; one feature per commit; and
AI wrote code inside boundaries I set. What didn't: the scope was too big, the first UI looked
generic, and free hosting sleeps on demo day. What I learned: a collection is a join table, not a
list; real-database tests catch more; and saying no is part of design."

### Slide 12 · Questions (5:55–6:00)

**Say:** "Happy to go deeper on the data model, the API, security or hosting." Then stop talking and
let the questions come.

---

## Questions I should expect (4 minutes)

Have answers to these. Say the short version, then stop.

**Q: Why not just use MongoDB?**
"Everything here is relational. A shelf belongs to one user, a join table carries the copy details,
and I wanted the database to enforce unique emails and valid formats. Postgres gives me that for
free, plus JSONB where I needed flexibility, like achievement criteria."

**Q: Where are your API keys?**
"There aren't any. The iTunes Search API needs no key, and every call to it is made from the server,
so no key could end up in the front-end bundle. The only secrets are `DATABASE_URL` and
`SESSION_SECRET`, supplied as environment variables, with `.env` git-ignored."

**Q: How do you prevent one user seeing another's data?**
"Every personal query is scoped by `user_id` from the session inside the service layer, not in the
route. A collection lookup for someone else's collection returns 404, not 403, so it doesn't even
confirm it exists. There are tests that assert exactly this."

**Q: Why server-side sessions instead of JWT?**
"Revocable. If a user reports a compromised account I can delete their session rows and they're
logged out everywhere. With a JWT the token stays valid until it expires. The cookie is httpOnly, so
an XSS bug can't read it."

**Q: What's your biggest weakness?**
"Single-region Postgres on a free tier with no backups, and in-process rate limiting that wouldn't
work across multiple instances. For a real launch I'd move to a managed Postgres with automated
backups and put the rate limiter in Redis."

**Q: How did you use AI without losing control?**
"I wrote the architecture and the schema first, then had AI write one module at a time against that
contract. The layering (routes, controllers, services, SQL) kept it coherent. Every boundary is
validated, so a generated handler that forgets a WHERE clause fails the tests rather than shipping."

**Q: How would you add tags?**
"A `tags` table and a `collection_albums_tags` join table, the same many-to-many pattern as shelves
and albums. The brief lists it as an extra; I spent the budget on stories and the social layer
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

1. Rehearse with a timer at least three times. If you go past 6:00, cut the last line of slide 7 and
   the demo-data line on slide 10.
2. Open the app in a second window *before* you start so the first click is instant.
3. Don't narrate the UI element by element. Narrate the *journey*.
4. If a call to the iTunes API is slow, talk over it: "this is the live catalogue, it caches for
   five minutes".
5. Face the audience. Read the slide, not your notes.
6. Have `docs/architecture.md` open in a tab. You can point at it if a question goes deep.
7. **Say one thing per slide.** If you remember only three sentences: *album shared, copy personal;
   browser → API → database; one container, one URL, 128 tests.*
