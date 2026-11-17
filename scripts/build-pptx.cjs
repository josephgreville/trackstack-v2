/*
 * Build docs/presentation/TrackStack-Presentation.pptx from the same content
 * as the HTML deck. Speaker notes are read directly out of index.html so the
 * two decks can never drift apart.
 */
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'docs', 'presentation', 'index.html');
const OUT = path.join(ROOT, 'docs', 'presentation', 'TrackStack-Presentation.pptx');
const LIVE_URL = process.env.LIVE_URL || 'trackstack-zin9.onrender.com';

const C = {
  paper: '1E1C1B',
  card: '262423',
  card2: '2F2C2A',
  cream: 'F3EEE9',
  muted: 'B5AAA2',
  coral: 'FF7049',
  gold: 'E6B85D',
  sage: '9BAE9F',
  rose: 'D9887E',
  line: '3B3937',
  dark: '0E0D0C',
};

const HEAD = 'Trebuchet MS';
const BODY = 'Segoe UI';
const MONO = 'Consolas';

// pptxgenjs exposes its shape enum on an instance, not on the module export.
let SHAPE;

/* ------------------------------------------------------------------ notes */
function readNotes() {
  const html = fs.readFileSync(HTML, 'utf8');
  const start = html.indexOf('const NOTES = [');
  const end = html.indexOf('\n  ];', start);
  if (start < 0 || end < 0) throw new Error('Could not locate NOTES in index.html');
  const block = html.slice(start, end);
  const notes = [...block.matchAll(/`([\s\S]*?)`/g)].map((m) => m[1].trim());
  if (notes.length !== 14) {
    throw new Error(`Expected 14 speaker notes, found ${notes.length}`);
  }
  return notes;
}

/* ---------------------------------------------------------------- helpers */
function chrome(slide, n) {
  slide.background = { color: C.paper };
  slide.addShape(SHAPE.ellipse, {
    x: 10.7, y: -1.5, w: 4.0, h: 3.2,
    fill: { color: C.coral, transparency: 88 }, line: { color: C.coral, transparency: 100 },
  });
  slide.addShape(SHAPE.ellipse, {
    x: -1.4, y: 5.4, w: 3.6, h: 3.0,
    fill: { color: C.sage, transparency: 92 }, line: { color: C.sage, transparency: 100 },
  });
  slide.addText('TrackStack  ·  Final Project', {
    x: 0.75, y: 7.02, w: 5, h: 0.28,
    fontFace: MONO, fontSize: 9, color: '6F6862', margin: 0,
  });
  slide.addText(String(n).padStart(2, '0'), {
    x: 11.8, y: 7.02, w: 0.8, h: 0.28,
    fontFace: MONO, fontSize: 9, color: C.coral, align: 'right', margin: 0,
  });
}

function kicker(slide, text) {
  slide.addShape(SHAPE.roundRect, {
    x: 0.8, y: 0.5, w: Math.max(1.8, text.length * 0.105 + 0.5), h: 0.34,
    fill: { color: C.paper }, line: { color: C.coral, width: 1 },
  });
  slide.addText(text.toUpperCase(), {
    x: 0.95, y: 0.545, w: Math.max(1.6, text.length * 0.105 + 0.3), h: 0.24,
    fontFace: MONO, fontSize: 9.5, color: C.coral, charSpacing: 1.5, margin: 0,
  });
}

function heading(slide, text, size = 30) {
  slide.addText(text, {
    x: 0.78, y: 0.98, w: 11.8, h: 0.85,
    fontFace: HEAD, fontSize: size, bold: true, color: C.cream,
    margin: 0, valign: 'mid',
  });
}

function rule(slide, x, y, w = 1.15) {
  slide.addShape(SHAPE.rect, {
    x, y, w, h: 0.045, fill: { color: C.coral }, line: { color: C.coral },
  });
}

