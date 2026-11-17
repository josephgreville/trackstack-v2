# TrackStack: Page Designs

The design was laid out before the code, then built as seven React routes that reuse the same
components. This document is the design record: wireframes for **desktop (≥1024px)** and
**mobile (<768px)** for every page in the brief, the design system they share, and how each
wireframe turned into the shipped components.

> Figma file: *(link to the Figma project if you have one. This document is the version that
> travels with the repo and matches what was actually built).*

---

## The brief's page list → the shipped routes

| Brief page | Route | Component |
|---|---|---|
| Home | `/` | `client/src/pages/Home.jsx` |
| Browse all [things] | `/browse` | `client/src/pages/Browse.jsx` |
| [Thing] detail | `/album/:albumId`, `/album/catalog/:externalId` | `client/src/pages/AlbumDetail.jsx` |
| Collection page | `/collections/:collectionId` | `client/src/pages/CollectionDetail.jsx` |
| My collections (logged in) | `/collections` | `client/src/pages/Collections.jsx` |
| Add / edit [thing] form | `/collections/:collectionId/add` | `client/src/pages/add-album/AddAlbum.jsx` |
| Log in / Register | `/login`, `/register` | `client/src/pages/Login.jsx`, `Register.jsx` |

Extra pages designed for Route B: Community (`/social`), Notifications (`/notifications`),
Discover Weekly (`/discover`), Achievements (`/achievements`), Wrapped (`/wrapped`),
Collection Room (`/collection-room`), Wantlist (`/wantlist`), Listening History
(`/listening-history`), Story timeline (`/stories`), Public profile (`/users/:username`),
Shared collection (`/share/:token`).

---

## Design system

```
Type        Fredoka (display, headings, buttons)  ·  Nunito (body)  ·  IBM Plex Mono (numbers)
Colour      charcoal #242424 base · coral #FF7049 accent · cream #F3EEE9 text
            rust #F08A63 · gold #E6B85D · sage #9BAE9F · rose #D9887E
Shape       2px solid outlines, no blur · pill buttons · 16–28px radii · solid offset shadows
Spacing    4 / 8 / 12 / 16 / 24 / 32 / 48 px scale
Motion      spring physics (Framer Motion) · all of it behind prefers-reduced-motion
```

Three rules the whole UI obeys:

1. **The palette lives in one file**: `client/src/styles/tokens.css`. Nothing hard-codes a hex.
2. **Every screen is four blocks**: a title, a primary action, a card grid, and a detail panel.
   That is why seven screens look like one product.
3. **One grid, two densities**: desktop is a 3–4 column grid; mobile is a single column with a
   larger type ramp (`client/src/styles/mobile.css`).

### Navigation

```
Desktop (≥1024px)                     Mobile (<768px)
┌──────────────┬───────────────┐      ┌──────────────────────────┐
│  TrackStack  │               │      │                          │
│              │   page body   │      │      page body           │
│  Home        │               │      │                          │
│  Discover    │               │      │                          │
│  Stacks      │               │      │                          │
│  Community   │               │      │                          │
│  You         │               │      │                          │
│              │               │      │  ┌────────────────────┐  │
│  [avatar]    │               │      │  │ Home Stacks Comm  │  │
│              │               │      │  └────────────────────┘  │
└──────────────┴───────────────┘      └──────────────────────────┘
                                            floating dock
```

A left rail on desktop; a floating bottom dock on mobile. A thumb reaches the bottom of a phone,
not the top. The dock has safe-area padding for iOS home-indicator devices.

---

## 1. Home (`/`)

