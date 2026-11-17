# TrackStack

A dark, coral-accented home for your records, cassettes and listening lists.

TrackStack lets you discover albums, organise a personal collection, record copy details, keep a wantlist and listening journal, and share collections with a link or public profile.

Every application page requires an account. Signed-out visitors are sent to login and returned to their requested page after signing in; new users can register from the login screen.

**Live demo:** <https://trackstack-zin9.onrender.com>. Sign in with `joey@example.com` / `Password123!` (or `sam@example.com` / `Password123!`). The free instance sleeps after 15 minutes idle, so the first request can take ~30 seconds.

## Deliverables

| Deliverable | Where it is |
|---|---|
| **Read this first** | [`docs/plain-english.md`](docs/plain-english.md): what TrackStack is, in plain English, with no jargon |
| **Brief** | [`docs/brief.md`](docs/brief.md): Route B: records (the brief allows either route) |
| **Architecture doc** | [`docs/architecture.md`](docs/architecture.md): stack, data model, API, security, hosting and risks |
| **Page designs** | [`docs/page-designs.md`](docs/page-designs.md): desktop and mobile wireframes mapped to shipped routes |
| **GitHub repo** | <https://github.com/josephgreville/trackstack-v2>. Public, `main` is the deployed commit |
| **Live URL / hosting plan** | <https://trackstack-zin9.onrender.com> · plan and runbook in [`docs/hosting.md`](docs/hosting.md) |
| **Presentation** | [`docs/presentation.md`](docs/presentation.md) (script, timing, Q&A) · [`docs/presentation/index.html`](docs/presentation/index.html) (13-slide deck) · [`docs/presentation/TrackStack-Presentation.pptx`](docs/presentation/TrackStack-Presentation.pptx) (PowerPoint with speaker notes) |

The presentation is **10 minutes: 6 minutes presenting, 4 minutes of questions**. The deck's
speaker notes carry a per-slide time budget; the demo journey is in
[`docs/presentation.md`](docs/presentation.md) under **Slide 4**.

A single upload-ready pack (the combined PDF, the slide deck as PDF, and the PowerPoint) is in
[`submission/`](submission/), with a `README.txt` listing the links and demo logins.

## The app

TrackStack is organised as five tabs, like a mobile app. Everything else lives one level deeper, inside a tab.

| Tab | Route | What lives there |
|---|---|---|
| **Home** | `/` | Dashboard, featured albums, recent adds, quick actions |
| **Discover** | `/discover` | Catalogue search, genre chips and personalised picks |
| **Stacks** | `/collections` | Your collections, plus the visual collection room |
| **Community** | `/social` | Activity feed, follows, likes and comments |
| **You** | `/profile` | Level and XP, badges, stories, wantlist, journal and Wrapped |

On desktop the tabs sit in a left-hand rail; on mobile they become a floating dock at the bottom of the screen.

The same React build also runs as an Android app. The debug APK is
`android/app/build/outputs/apk/debug/app-debug.apk`. It loads the deployed site, so the phone
shows the same login, shelves and bottom dock. Build and run steps are in [`docs/android.md`](docs/android.md).

## Design

The interface uses a playful, sticker-book aesthetic on top of the original charcoal-and-coral palette: chunky two-pixel outlines, solid offset shadows with no blur, pill-shaped buttons, bouncy spring motion, and rounded Fredoka and Nunito typefaces. Every animation respects `prefers-reduced-motion`.

## Features

### Collect and catalogue
- Browse and filter the iTunes album catalogue by genre, artist, year and title.
- Organise albums into collections and record format, condition, purchase date, price and edition notes for each copy.
- Search and sort within collections, import or export collection CSV files, and view collection breakdowns by format, genre, decade and artist.
- Keep a private wantlist with edition notes and a listening history with ratings and reviews.
- Share a read-only collection link or publish selected collections on an opt-in profile.
- Play available iTunes track previews in the persistent bottom player.

### TrackStack Wrapped
- Yearly, monthly and all-time listening recaps.
- Top artists, albums and genres, total listening time and most-played albums.
- Monthly listening chart and a shareable recap card that can be copied or shared to other apps.