function card(slide, x, y, w, h, title, body, opts = {}) {
  slide.addShape(SHAPE.roundRect, {
    x, y, w, h,
    fill: { color: opts.fill || C.card },
    line: { color: opts.hi ? C.coral : C.line, width: opts.hi ? 1.5 : 1 },
  });
  slide.addText(title, {
    x: x + 0.22, y: y + 0.18, w: w - 0.44, h: 0.4,
    fontFace: HEAD, fontSize: opts.titleSize || 15, bold: true,
    color: opts.titleColor || C.cream, margin: 0,
  });
  if (body) {
    slide.addText(body, {
      x: x + 0.22, y: y + 0.66, w: w - 0.44, h: h - 0.82,
      fontFace: BODY, fontSize: opts.bodySize || 12, color: opts.bodyColor || C.muted,
      margin: 0, valign: 'top', lineSpacingMultiple: 1.12,
    });
  }
}

function bullets(slide, x, y, w, h, items, size = 17) {
  slide.addText(
    items.map((t) => ({ text: t, options: { bullet: true, breakLine: true, paraSpaceAfter: 9 } })),
    {
      x, y, w, h, fontFace: BODY, fontSize: size, color: C.cream,
      margin: 0, valign: 'top', lineSpacingMultiple: 1.05,
    },
  );
}

function node(slide, x, y, w, h, tag, name, desc, tagColor) {
  slide.addShape(SHAPE.roundRect, {
    x, y, w, h, fill: { color: C.card }, line: { color: C.line, width: 1 },
  });
  slide.addShape(SHAPE.roundRect, {
    x: x + 0.16, y: y + 0.18, w: 0.78, h: 0.32,
    fill: { color: tagColor }, line: { color: tagColor },
  });
  slide.addText(tag, {
    x: x + 0.2, y: y + 0.235, w: 0.7, h: 0.2,
    fontFace: MONO, fontSize: 8, bold: true,
    color: tagColor === C.gold || tagColor === C.sage ? C.dark : C.cream,
    align: 'center', margin: 0,
  });
  slide.addText(name, {
    x: x + 1.06, y: y + 0.14, w: w - 1.2, h: 0.38,
    fontFace: HEAD, fontSize: 14, bold: true, color: C.cream, margin: 0,
  });
  slide.addText(desc, {
    x: x + 1.06, y: y + 0.45, w: w - 1.2, h: 0.3,
    fontFace: BODY, fontSize: 10.5, color: C.muted, margin: 0,
  });
}

function arrow(slide, x, y) {
  slide.addText('↓', {
    x, y, w: 0.5, h: 0.28, fontFace: MONO, fontSize: 15,
    color: C.coral, align: 'center', margin: 0,
  });
}

function step(slide, x, y, w, h, n, label, demo = true) {
  slide.addShape(SHAPE.roundRect, {
    x, y, w, h,
    fill: { color: demo ? '3A2A24' : C.card },
    line: { color: demo ? C.coral : C.line, width: demo ? 1.3 : 1 },
  });
  slide.addText(n, {
    x: x + 0.13, y: y + 0.1, w: w - 0.26, h: 0.2,
    fontFace: MONO, fontSize: 9, color: C.coral, margin: 0,
  });
  slide.addText(label, {
    x: x + 0.13, y: y + 0.34, w: w - 0.26, h: h - 0.4,
    fontFace: HEAD, fontSize: 12.5, bold: true, color: C.cream, margin: 0, valign: 'top',
  });
}

function entity(slide, x, y, w, h, title, fields, hi = false) {
  slide.addShape(SHAPE.roundRect, {
    x, y, w, h, fill: { color: C.card2 },
    line: { color: hi ? C.coral : C.line, width: hi ? 1.4 : 1 },
  });
  slide.addText(title, {
    x: x + 0.12, y: y + 0.14, w: w - 0.24, h: 0.32,
    fontFace: HEAD, fontSize: 13, bold: true,
    color: hi ? C.coral : C.cream, align: 'center', margin: 0,
  });
  slide.addText(fields, {
    x: x + 0.1, y: y + 0.52, w: w - 0.2, h: h - 0.6,
    fontFace: MONO, fontSize: 9.5, color: C.muted, align: 'center', margin: 0,
    lineSpacingMultiple: 1.08,
  });
}