### Desktop

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ⌂ Home   ⌕ Discover   ▤ Stacks   ◉ Community   ☺ You        🔔(3) [JD]    │
├──────────────┬────────────────────────────────────────────────────────────┤
│              │  Good evening, Joey                                     │
│  ⌂ Home      │  [ + Add an album ]  [ + New collection ]                 │
│  ⌕ Discover  │                                                            │
│  ▤ Stacks    │  ── Featured albums ──────────────────────────────        │
│  ◉ Community │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  ☺ You       │  │ cover  │ │ cover  │ │ cover  │ │ cover  │              │
│              │  │ Rumours│ │Thriller│ │Kind of │ │Discovery│             │
│              │  └────────┘ └────────┘ └────────┘ └────────┘              │
│              │                                                            │
│              │  ── Recently added ────────────────────────────            │
│              │  ┌────────┐ ┌────────┐ ┌────────┐                         │
│              │  │ cover  │ │ cover  │ │ cover  │                         │
│              │  └────────┘ └────────┘ └────────┘                         │
│              │                                                            │
│              │  ── My collections ───────────────    ── Popular genres ── │
│              │  ┌──────────┐ ┌──────────┐          [Rock][Jazz][Soul]    │
│              │  │ Vinyl    │ │ Cassette │                               │
│              │  │ 24 albums│ │ 11 albums│                               │
│              │  └──────────┘ └──────────┘                               │
└──────────────┴────────────────────────────────────────────────────────────┘
```

**Mobile**

```
┌─────────────────────────┐
│ 🔔            [JD]      │
│ Good evening, Joey      │
│ [ + Add an album ]      │
│                         │
│ Featured albums    →    │
│ ┌─────┐ ┌─────┐        │
│ │cover│ │cover│        │
│ └─────┘ └─────┘        │
│ (horizontal scroll)     │
│                         │
│ Recently added     →    │
│ ┌─────┐ ┌─────┐        │
│ └─────┘ └─────┘        │
│                         │
│ My collections          │
│ ┌───────────────────┐   │
│ │ Vinyl Shelf  24   │   │
│ └───────────────────┘   │
│                         │
│  ┌───────────────────┐  │
│  │ Home Stacks Comm  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Built as:** `Home.jsx`, a `Section` component with a heading and optional "see all" link, an
`AlbumCard` grid that becomes a horizontal scroller under 768px, and a `CollectionCard` grid.
The greeting is time-aware.

---

## 2. Browse all albums (`/browse`)

### Desktop

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Browse the catalogue                                                      │
│  ┌─────────────────────────────────────────────┐  ┌────────────────────┐  │
│  │ ⌕  Search by album, artist or genre       │  │ │ Genre              │  │
│  └─────────────────────────────────────────────┘  │ ▣ All              │  │
│  [Rock][Jazz][Soul][Electronic][Hip-Hop][Funk]   │ ▢ Rock             │  │
│  Sort: [Relevance ▾]   Year: [from] – [to]       │ ▢ Jazz             │  │
│                                                   │ ▢ Soul             │  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │ ▢ Electronic       │  │
│  │ cover  │ │ cover  │ │ cover  │ │ cover  │     │ ▢ Hip-Hop          │  │
│  │ Title  │ │ Title  │ │ Title  │ │ Title  │     │                    │  │
│  │ Artist │ │ Artist │ │ Artist │ │ Artist │     │ [ Apply ]          │  │
│  │ 1997 ·R │ │ 2001 ·D│ │ 2013 ·P│ │ 2019 ·E│     │                    │  │
│  └────────┘ └────────┘ └────────┘ └────────┘     └────────────────────┘  │
│                     ‹ 1 2 3 4 5 ›                                      │
└───────────────────────────────────────────────────────────────────────────┘
```

### Mobile

```
┌─────────────────────────┐
│ Browse                  │
│ ┌─────────────────────┐ │
│ │ ⌕ album or artist    │ │
│ └─────────────────────┘ │
│ [Genres ▾] [Sort ▾]     │
│                         │
│ ┌─────┐ ┌─────┐        │
│ │cover│ │cover│        │
│ │Titl │ │Titl │        │
│ └─────┘ └─────┘        │
│                         │
│      Load more          │
│  ┌───────────────────┐  │
│  │ Home Stacks Comm  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Built as:** `Browse.jsx`, a `SearchBar` (debounced), `GenreChips` (horizontal scroller on
mobile), an `AlbumCard` grid, and a `Pagination` control. The genre panel becomes a bottom sheet
on mobile. Results come from `GET /api/v1/catalog/search`, which proxies the iTunes Search API.

