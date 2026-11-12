# TrackStack

A dark, coral-accented home for your records, cassettes and listening lists.

TrackStack lets you discover albums, organise a personal collection, record copy details, keep a wantlist and listening journal, and share collections with a link or public profile.

Every application page requires an account. Signed-out visitors are sent to login and returned to their requested page after signing in; new users can register from the login screen.

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
npm run dev
```

The web app runs on Vite and the API runs on Express. Run `npm test` for the client and server test suites; `npm run build` creates the production client bundle.

## Architecture

- `client/` — React 19, React Router 7, Vite, Tailwind CSS and Framer Motion.
- `server/` — Express 5 REST API with PostgreSQL, zod validation and server-side sessions.

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