/* ------------------------------------------------------------------- deck */
function build() {
  const notes = readNotes();
  const pptx = new pptxgen();
  SHAPE = pptx.ShapeType;
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Joseph Greville';
  pptx.company = 'TrackStack';
  pptx.subject = 'Route B final project — a web app for sharing record collections';
  pptx.title = 'TrackStack — Final Project Presentation';
  pptx.lang = 'en-GB';
  pptx.theme = { headFontFace: HEAD, bodyFontFace: BODY, lang: 'en-GB' };

  const add = (n, fn) => {
    const s = pptx.addSlide();
    chrome(s, n);
    fn(s);
    s.addNotes(notes[n - 1]);
    return s;
  };

  /* 1 — title */
  add(1, (s) => {
    kicker(s, 'Final Project · Vibe Coding Web App');
    s.addText('TrackStack', {
      x: 0.85, y: 1.45, w: 11.6, h: 1.15,
      fontFace: HEAD, fontSize: 54, bold: true, color: C.cream, margin: 0,
    });
    rule(s, 0.9, 2.72, 1.3);
    s.addText(
      'A home for your record collection — browse a catalogue, build shelves,\ntrack every copy, share the room.',
      {
        x: 0.9, y: 3.05, w: 10.8, h: 1.0, fontFace: BODY, fontSize: 19,
        color: C.muted, margin: 0, lineSpacingMultiple: 1.15,
      },
    );
    const cols = [
      ['ROUTE B', 'records'],
      ['STACK', 'React · Express · PostgreSQL'],
      ['REPO', 'github.com/josephgreville/trackstack-v2'],
    ];
    cols.forEach(([label, value], i) => {
      const x = 0.9 + i * 4.0;
      s.addText(label, { x, y: 5.15, w: 3.6, h: 0.25, fontFace: MONO, fontSize: 10, color: C.muted, margin: 0 });
      s.addText(value, { x, y: 5.45, w: 3.6, h: 0.5, fontFace: BODY, fontSize: 14, bold: true, color: C.coral, margin: 0 });
    });
  });

  /* 2 — the brief */
  add(2, (s) => {
    kicker(s, 'The brief');
    heading(s, 'People who share an interest,\nsharing their things', 29);
    bullets(s, 0.85, 2.35, 6.1, 3.6, [
      'Every user → many collections',
      'Every collection → many records',
      'Records come from a real catalogue — iTunes',
      'Each copy has format, condition, price',
    ], 17);
    card(s, 7.2, 2.15, 5.3, 3.8, 'Why records?',
      'The data is genuinely relational: one record can sit in many collections, and every copy is its own thing with its own condition and price. The modelling problem is the interesting part — not the CRUD.',
      { hi: true, bodySize: 13.5 });
  });

  /* 3 — data model */
  add(3, (s) => {
    kicker(s, 'Data model');
    heading(s, 'Catalogue entry ≠ your copy', 30);
    const bx = 0.75, bw = 2.6, lw = 0.45;
    entity(s, bx, 2.0, bw, 1.5, 'users', 'id · username · email\npassword_hash · xp · level', true);
    s.addText('1 → many', { x: bx + bw, y: 2.5, w: lw, h: 0.5, fontFace: MONO, fontSize: 8.5, color: C.sage, align: 'center', margin: 0 });
    entity(s, bx + bw + lw, 2.0, bw, 1.5, 'collections', 'user_id · name\nis_public · share_token\nshelf_theme');
    s.addText('1 → many', { x: bx + 2 * (bw + lw), y: 2.5, w: lw, h: 0.5, fontFace: MONO, fontSize: 8.5, color: C.sage, align: 'center', margin: 0 });
    entity(s, bx + 3 * (bw + lw) - lw, 2.0, bw, 1.5, 'collection_albums', 'collection_id · album_id\nformat · condition\nprice · edition_notes', true);
    s.addText('many → 1', { x: bx + 3 * (bw + lw), y: 2.5, w: lw, h: 0.5, fontFace: MONO, fontSize: 8.5, color: C.sage, align: 'center', margin: 0 });
    entity(s, bx + 4 * (bw + lw) - lw, 2.0, bw, 1.5, 'albums', 'title · artist · year\ngenre · artwork_url\nexternal_id');

    const y = 3.85, w = 3.75;
    card(s, 0.75, y, w, 2.25, 'Metadata is global',
      'One albums row per record, shared by everyone. Two people owning the same pressing never duplicate it.',
      { hi: true, bodySize: 12 });
    card(s, 4.7, y, w, 2.25, 'Your copy is personal',
      'Format, condition, price and notes live on the join table — the copy, not the catalogue entry.',
      { bodySize: 12 });
    card(s, 8.65, y, w, 2.25, 'Plus 12 more tables',
      'wantlist · history · follows · likes · comments · stories · photos · badges · recommendations · sessions · wrapped',
      { bodySize: 11.5 });
  });

  /* 4 — screens */
  add(4, (s) => {
    kicker(s, 'The app');
    heading(s, 'Seven screens, one system', 30);
    const items = [
      ['Home', 'Dashboard, featured records, recent adds'],
      ['Browse', 'Search the live catalogue by genre, artist, year'],
      ['Album detail', 'Tracks, 30s previews, related albums'],
      ['Collection', 'Your shelf: copy details, stats, share link'],
      ['My collections', 'Every shelf, plus the record-shelf room'],
      ['Add / edit', 'Search the catalogue or add it by hand'],
      ['Log in / register', 'Deep links survive the login detour'],
      ['Plus', 'Wantlist, journal, stories, community, badges, Wrapped'],
    ];
    items.forEach(([t, b], i) => {
      const col = i % 4, row = Math.floor(i / 4);
      card(s, 0.65 + col * 3.05, 2.0 + row * 2.0, 2.85, 1.75, t, b, {
        hi: i === 7, bodySize: 11.5, titleSize: 14,
      });
    });
  });

  /* 5 — demo journey */
  add(5, (s) => {
    kicker(s, 'Live demo');
    heading(s, 'The journey', 30);
    const labels = [
      'Register', 'Home dashboard', 'Browse & search', 'Album detail', 'Add to a shelf',
      'Copy details', 'Collection stats', 'Shelf room', 'Share link', 'Wantlist & journal',
      'Community', 'Wrapped & badges', 'Resize to phone', 'Public profile', 'Signed-out share',
    ];
    labels.forEach((label, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      step(s, 0.68 + col * 2.43, 1.95 + row * 1.03, 2.25, 0.86, String(i + 1).padStart(2, '0'), label);
    });
    s.addText(
      'Nothing is hard-coded. Every screen is one React route talking to one Express endpoint — the account was created minutes before this talk.',
      { x: 0.85, y: 5.35, w: 11.6, h: 0.8, fontFace: BODY, fontSize: 13, color: C.muted, margin: 0 },
    );
  });

  /* 6 — architecture shape */
  add(6, (s) => {
    kicker(s, 'Architecture');
    heading(s, 'The shape of it', 30);
    const nodes = [
      ['CLIENT', 'React 19 + Vite', 'Router 7 · Tailwind · Framer Motion', C.coral],
      ['API', 'Express 5 on Node 20', 'zod validation · sessions · rate limits', C.coral],
      ['DATA', 'PostgreSQL 16', 'FKs · CHECK constraints · jsonb', C.sage],
      ['3RD PARTY', 'iTunes Search API', 'called from the server only', C.gold],
    ];
    nodes.forEach(([tag, name, desc, colour], i) => {
      const y = 1.9 + i * 1.1;
      node(s, 0.75, y, 5.6, 0.78, tag, name, desc, colour);
      if (i < 3) arrow(s, 3.25, y + 0.79);
    });
    card(s, 6.85, 1.9, 5.7, 2.35, 'Layers',
      'routes → controllers → services → SQL\n\nControllers never write SQL. Services never touch req/res. That is what makes it testable.',
      { bodySize: 12.5 });
    card(s, 6.85, 4.45, 5.7, 1.85, 'One repo',
      'npm workspaces, one npm install, one npm run dev, one push ships client and API together.',
      { bodySize: 12.5 });
  });

  /* 7 — why these choices */
  add(7, (s) => {
    kicker(s, 'Architecture');
    heading(s, 'Why these choices', 30);
    const rows = [
      ['PostgreSQL', 'The data is relational — I wanted the database to enforce it: foreign keys, CHECK constraints on format and condition, unique indexes on lower(email). A document store means hand-rolling integrity.'],
      ['No ORM', 'Explicit SQL, so I can explain every query and every index. That was the part I was asked to understand.'],
      ['Sessions, not JWT', 'The cookie holds only a signed id — an XSS bug can’t read it, and I can revoke a session server-side.'],
      ['Own API', 'Our Express API is the source of truth for users, collections, copies. iTunes only supplies catalogue metadata.'],
      ['Monorepo', 'Client and API in one repo, one install, one dev command, one deploy.'],
    ];
    let y = 1.95;
    rows.forEach(([label, body], i) => {
      s.addText(label, { x: 0.85, y, w: 2.0, h: 0.75, fontFace: MONO, fontSize: 13, bold: true, color: C.coral, margin: 0, valign: 'top' });
      s.addText(body, { x: 2.9, y, w: 9.5, h: 0.78, fontFace: BODY, fontSize: 12.5, color: C.muted, margin: 0, valign: 'top', lineSpacingMultiple: 1.08 });
      if (i < rows.length - 1) {
        s.addShape(SHAPE.rect, { x: 0.85, y: y + 0.88, w: 11.55, h: 0.012, fill: { color: C.line }, line: { color: C.line } });
      }
      y += 0.95;
    });
  });

  /* 8 — API */
  add(8, (s) => {
    kicker(s, 'Architecture');
    heading(s, 'The API', 30);
    const v1 = [
      'POST   /auth/register', 'POST   /auth/login', 'GET    /catalog/search',
      'GET    /collections', 'POST   /collections/:id/albums',
      'PATCH  /collections/:id/albums/:albumId', 'GET    /me/wantlist',
      'GET    /public/share/:token',
    ].join('\n');
    const v2 = [
      'GET    /me   (xp, level)', 'GET    /achievements', 'GET    /wrapped?range=year',
      'GET    /recommendations', 'POST   /social/follow/:userId',
      'POST   /social/like/:type/:id', 'GET    /stories/albums/:id/story',
      'GET    /social/activity',
    ].join('\n');
    card(s, 0.75, 2.0, 5.7, 3.55, '/api/v1', v1, { bodySize: 12.5, bodyColor: C.muted, titleColor: C.gold, titleSize: 16 });
    card(s, 6.85, 2.0, 5.7, 3.55, '/api/v1/2', v2, { bodySize: 12.5, bodyColor: C.muted, titleColor: C.coral, titleSize: 16 });
    s.addText('Every body, param and query is validated with zod before it reaches SQL. One JSON error shape for everything. Version 1 never changed shape — the 2.0 features live under /2.',
      { x: 0.85, y: 5.75, w: 11.6, h: 0.85, fontFace: BODY, fontSize: 12.5, color: C.muted, margin: 0 });
    // Override endpoint lists with a monospaced face for alignment.
    s.addText(v1, { x: 0.97, y: 2.66, w: 5.25, h: 2.85, fontFace: MONO, fontSize: 11.5, color: C.muted, margin: 0, lineSpacingMultiple: 1.32 });
    s.addText(v2, { x: 7.07, y: 2.66, w: 5.25, h: 2.85, fontFace: MONO, fontSize: 11.5, color: C.muted, margin: 0, lineSpacingMultiple: 1.32 });
  });

  /* 9 — security */
  add(9, (s) => {
    kicker(s, 'Security');
    heading(s, 'Keys, sessions, and other people’s data', 28);
    card(s, 0.75, 2.05, 3.75, 3.9, 'API keys',
      'There are none.\n\nThe iTunes Search API needs no key, and every call is made from the server — so no key can reach the browser bundle. The only secrets are DATABASE_URL and SESSION_SECRET, both in environment variables, and .env is git-ignored.',
      { bodySize: 12.5 });
    card(s, 4.78, 2.05, 3.75, 3.9, 'Sessions',
      'Server-side, stored in Postgres, signed id in an httpOnly cookie, SameSite, Secure in production, revocable server-side. bcrypt for passwords. Rate limits on login.',
      { bodySize: 12.5 });
    card(s, 8.81, 2.05, 3.75, 3.9, 'Ownership',
      'Every personal query is scoped by user_id from the session inside the service, not the route. Another user’s collection returns 404 — it never confirms the thing exists. There are tests for exactly this.',
      { hi: true, bodySize: 12.5 });
  });

  /* 10 — design */
  add(10, (s) => {
    kicker(s, 'Design');
    heading(s, 'One layout, two shapes', 30);
    [['Desktop', 0.75], ['Mobile', 6.85]].forEach(([label, x]) => {
      s.addShape(SHAPE.roundRect, { x, y: 2.0, w: 5.7, h: 3.55, fill: { color: C.card }, line: { color: C.line, width: 1 } });
      s.addText(label, { x: x + 0.22, y: 2.18, w: 5.2, h: 0.35, fontFace: HEAD, fontSize: 15, bold: true, color: C.cream, margin: 0 });
      s.addShape(SHAPE.roundRect, { x: x + 0.25, y: 2.75, w: 1.1, h: 2.2, fill: { color: C.card2 }, line: { color: C.line } });
      for (let i = 0; i < 5; i++) {
        s.addShape(SHAPE.roundRect, {
          x: x + 0.42, y: 2.95 + i * 0.38, w: 0.75, h: 0.12,
          fill: { color: i === 0 ? C.coral : C.line }, line: { color: i === 0 ? C.coral : C.line },
        });
      }
      s.addShape(SHAPE.roundRect, { x: x + 1.55, y: 2.75, w: 3.85, h: 2.2, fill: { color: C.card2 }, line: { color: C.line } });
      if (label === 'Desktop') {
        for (let i = 0; i < 3; i++) {
          s.addShape(SHAPE.roundRect, {
            x: x + 1.75 + i * 1.18, y: 2.95, w: 1.05, h: 0.45,
            fill: { color: '47322B' }, line: { color: C.coral, width: 0.75 },
          });
        }
        s.addShape(SHAPE.roundRect, { x: x + 1.75, y: 3.55, w: 3.4, h: 1.15, fill: { color: '47322B' }, line: { color: C.coral, width: 0.75 } });
      } else {
        s.addShape(SHAPE.roundRect, { x: x + 1.85, y: 3.0, w: 3.2, h: 0.5, fill: { color: '47322B' }, line: { color: C.coral, width: 0.75 } });
        s.addShape(SHAPE.roundRect, { x: x + 1.85, y: 3.65, w: 3.2, h: 0.78, fill: { color: '47322B' }, line: { color: C.coral, width: 0.75 } });
        s.addShape(SHAPE.roundRect, { x: x + 1.85, y: 4.55, w: 3.2, h: 0.28, fill: { color: C.coral }, line: { color: C.coral } });
        s.addText('HOME · STACKS', { x: x + 1.9, y: 4.575, w: 3.1, h: 0.2, fontFace: HEAD, fontSize: 9, bold: true, color: C.dark, align: 'center', margin: 0 });
      }
    });
    s.addText('Sticker-book aesthetic: 2px outlines, solid offset shadows, no blur, pill buttons, spring motion. One token file. Every animation respects prefers-reduced-motion.',
      { x: 0.85, y: 5.8, w: 11.6, h: 0.8, fontFace: BODY, fontSize: 12.5, color: C.muted, margin: 0 });
  });

  /* 11 — hosting */
  add(11, (s) => {
    kicker(s, 'Hosting');
    heading(s, 'One container, one origin', 30);
    const nodes = [
      ['DOCKER', 'Vite build → Node runtime', 'client/dist + Express', C.coral],
      ['RENDER', LIVE_URL, 'one service, HTTPS', C.coral],
      ['POSTGRES', 'Managed Postgres 16', 'migrations run at boot', C.sage],
    ];
    nodes.forEach(([tag, name, desc, colour], i) => {
      const y = 2.0 + i * 1.25;
      node(s, 0.75, y, 5.6, 0.85, tag, name, desc, colour);
      if (i < 2) arrow(s, 3.25, y + 0.86);
    });
    card(s, 6.85, 2.0, 5.7, 2.15, 'Why one service',
      'Same origin → the cookie stays SameSite=Lax, no CORS, one URL for the demo. Migrations are numbered SQL files and run at container start; they’re idempotent, so every redeploy is safe.',
      { bodySize: 12.5 });
    card(s, 6.85, 4.35, 5.7, 2.0, 'Also documented',
      'The split option — Netlify for the client, Railway for the API — plus a local-only docker compose path. The image is portable to any container host.',
      { bodySize: 12.5 });
  });

  /* 12 — verification */
  add(12, (s) => {
    kicker(s, 'Verification');
    heading(s, 'How do I know it works?', 30);
    card(s, 0.75, 2.1, 3.75, 3.7, '128 tests',
      '13 files. Server suites run the real Express app against a real Postgres test database via Supertest — migrations, constraints, ownership and authz included.',
      { hi: true, bodySize: 12.5 });
    card(s, 4.78, 2.1, 3.75, 3.7, 'Real container',
      'The production image builds, boots, migrates, serves the SPA and the API, handles deep links, and logs in — verified locally before deploying.',
      { bodySize: 12.5 });
    card(s, 8.81, 2.1, 3.75, 3.7, 'Seeded demo',
      'One repeatable seed: two collectors, three shelves, copy details, wantlist, journal, a story, a follower. Never an empty screen.',
      { bodySize: 12.5 });
  });

  /* 13 — reflection */
  add(13, (s) => {
    kicker(s, 'Reflection');
    heading(s, 'What went well, what didn’t', 29);
    const cols = [
      ['Worked', C.sage, [
        'Schema decided first — every feature followed from it',
        'Small commits, one feature at a time',
        'AI wrote the code; I chose the boundaries',
        'Layers kept generated code coherent',
      ]],
      ['Didn’t', C.rose, [
        'Scope — the 2.0 features took twice as long as 1.0',
        'First pass looked like every other AI app',
        'Free hosting sleeps; a demo-day risk',
        'No backups on a free database',
      ]],
      ['Learnt', C.coral, [
        'A “collection” is a join table plus copy details, not a list of ids',
        'Testing the real database caught what mocks hid',
        'Scope control is a technical skill',
      ]],
    ];
    cols.forEach(([title, colour, items], i) => {
      const x = 0.75 + i * 4.03;
      s.addShape(SHAPE.roundRect, { x, y: 2.05, w: 3.75, h: 3.95, fill: { color: C.card }, line: { color: i === 2 ? C.coral : C.line, width: i === 2 ? 1.5 : 1 } });
      s.addText(title, { x: x + 0.22, y: 2.23, w: 3.3, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: colour, margin: 0 });
      s.addText(
        items.map((t) => ({ text: '•  ' + t, options: { breakLine: true, paraSpaceAfter: 9 } })),
        { x: x + 0.22, y: 2.78, w: 3.3, h: 3.0, fontFace: BODY, fontSize: 12.5, color: C.muted, margin: 0, valign: 'top' },
      );
    });
  });

  /* 14 — questions */
  add(14, (s) => {
    kicker(s, 'Thanks');
    s.addText('Questions?', {
      x: 0.85, y: 1.5, w: 11.6, h: 1.2,
      fontFace: HEAD, fontSize: 54, bold: true, color: C.cream, margin: 0,
    });
    rule(s, 0.9, 2.78, 1.3);
    s.addText('Happy to go deeper on the schema, the API,\nthe security model or the deployment.', {
      x: 0.9, y: 3.12, w: 10.8, h: 0.95, fontFace: BODY, fontSize: 19,
      color: C.muted, margin: 0, lineSpacingMultiple: 1.15,
    });
    const cols = [
      ['LIVE', LIVE_URL],
      ['REPO', 'github.com/josephgreville/trackstack-v2'],
      ['DOCS', 'docs/architecture.md'],
    ];
    cols.forEach(([label, value], i) => {
      const x = 0.9 + i * 4.0;
      s.addText(label, { x, y: 5.15, w: 3.6, h: 0.25, fontFace: MONO, fontSize: 10, color: C.muted, margin: 0 });
      s.addText(value, { x, y: 5.45, w: 3.6, h: 0.5, fontFace: BODY, fontSize: 13.5, bold: true, color: C.coral, margin: 0 });
    });
  });

  return pptx.writeFile({ fileName: OUT });
}

build()
  .then(() => {
    const kb = Math.round(fs.statSync(OUT).size / 1024);
    console.log(`Wrote ${path.relative(ROOT, OUT)} (${kb} KB)`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