---

## 3. Album detail (`/album/:albumId`)

### Desktop

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ‹ Back to browse                                                          │
│ ┌────────────┐   Discovery                                    [ + Add ]    │
│ │            │   Daft Punk · 2001 · Dance · 14 tracks                     │
│ │   cover    │   ────────────────────────────────────────────────────    │
│ │  (large)   │   ▸ 1  One More Time        4:21   ▶ preview               │
│ └────────────┘   ▸ 2  Aerodynamic           3:27   ▶ preview               │
│                  ▸ 3  Digital Love           5:02   ▶ preview               │
│  ──────────     ────────────────────────────────────────────────────       │
│  In my           Where is it?                                               │
│  collections    ┌──────────────────────┐ ┌──────────────────────┐           │
│  [Vinyl ▾]      │ Vinyl Shelf          │ │ Cassette Shelf      │           │
│                 └──────────────────────┘ └──────────────────────┘           │
│                 [ Add to a collection ]                                    │
│                  ────────────────────────────────────────────────────       │
│                  Related albums                                             │
│                  ┌────────┐ ┌────────┐ ┌────────┐                         │
│                  │ cover  │ │ cover  │ │ cover  │                         │
│                  └────────┘ └────────┘ └────────┘                         │
└───────────────────────────────────────────────────────────────────────────┘
```

### Mobile

```
┌─────────────────────────┐
│ ‹ Back                  │
│ ┌─────────────────────┐ │
│ │       cover         │ │
│ └─────────────────────┘ │
│ Discovery               │
│ Daft Punk · 2001        │
│ Dance · 14 tracks       │
│ [ + Add ] [ ▶ Play ]    │
│                         │
│ ▸ 1  One More Time      │
│ ▸ 2  Aerodynamic        │
│ ▸ 3  Digital Love       │
│                         │
│ Where is it?            │
│ [ Vinyl Shelf       ▾ ] │
│ [ Add to a collection ] │
│                         │
│ Related albums          │
│ ┌─────┐ ┌─────┐        │
│  ┌───────────────────┐  │
│  │ Home Stacks Comm  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Built as:** `AlbumDetail.jsx`, `AlbumHero` (cover + metadata), `TrackList` (a virtual-ish list
with inline preview buttons), `CollectionPicker` (a modal that lists the user's collections and
takes the copy details), and a related-albums grid.

---

## 4. Collection page (`/collections/:collectionId`)

### Desktop

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ‹ My collections                                                         │
│  Vinyl Shelf                                       [ + Add ] [ ⋯ Share ]   │
│  My first shelf of records · 24 albums · updated 2 days ago                │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Stats                                                              │  │
│  │  By format    By genre     By decade     By artist                   │  │
│  │  Vinyl  18    Rock   9     90s   6       Pink Floyd     4            │  │
│  │  CD      4    Jazz   5     00s   7       Daft Punk      3            │  │
│  │  Cassette 2   Soul   4     10s   6       Radiohead      2            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                         │
│  │cover│ │cover│ │cover│ │cover│ │cover│ │cover│                         │
│  │Titl │ │Titl │ │Titl │ │Titl │ │Titl │ │Titl │                         │
│  │Vinyl│ │CD   │ │     │ │     │ │     │ │     │                         │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                         │
│  [Export CSV] [Import CSV]                                    ‹ 1 2 ›     │
└───────────────────────────────────────────────────────────────────────────┘
```

### Mobile

```
┌─────────────────────────┐
│ ‹ My collections        │
│ Vinyl Shelf              │
│ 24 albums        [ + ]  │
│ ┌─────────────────────┐ │
│ │ Stats          [▾]  │ │
│ │ Vinyl 18 · CD 4     │ │
│ └─────────────────────┘ │
│ ┌─────┐ ┌─────┐        │
│ │cover│ │cover│        │
│ └─────┘ └─────┘        │
│                         │
│  [ Export CSV ]         │
│  ┌───────────────────┐  │
│  │ Home Stacks Comm  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Built as:** `CollectionDetail.jsx`, `CollectionHeader` (name, description, count, actions), a
`StatsPanel` (collapsible on mobile), `AlbumCard` grid where each card shows the copy details
(format, condition), and a `ShareSheet` that creates the read-only link.