### Visual collection room
- See every collection as a virtual record shelf with albums standing upright.
- Five shelf themes, sortable by artist, genre, year or recently added.
- Shelf theme and ordering are saved per collection and shown on your public profile.

### Discover weekly
- Personalised album recommendations built from your collections, ratings and listening history.
- Similar albums, albums from genres you have not explored, and hidden gems.
- One-click add to any collection or to your wantlist, and dismiss recommendations you are not interested in.

### Gamification
- XP and collector levels with a progress bar to the next level.
- Achievement badges for listening and collecting milestones, such as first listen, 100 albums collected, 10 genres explored and a seven-day streak.
- Check for newly unlocked badges at any time; earned badges are shown on your profile.

### Social community
- Follow other collectors and see your followers.
- Activity feed of recent listens, collection additions and shares.
- Like and comment on shared albums and collections.
- Notifications for new followers and interactions, with unread badges in the navigation.

### Album stories
- Attach a personal memory to any album: the story, where you found it, who you were with and when.
- Publish a story so other collectors can read it on the album page.
- A chronological timeline of every story you have written.

## Development

Copy `.env.example` to `.env`, set the PostgreSQL connection values, then run:

```sh
npm install
npm run db:migrate
npm run db:seed      # optional: demo collector, collections, journal, social graph
npm run dev
```

`npm run db:seed` creates two demo accounts, `joey@example.com` and `sam@example.com`. Both use
the password `Password123!` and have collections, copy details, a wantlist, a listening journal, an
album story and a small social graph, so the app is never empty during a demo. The seed is
repeatable and only touches those two accounts.

The web app runs on Vite and the API runs on Express. Run `npm test` for the client and server test suites; `npm run build` creates the production client bundle.

## Architecture

- `client/`: React 19, React Router 7, Vite, Tailwind CSS and Framer Motion.
- `server/`: Express 5 REST API with PostgreSQL, zod validation and server-side sessions.

Full stack rationale, data model, endpoint reference, security notes and risk register:
**[`docs/architecture.md`](docs/architecture.md)**.

TrackStack 2.0 endpoints are grouped under `/api/v1/2`:

| Route | Purpose |
|---|---|
| `/2/me`, `/2/profile` | Collector profile, XP and level |
| `/2/achievements` | Achievement catalogue and badge checks |
| `/2/wrapped` | Yearly, monthly and all-time recaps |
| `/2/recommendations` | Discover weekly picks |
| `/2/social/*` | Follows, activity, notifications, likes and comments |
| `/2/stories/*` | Album stories and photos |

All personal data is scoped to the signed-in collector. Private collections, listening history, wantlist entries and unpublished stories are never returned by another user's request.

## Hosting

The recommended deployment is a single Docker service (API + built client + managed PostgreSQL).
Build and deploy instructions, environment variable reference, a pre-demo checklist and
troubleshooting: **[`docs/hosting.md`](docs/hosting.md)**.

```sh
docker build -t trackstack .
docker run -p 4000:4000 --env-file .env trackstack
```

`render.yaml` (Render Blueprint), `netlify.toml` (split CDN + API) and `Dockerfile` are in the
repository root.

## Project documents

| Document | What it covers |
|---|---|
| [`docs/plain-english.md`](docs/plain-english.md) | The app explained without jargon. Read this first |
| [`docs/brief.md`](docs/brief.md) | Assignment brief, Route B scope, acceptance criteria and evidence |
| [`docs/architecture.md`](docs/architecture.md) | Stack rationale, data model, endpoint reference, security, risks |
| [`docs/hosting.md`](docs/hosting.md) | Deployment runbook, env reference, pre-demo checklist |
| [`docs/page-designs.md`](docs/page-designs.md) | Desktop and mobile wireframes for every page |
| [`docs/presentation.md`](docs/presentation.md) | 10-minute presentation: slides, demo journey, Q&A prep |
| [`docs/presentation/index.html`](docs/presentation/index.html) | The slide deck itself. Open it in a browser and present |
| [`docs/presentation/TrackStack-Presentation.pptx`](docs/presentation/TrackStack-Presentation.pptx) | The same 13 slides as a PowerPoint file, with speaker notes |
| [`docs/testing.md`](docs/testing.md) | How the test suites are structured and run |
