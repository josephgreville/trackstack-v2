# TrackStack

A dark, coral-accented home for your records, cassettes and listening lists.

TrackStack lets you discover albums, organise a personal collection, record copy details, keep a wantlist and listening journal, and share collections with a link or public profile.

Every application page requires an account. Signed-out visitors are sent to login and returned to their requested page after signing in; new users can register from the login screen.

## Features

- Browse and filter the iTunes album catalogue by genre, artist, year and title.
- Organise albums into collections and record format, condition, purchase date, price and edition notes for each copy.
- Search and sort within collections, import or export collection CSV files, and view collection breakdowns by format, genre, decade and artist.
- Keep a private wantlist with edition notes and a listening history with ratings and reviews.
- Share a read-only collection link or publish selected collections on an opt-in profile.
- Play available iTunes track previews in the persistent bottom player.

## Development

Copy `.env.example` to `.env`, set the PostgreSQL connection values, then run:

```sh
npm install
npm run db:migrate
npm run dev
```

The web app runs on Vite and the API runs on Express. Run `npm test` for the client and server test suites; `npm run build` creates the production client bundle.