---

## 5. My collections (`/collections`)

### Desktop

```
┌───────────────────────────────────────────────────────────────────────────┐
│  My collections                          [ + Create collection ]         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ ▤▤▤▤ ▤▤▤▤▤  │ │ ▤▤▤▤▤▤▤▤▤▤  │ │              │ │   + Add a    │    │
│  │ ▤▤▤▤ ▤▤▤▤▤  │ │ ▤▤▤▤▤▤▤▤▤▤  │ │              │ │   collection │    │
│  │ Vinyl Shelf  │ │ Cassette ... │ │  (empty)     │ │              │    │
│  │ 24 albums    │ │ 11 albums    │ │  No records  │ │              │    │
│  │ [Edit][⋯]   │ │              │ │  yet         │ │              │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                                            │
│  ── Shelf view ────────────────────────────────────────────────────────    │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  ▤▤▤▤    ▤▤▤▤    ▤▤▤▤    ▤▤▤▤    ▤▤▤▤                          │   │
│  │  ══════════════════════════════════════════════════════════════   │   │
│  │  ▤▤▤▤    ▤▤▤▤    ▤▤▤▤    ▤▤▤▤    ▤▤▤▤                          │   │
│  │  ══════════════════════════════════════════════════════════════   │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

### Mobile

```
┌─────────────────────────┐
│ My collections    [ + ]  │
│                         │
│ ┌─────────────────────┐ │
│ │ Vinyl Shelf         │ │
│ │ 24 albums      [⋯]  │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Cassette Shelf      │ │
│ │ 11 albums      [⋯]  │ │
│ └─────────────────────┘ │
│                         │
│ [ Shelf view ]          │
│  ┌───────────────────┐  │
│  │ Home Stacks Comm  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Built as:** `Collections.jsx`, a `CollectionCard` grid (including a dashed "add a collection"
tile), plus the **collection room** mode where the same data renders as a wall of record shelves
with five themes. The shelf theme and sort order are saved per collection.

---

## 6. Add / edit album form (`/collections/:collectionId/add`)

