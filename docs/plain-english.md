# TrackStack in Plain English

This is the version to read first. No jargon, no code. Just what the app is, how it works,
and what to say when you present it.

---

## In one sentence

**TrackStack is a website where people who collect records can catalogue their copies, organise
them into shelves, and share a shelf with a link.**

## The problem it solves

If you collect records, you forget things: which pressing you own, what condition it is in, what
you paid, and which records you are still looking for. TrackStack keeps all of that in one place.

## What you can do

1. **Find a record**: search a real catalogue of albums.
2. **Add your copy**: record the format, condition and price of the one you own.
3. **Build shelves**: keep as many collections as you like.
4. **Keep a wantlist**: track what you are still hunting for.
5. **Share a shelf**: send a read-only link that opens without an account.
6. **Follow collectors**: see what other people are listening to.

There is also a listening journal, album stories, badges and a yearly recap. Those are extras.
The six actions above are the core.

## The one idea that matters

There is a difference between:

- **the album**: the record itself. It has a title, an artist and a year. Everyone shares this.
- **your copy**: the physical record on your shelf. It has *your* condition, *your* price and
  *your* notes.

TrackStack stores the album once, and stores your copy separately. So two people can own the same
album without duplicating it. Changing your copy never changes theirs.

That is the whole data model in one paragraph. Everything else is built on it.

## How the pieces fit

Think of a restaurant:

| Piece | Plain-English job | In this project |
|---|---|---|
| The menu | Shows you what is available | The React pages in the browser |
| The waiter | Takes your order and checks it | The Express API |
| The kitchen | Stores and prepares everything | PostgreSQL |
| The supplier | Provides ingredients the kitchen does not make | The iTunes catalogue |

The browser never talks to the database directly. It asks the API; the API checks the request and
then talks to the database. iTunes only supplies album information. The API calls it first, and the
browser has a read-only fallback if a host blocks that call.

## The words in the deck, decoded

| Word | What it actually means here |
|---|---|
| **API** | The middle layer the browser asks for data. It checks requests and applies the rules. |
| **Database** | Where the data lives. PostgreSQL is the type of database used. |
| **Table** | One kind of thing: users, collections, albums. |
| **Join table** | A table that links two others. `collection_albums` links a shelf to an album and holds your copy details. |
| **Session** | A login that lives on the server. The browser holds only an ID. |
| **Migration** | A numbered SQL file that updates the database structure. |
| **Docker** | A way to package the app and everything it needs into one runnable box. |
| **Render** | The hosting company running that box and the database. |
| **Same origin** | The pages and the API are on the same address, so the login cookie just works. |
| **ORM** | A tool that writes SQL for you. This project writes SQL directly instead. |
| **Test suite** | Code that checks the app still works after a change. |

## The six-minute story

Say this, in this order. Each line is one slide.

1. **What it is.** "TrackStack is a website for people who collect records. You find an album, add
   your copy, put it on a shelf, and share the shelf with a link."
2. **The core idea.** "The album is shared, but your copy is personal: its condition, price and
   notes belong to you. That is the part worth explaining."
3. **The demo.** "I'll follow one record from search to a shared shelf."
4. **How it works.** "The browser talks to the API I built, the API talks to the database, and iTunes
   supplies album information through a server call first."
5. **The design.** "The same app on desktop and phone: a left rail on desktop, a bottom dock on
   mobile, and one deliberate visual style."
6. **Hosting and proof.** "One container on Render, one URL, and 131 automated tests against a real
   database."
7. **What I learned.** "The schema came first. The scope was too big. And a collection is a join
   table, not a list of IDs."

That is the whole talk. The detailed slides and speaker notes add evidence. They are not the
story.

## If you only remember three things

1. **Album = shared. Copy = personal.**
2. **Browser → API → database.**
3. **One container, one URL, 131 tests.**

## Common questions, short answers

**Why records?**
"The same album can be owned by many people, but each copy is different. That makes it a real
many-to-many problem, not just a list."

**Why PostgreSQL?**
"The data is relationships. The database can enforce them. A shelf always belongs to a user, a
copy always points at a real album."

**Where are the API keys?**
"There are none. iTunes needs no key. The server calls it first, with a read-only browser fallback if
a host blocks that call."

**Is it deployed?**
"Yes, at <https://trackstack-zin9.onrender.com>. The free tier sleeps after 15 minutes idle, so the
first request can take about 30 seconds."

**What would you do next?**
"Tags, better search, offline support in the Android app, and a recommendation model trained on
listening history."
