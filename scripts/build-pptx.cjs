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
  if (notes.length !== 11) {
    throw new Error(`Expected 11 speaker notes, found ${notes.length}`);
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
    kicker(s, 'Final Project · Route B — records');
    s.addText('TrackStack', {
      x: 0.85, y: 1.25, w: 11.6, h: 1.15,
      fontFace: HEAD, fontSize: 54, bold: true, color: C.cream, margin: 0,
    });
    rule(s, 0.9, 2.52, 1.3);
    s.addText(
      'A home for your record collection.\nFind a record, add your copy, organise a shelf, share it.',
      {
        x: 0.9, y: 2.85, w: 10.8, h: 1.0, fontFace: BODY, fontSize: 19,
        color: C.muted, margin: 0, lineSpacingMultiple: 1.15,
      },
    );
    s.addText('WHAT THIS TALK COVERS', {
      x: 0.9, y: 4.45, w: 11.0, h: 0.3, fontFace: MONO, fontSize: 10, color: C.muted, margin: 0,
    });
    s.addText('Idea  →  Demo  →  How it works  →  Design  →  Proof  →  Reflection', {
      x: 0.9, y: 4.8, w: 11.8, h: 0.5, fontFace: HEAD, fontSize: 18, bold: true, color: C.coral, margin: 0,
    });
  });

  /* 2 — what it is */
  add(2, (s) => {
    kicker(s, '1 · What it is');
    heading(s, 'One record. Many collections.', 30);
    bullets(s, 0.85, 2.25, 6.3, 3.6, [
      'A record lives in a shared catalogue',
      'Your copy has its own format, condition and price',
      'A collection is a shelf you can share',
      'The brief offers Route A or B — I chose records',
    ], 17);
    card(s, 7.2, 2.05, 5.3, 3.9, 'The interesting part',
      'One album can sit in many collections, but your copy is personal. Its condition and price belong to you, not to the album. That is the relationship this app is built around.',
      { hi: true, bodySize: 14 });
  });

  /* 3 — six things */
  add(3, (s) => {
    kicker(s, '1 · What it is');
    heading(s, 'Six things you can do', 30);
    const items = [
      ['Find a record', 'Search the iTunes catalogue by artist, title or genre.'],
      ['Add your copy', 'Choose the format, condition, price and notes.'],
      ['Build shelves', 'Keep as many collections as you like.'],
      ['Keep a wantlist', 'Track the records you are still hunting for.'],
      ['Share a shelf', 'Send a read-only link that opens without an account.'],
      ['Follow collectors', 'See activity, like and comment.'],
    ];
    items.forEach(([title, body], i) => {
      const col = i % 3, row = Math.floor(i / 3);
      card(s, 0.65 + col * 4.15, 1.95 + row * 2.0, 3.9, 1.72, title, body, {
        hi: i === 0, bodySize: 12.5, titleSize: 15,
      });
    });
    s.addText('Plus a listening journal, album stories, badges and a yearly recap.', {
      x: 0.85, y: 5.95, w: 11.6, h: 0.4, fontFace: BODY, fontSize: 12, color: C.muted, margin: 0,
    });
  });

  /* 4 — demo */
  add(4, (s) => {
    kicker(s, '2 · Demo');
    heading(s, "One record's journey", 30);
    s.addText("I'll follow one record from search to a shared shelf.", {
      x: 0.85, y: 1.8, w: 11.6, h: 0.35, fontFace: BODY, fontSize: 14, color: C.muted, margin: 0,
    });
    const phases = [
      ['1 · Start', 'Register\nHome dashboard'],
      ['2 · Find', 'Browse & search\nAlbum detail'],
      ['3 · Add & organise', 'Add to a shelf\nCopy details & stats\nShelf room, wantlist, journal'],
      ['4 · Share', 'Read-only link\nCommunity & Wrapped\nResize to phone'],
    ];
    phases.forEach(([title, body], i) => {
      card(s, 0.65 + i * 3.12, 2.35, 2.9, 3.1, title, body, {
        hi: i === 0, bodySize: 13, titleSize: 15,
      });
    });
    s.addText('The account was created minutes before this talk. Nothing on screen is hard-coded.', {
      x: 0.85, y: 5.75, w: 11.6, h: 0.4, fontFace: BODY, fontSize: 12, color: C.muted, margin: 0,
    });
  });

  /* 5 — how it works */
  add(5, (s) => {
    kicker(s, '3 · How it works');
    heading(s, 'Browser → our API → database', 30);
    const nodes = [
      ['CLIENT', 'The browser', 'React pages · Tailwind · motion', C.coral],
      ['API', 'Our Express API', 'checks input · applies the rules', C.coral],
      ['DATA', 'PostgreSQL 16', 'users · shelves · copies', C.sage],
      ['3RD PARTY', 'iTunes catalogue', 'metadata only · called by the API', C.gold],
    ];
    nodes.forEach(([tag, name, desc, colour], i) => {
      const y = 1.85 + i * 1.08;
      node(s, 0.75, y, 5.6, 0.78, tag, name, desc, colour);
      if (i < 3) arrow(s, 3.25, y + 0.79);
    });
    card(s, 6.85, 1.85, 5.7, 2.5, 'One job each',
      'The browser shows pages. The API checks what is allowed. The database stores the relationships.',
      { bodySize: 13.5 });
    card(s, 6.85, 4.6, 5.7, 1.85, 'One repo',
      'Client and API ship together: one install, one dev command, one deploy.',
      { bodySize: 13.5 });
  });

  /* 6 — shared catalogue, personal copy */
  add(6, (s) => {
    kicker(s, '3 · How it works');
    heading(s, 'Shared catalogue. Personal copy.', 30);
    const bx = 0.75, bw = 2.6, lw = 0.45;
    entity(s, bx, 1.9, bw, 1.5, 'users', 'id · username · email', true);
    s.addText('1 → many', { x: bx + bw, y: 2.4, w: lw, h: 0.5, fontFace: MONO, fontSize: 8.5, color: C.sage, align: 'center', margin: 0 });
    entity(s, bx + bw + lw, 1.9, bw, 1.5, 'collections', 'name · owner\nshare link');
    s.addText('1 → many', { x: bx + 2 * (bw + lw), y: 2.4, w: lw, h: 0.5, fontFace: MONO, fontSize: 8.5, color: C.sage, align: 'center', margin: 0 });
    entity(s, bx + 3 * (bw + lw) - lw, 1.9, bw, 1.5, 'collection_albums', 'format · condition\nprice · notes', true);
    s.addText('many → 1', { x: bx + 3 * (bw + lw), y: 2.4, w: lw, h: 0.5, fontFace: MONO, fontSize: 8.5, color: C.sage, align: 'center', margin: 0 });
    entity(s, bx + 4 * (bw + lw) - lw, 1.9, bw, 1.5, 'albums', 'title · artist · year');

    const y = 3.8, w = 3.75;
    card(s, 0.75, y, w, 2.25, 'Shared',
      'One albums row per record. Two people owning the same pressing do not duplicate it.',
      { hi: true, bodySize: 13 });
    card(s, 4.7, y, w, 2.25, 'Personal',
      'Format, condition, price and notes live on the link between your shelf and the record.',
      { bodySize: 13 });
    card(s, 8.65, y, w, 2.25, 'Why it matters',
      "Edit your copy without changing anyone else's. The database enforces the links.",
      { bodySize: 13 });
    s.addText('16 tables in total. The rest are wants, history, follows, likes, comments, stories and badges.', {
      x: 0.85, y: 6.35, w: 11.6, h: 0.3, fontFace: BODY, fontSize: 10.5, color: C.muted, margin: 0,
    });
  });

  /* 7 — design */
  add(7, (s) => {
    kicker(s, '4 · Design');
    heading(s, 'Same app, two shapes', 30);
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
    s.addText('A deliberate look: thick outlines, solid shadows, pill buttons and springy motion. The palette is one file, and every animation respects reduced motion.', {
      x: 0.85, y: 5.8, w: 11.6, h: 0.8, fontFace: BODY, fontSize: 12.5, color: C.muted, margin: 0,
    });
  });

  /* 8 — hosting */
  add(8, (s) => {
    kicker(s, '5 · Proof');
    heading(s, 'One container, one URL', 30);
    const nodes = [
      ['DOCKER', 'Built app + API', 'Vite build + Express', C.coral],
      ['RENDER', LIVE_URL, 'HTTPS · one service', C.coral],
      ['POSTGRES', 'Managed Postgres 16', 'data and sessions', C.sage],
    ];
    nodes.forEach(([tag, name, desc, colour], i) => {
      const y = 2.0 + i * 1.25;
      node(s, 0.75, y, 5.6, 0.85, tag, name, desc, colour);
      if (i < 2) arrow(s, 3.25, y + 0.86);
    });
    card(s, 6.85, 2.0, 5.7, 2.15, 'Why one service',
      'The pages and the API share one origin, so the login cookie just works and there is no CORS. One link to demo.',
      { bodySize: 13.5 });
    card(s, 6.85, 4.35, 5.7, 2.0, 'Safe redeploys',
      'Migrations run at container start and can be repeated. A split hosting option and a local Docker path are documented.',
      { bodySize: 13.5 });
  });

  /* 9 — proof */
  add(9, (s) => {
    kicker(s, '5 · Proof');
    heading(s, 'How I know it works', 30);
    card(s, 0.75, 2.1, 3.75, 3.7, '128 automated tests',
      'The real API runs against a real Postgres database: ownership, constraints and permissions are covered.',
      { hi: true, bodySize: 13 });
    card(s, 4.78, 2.1, 3.75, 3.7, 'The live site',
      'The production container builds, migrates, serves the app, handles deep links and logs in.',
      { bodySize: 13 });
    card(s, 8.81, 2.1, 3.75, 3.7, 'The demo data',
      'Two collectors, three shelves, a wantlist, a journal and a story. The app is never empty.',
      { bodySize: 13 });
    s.addText('The same client also runs as an Android app.', {
      x: 0.85, y: 6.1, w: 11.6, h: 0.3, fontFace: BODY, fontSize: 11, color: C.muted, margin: 0,
    });
  });

  /* 10 — reflection */
  add(10, (s) => {
    kicker(s, '6 · Reflection');
    heading(s, 'What worked, what didn’t', 30);
    const cols = [
      ['Worked', C.sage, [
        'Schema first, so every feature followed',
        'One feature per commit',
        'AI wrote code inside boundaries I set',
      ]],
      ['Didn’t', C.rose, [
        'Scope was too big',
        'The first UI looked generic',
        'Free hosting sleeps on demo day',
      ]],
      ['Learned', C.coral, [
        'A collection is a join table, not a list',
        'Real-database tests catch more',
        'Saying no is part of design',
      ]],
    ];
    cols.forEach(([title, colour, items], i) => {
      const x = 0.75 + i * 4.03;
      s.addShape(SHAPE.roundRect, { x, y: 2.05, w: 3.75, h: 3.95, fill: { color: C.card }, line: { color: i === 2 ? C.coral : C.line, width: i === 2 ? 1.5 : 1 } });
      s.addText(title, { x: x + 0.22, y: 2.23, w: 3.3, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: colour, margin: 0 });
      s.addText(
        items.map((t) => ({ text: '•  ' + t, options: { breakLine: true, paraSpaceAfter: 9 } })),
        { x: x + 0.22, y: 2.78, w: 3.3, h: 3.0, fontFace: BODY, fontSize: 13, color: C.muted, margin: 0, valign: 'top' },
      );
    });
  });

  /* 11 — questions */
  add(11, (s) => {
    kicker(s, '6 · Reflection');
    s.addText('Questions?', {
      x: 0.85, y: 1.5, w: 11.6, h: 1.2,
      fontFace: HEAD, fontSize: 54, bold: true, color: C.cream, margin: 0,
    });
    rule(s, 0.9, 2.78, 1.3);
    s.addText('Happy to go deeper on the data model,\nthe API, security or hosting.', {
      x: 0.9, y: 3.12, w: 10.8, h: 0.95, fontFace: BODY, fontSize: 19,
      color: C.muted, margin: 0, lineSpacingMultiple: 1.15,
    });
    const cols = [
      ['LIVE', LIVE_URL],
      ['REPO', 'github.com/josephgreville/trackstack-v2'],
      ['PLAIN ENGLISH', 'docs/plain-english.md'],
    ];
    cols.forEach(([label, value], i) => {
      const x = 0.9 + i * 4.0;
      s.addText(label, { x, y: 5.15, w: 3.6, h: 0.25, fontFace: MONO, fontSize: 10, color: C.muted, margin: 0 });
      s.addText(value, { x, y: 5.45, w: 3.6, h: 0.5, fontFace: BODY, fontSize: 13, bold: true, color: C.coral, margin: 0 });
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