### Desktop

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ‹ Vinyl Shelf                                                             │
│  Add an album                                                             │
│  ┌──────────────────────────────────────────┐ ┌────────────────────────┐ │
│  │ ⌕ Search the catalogue                  │ │  Adding to             │ │
│  │                                          │ │  Vinyl Shelf           │ │
│  │ ┌────┐ Discovery              + Add     │ │  ─────────────────────  │ │
│  │ │    │ Daft Punk · 2001                │ │  Format      [vinyl  ▾] │ │
│  │ └────┘                                │ │  Condition   [near mint ▾]│ │
│  │ ┌────┐ Random Access Memories  + Add  │ │  Price       [ 28.00  ] │ │
│  │ │    │ Daft Punk · 2013                │ │  Purchased   [ 2024-05 ] │ │
│  │ └────┘                                │ │  Edition     [         ] │ │
│  │ ┌────┘ Homework              + Add     │ │              notes      │ │
│  │ └────┘ Daft Punk · 1997                │ │                        │ │
│  │                                      │ │  [ Add to collection ]  │ │
│  └──────────────────────────────────────────┘ └────────────────────────┘ │
│  ── Or add it manually ──────────────────────────────────────────────    │
│  Title [              ]  Artist [              ]  Year [    ]            │
│  Genre [              ]  Tracks [    ]   [ Add manually ]                │
└───────────────────────────────────────────────────────────────────────────┘
```

### Mobile

```
┌─────────────────────────┐
│ ‹ Vinyl Shelf           │
│ Add an album            │
│ ┌─────────────────────┐ │
│ │ ⌕ search            │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │▒▒ Discovery    + Add│ │
│ │   Daft Punk · 2001  │ │
│ └─────────────────────┘ │
│                         │
│ Adding to Vinyl Shelf   │
│ Format     [vinyl    ▾] │
│ Condition  [near mint▾] │
│ Price      [ 28.00    ] │
│ Purchased  [ 2024-05  ] │
│ Notes      [           ] │
│                         │
│ [ Add to collection ]   │
│                         │
│ Or add it manually      │
│ Title [            ]    │
│ Artist [           ]    │
│  ┌───────────────────┐  │
│  │ Home Stacks Comm  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Built as:** `add-album/AddAlbum.jsx`, a two-column layout on desktop (results left, copy-details
panel right) that stacks on mobile. Search hits the catalogue endpoint; "add manually" creates a
`source: 'manual'` album with no iTunes id. Editing an existing copy reuses the same fields via
`PATCH /api/v1/collections/:id/albums/:albumId`.

---

## 7. Log in / Register (`/login`, `/register`)

### Desktop

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│        ┌──────────────────────────────┐        ┌────────────────────┐    │
│        │        ▓▓▓▓▓▓▓▓▓▓            │        │    Log in          │    │
│        │        ▓ TrackStack ▓         │        │                    │    │
│        │        ▓▓▓▓▓▓▓▓▓▓            │        │  Username          │    │
│        │                              │        │  [______________]  │    │
│        │  A home for your records.    │        │                    │    │
│        │                              │        │  Password          │    │
│        │  [ cover collage artwork ]   │        │  [______________]  │    │
│        │                              │        │                    │    │
│        │                              │        │  [   Log in   ]    │    │
│        │                              │        │                    │    │
│        │                              │        │  New here?         │    │
│        │                              │        │  Create an account →│    │
│        └──────────────────────────────┘        └────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────┘
```

### Mobile

```
┌─────────────────────────┐
│      ▓ TrackStack ▓      │
│   A home for your       │
│   records.              │
│                         │
│ Log in                  │
│ Username                │
│ [___________________]   │
│ Password                │
│ [___________________]   │
│ [      Log in      ]    │
│                         │
│ New here?              │
│ Create an account →     │
└─────────────────────────┘
```

**Built as:** `Login.jsx` / `Register.jsx` inside `AuthLayout`, a split screen on desktop (brand
panel left, form right) and a single stacked column on mobile. After signing in, the user is
returned to the page they originally asked for (`RequireAuth` stores it in the router state), so a
bookmarked deep link like `/collections/:id` survives the login detour. Register creates the
account and signs in immediately.

---

## How the layout became the app

| Design decision | Implementation |
|---|---|
| Five tabs, always visible | `client/src/layout/AppLayout.jsx`, left rail ≥1024px, floating dock <768px |
| One grid, two densities | Tailwind breakpoints + `client/src/styles/mobile.css` type ramp |
| Four blocks per screen | `Section`, `AlbumCard`, `CollectionCard`, `DetailPanel` components reused on every page |
| One palette | `client/src/styles/tokens.css` → Tailwind theme extension in `client/tailwind.config.js` |
| Sticker-book look | 2px borders + solid offset shadows in `components.css`, spring motion in `components/motion.jsx` |
| Genre filter panel | Bottom sheet on mobile, side panel on desktop |
| Shelf view | `CollectionRoom.jsx` renders the same collection data as record shelves |
| Every motion respects the OS | `useReducedMotion()` from Framer Motion gates the transitions |
| Touch targets on mobile | Min 44px hit areas, safe-area padding on the bottom dock |
