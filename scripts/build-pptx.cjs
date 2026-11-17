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
const TOTAL = 12;

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

const M = 0.75;          // left margin
const CW = 11.83;        // content width (13.33 - 1.5)
const TOP = 2.5;         // content top

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
  if (notes.length !== TOTAL) {
    throw new Error(`Expected ${TOTAL} speaker notes, found ${notes.length}`);
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
    x: M, y: 7.06, w: 6, h: 0.26,
    fontFace: MONO, fontSize: 9, color: '6F6862', margin: 0,
  });
  slide.addText(`${String(n).padStart(2, '0')} / ${TOTAL}`, {
    x: 11.2, y: 7.06, w: 1.35, h: 0.26,
    fontFace: MONO, fontSize: 9, color: C.coral, align: 'right', margin: 0,
  });
}

function kicker(slide, text) {
  const w = Math.max(1.9, text.length * 0.092 + 0.55);
  slide.addShape(SHAPE.roundRect, {
    x: M, y: 0.42, w, h: 0.32,
    fill: { color: C.paper }, line: { color: C.coral, width: 1 },
  });
  slide.addText(text.toUpperCase(), {
    x: M + 0.14, y: 0.47, w: w - 0.2, h: 0.22,
    fontFace: MONO, fontSize: 8.5, color: C.coral, charSpacing: 1.2, margin: 0,
  });
}

function heading(slide, text, size = 30) {
  slide.addText(text, {
    x: M, y: 0.9, w: CW, h: 0.8,
    fontFace: HEAD, fontSize: size, bold: true, color: C.cream,
    margin: 0, valign: 'mid',
  });
}

function subtitle(slide, text, size = 13.5) {
  slide.addText(text, {
    x: M, y: 1.76, w: CW - 0.4, h: 0.5,
    fontFace: BODY, fontSize: size, color: C.muted,
    margin: 0, valign: 'top', lineSpacingMultiple: 1.15,
  });
}

function card(slide, x, y, w, h, title, body, opts = {}) {
  slide.addShape(SHAPE.roundRect, {
    x, y, w, h,
    fill: { color: opts.fill || C.card },
    line: { color: opts.hi ? C.coral : C.line, width: opts.hi ? 1.5 : 1 },
  });
  if (title) {
    slide.addText(title, {
      x: x + 0.22, y: y + 0.15, w: w - 0.44, h: 0.36,
      fontFace: HEAD, fontSize: opts.titleSize || 15, bold: true,
      color: opts.titleColor || C.cream, margin: 0,
    });
  }
  if (body) {
    slide.addText(body, {
      x: x + 0.22, y: y + (title ? 0.58 : 0.2), w: w - 0.44,
      h: h - (title ? 0.72 : 0.4),
      fontFace: BODY, fontSize: opts.bodySize || 12, color: opts.bodyColor || C.muted,
      margin: 0, valign: 'top', lineSpacingMultiple: 1.14,
    });
  }
}

function bullets(slide, x, y, w, h, items, size = 16, colour = C.cream) {
  slide.addText(
    items.map((t) => ({ text: t, options: { bullet: true, breakLine: true, paraSpaceAfter: 7 } })),
    {
      x, y, w, h, fontFace: BODY, fontSize: size, color: colour,
      margin: 0, valign: 'top', lineSpacingMultiple: 1.1,
    },
  );
}

function node(slide, x, y, w, h, tag, name, desc, tagColor) {
  slide.addShape(SHAPE.roundRect, {
    x, y, w, h, fill: { color: C.card }, line: { color: C.line, width: 1 },
  });
  slide.addShape(SHAPE.roundRect, {
    x: x + 0.18, y: y + (h - 0.3) / 2, w: 1.0, h: 0.3,
    fill: { color: tagColor }, line: { color: tagColor },
  });
  slide.addText(tag, {
    x: x + 0.2, y: y + (h - 0.3) / 2 + 0.055, w: 0.96, h: 0.2,
    fontFace: MONO, fontSize: 7.5, bold: true,
    color: tagColor === C.gold || tagColor === C.sage ? C.dark : C.cream,
    align: 'center', margin: 0,
  });
  slide.addText(name, {
    x: x + 1.35, y: y + 0.11, w: w - 1.5, h: 0.34,
    fontFace: HEAD, fontSize: 15, bold: true, color: C.cream, margin: 0,
  });
  slide.addText(desc, {
    x: x + 1.35, y: y + 0.45, w: w - 1.5, h: 0.28,
    fontFace: BODY, fontSize: 10.5, color: C.muted, margin: 0,
  });
}

function arrow(slide, cx, y) {
  slide.addText('↓', {
    x: cx - 0.18, y, w: 0.36, h: 0.2, fontFace: MONO, fontSize: 12,
    color: C.coral, align: 'center', margin: 0,
  });
}

function rule(slide, x, y, w = 1.3) {
  slide.addShape(SHAPE.rect, {
    x, y, w, h: 0.045, fill: { color: C.coral }, line: { color: C.coral },
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
  pptx.subject = 'Route B final project: a web app for sharing record collections';
  pptx.title = 'TrackStack: Final Project Presentation';
  pptx.lang = 'en-GB';
  pptx.theme = { headFontFace: HEAD, bodyFontFace: BODY, lang: 'en-GB' };

  const add = (n, fn) => {
    const s = pptx.addSlide();
    chrome(s, n);
    fn(s);
    s.addNotes(notes[n - 1]);
    return s;
  };

  /* 1 · title */
  add(1, (s) => {
    kicker(s, 'Final Project · Route B: records');
    s.addText('TrackStack', {
      x: 0.85, y: 1.25, w: 11.6, h: 1.1,
      fontFace: HEAD, fontSize: 54, bold: true, color: C.cream, margin: 0,
    });
    rule(s, 0.9, 2.52, 1.3);
    s.addText('A home for your record collection.\nFind a record, add your copy, organise a shelf, share it.', {
      x: 0.9, y: 2.82, w: 10.8, h: 0.95,
      fontFace: BODY, fontSize: 18, color: C.muted, margin: 0, lineSpacingMultiple: 1.18,
    });
    s.addText('WHAT THIS TALK COVERS', {
      x: 0.9, y: 4.5, w: 11, h: 0.28, fontFace: MONO, fontSize: 9.5, color: C.muted, margin: 0,
    });
    s.addText('Idea  →  Demo  →  How it works  →  Design  →  Proof  →  Reflection', {
      x: 0.9, y: 4.82, w: 11.8, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: C.coral, margin: 0,
    });
  });

  /* 2 · the idea */
  add(2, (s) => {
    kicker(s, '1 · The idea: what it is');
    heading(s, 'One album. Many collections. Your copy.');
    subtitle(s, 'The album is shared. The physical record on your shelf is personal.');
    bullets(s, M, 2.55, 6.3, 3.7, [
      'A record lives in a shared catalogue.',
      'Your copy has its own format, condition and price.',
      'A collection is a shelf you can share.',
      'The brief offers Route A or B. I chose records.',
    ], 16);
    card(s, 7.35, 2.5, 5.2, 3.7, 'The interesting part',
      'One album can sit in many collections, but your copy is personal. Its condition and price belong to you, not to the album. That is the relationship this app is built around.',
      { hi: true, bodySize: 13 });
  });

  /* 3 · six things */
  add(3, (s) => {
    kicker(s, '1 · The idea: what you can do');
    heading(s, 'Six things you can do');
    subtitle(s, 'Find it, keep it, organise it, share it, and follow other collectors.');
    const items = [
      ['1 · Find a record', 'Search the iTunes catalogue by artist, title or genre.'],
      ['2 · Add your copy', 'Choose the format, condition, price and notes.'],
      ['3 · Build shelves', 'Keep as many collections as you like.'],
      ['4 · Keep a wantlist', 'Track the records you are still hunting for.'],
      ['5 · Share a shelf', 'Send a read-only link that opens without an account.'],
      ['6 · Follow collectors', 'See activity, like and comment.'],
    ];
    const cw = 3.75, ch = 1.55, gap = 0.25;
    items.forEach(([title, body], i) => {
      const col = i % 3, row = Math.floor(i / 3);
      card(s, M + col * (cw + gap), TOP + row * (ch + 0.18), cw, ch, title, body, {
        hi: i === 0, titleSize: 14, bodySize: 11.5,
      });
    });
  });

  /* 4 · demo */
  add(4, (s) => {
    kicker(s, '2 · Demo: what I will show you');
    heading(s, "The demo: one record's journey");
    subtitle(s, 'From a search to a shared shelf in about ninety seconds.');
    const steps = [
      ['STEP 1', 'Start', 'Register, then land on the home dashboard.'],
      ['STEP 2', 'Find', 'Browse and search. Open the album detail page.'],
      ['STEP 3', 'Add & organise', 'Add the copy, then show the shelf, stats and wantlist.'],
      ['STEP 4', 'Share', 'Open the read-only link, then resize to phone width.'],
    ];
    const cw = 2.77, gap = 0.25;
    steps.forEach(([num, title, body], i) => {
      const x = M + i * (cw + gap);
      const y = TOP;
      s.addShape(SHAPE.roundRect, {
        x, y, w: cw, h: 2.75,
        fill: { color: i === 0 ? '3A2A24' : C.card },
        line: { color: i === 0 ? C.coral : C.line, width: i === 0 ? 1.4 : 1 },
      });
      s.addText(num, {
        x: x + 0.16, y: y + 0.16, w: cw - 0.32, h: 0.22,
        fontFace: MONO, fontSize: 8, color: C.coral, charSpacing: 1, margin: 0,
      });
      s.addText(title, {
        x: x + 0.16, y: y + 0.46, w: cw - 0.32, h: 0.34,
        fontFace: HEAD, fontSize: 14, bold: true, color: C.cream, margin: 0,
      });
      s.addText(body, {
        x: x + 0.16, y: y + 0.86, w: cw - 0.32, h: 1.35,
        fontFace: BODY, fontSize: 11, color: C.muted, margin: 0, valign: 'top', lineSpacingMultiple: 1.15,
      });
      s.addText('→ app', {
        x: x + 0.16, y: y + 2.34, w: cw - 0.32, h: 0.24,
        fontFace: MONO, fontSize: 9, color: C.sage, margin: 0,
      });
    });
    s.addText('The account was created minutes before this talk. Nothing on screen is hard-coded.', {
      x: M, y: 5.62, w: CW, h: 0.3, fontFace: BODY, fontSize: 11.5, color: C.muted, margin: 0,
    });
  });

  /* 5 · how it works */
  add(5, (s) => {
    kicker(s, '3 · How it works: the three layers');
    heading(s, 'Browser → the API I built → database');
    subtitle(s, 'Each layer has one job. The browser never talks to the database directly.');
    const nx = M, nw = 6.35, nh = 0.92;
    node(s, nx, 2.5, nw, nh, 'CLIENT', 'The browser', 'React pages, showing what you see', C.coral);
    arrow(s, nx + nw / 2, 3.44);
    node(s, nx, 3.66, nw, nh, 'API', 'The API I built', 'Checks every request and applies the rules', C.coral);
    arrow(s, nx + nw / 2, 4.6);
    node(s, nx, 4.82, nw, nh, 'DATA', 'PostgreSQL 16', 'Stores users, shelves and copies', C.sage);
    card(s, 7.5, 2.5, 5.08, 1.55, 'Where iTunes fits',
      'iTunes supplies album information only. The API I built calls it. The browser never does.', { bodySize: 12.5 });
    card(s, 7.5, 4.25, 5.08, 1.5, 'One repo',
      'Client and API ship together: one install, one dev command, one deploy.', { bodySize: 12.5 });
  });

  /* 6 · core functions */
  add(6, (s) => {
    kicker(s, '3 · How it works: core functions');
    heading(s, 'Four jobs, one path');
    subtitle(s, 'React shows it. The API I built checks it. Postgres keeps it. iTunes supplies the catalogue.', 12.5);
    const items = [
      ['Find a record', 'React → API → iTunes', 'Catalogue data only. The browser never calls Apple.'],
      ['Save your copy', 'React → API → Postgres', 'The album is stored once. Your copy sits on the join table.'],
      ['Build and share shelves', 'React → API → Postgres', 'Ownership is checked before a private shelf opens or a public link is shared.'],
      ['Follow collectors', 'React → API → Postgres', 'Follows, likes and comments are stored as relationships, not copies.'],
    ];
    const cw = 5.75, ch = 1.55, gap = 0.25, rowGap = 0.18;
    items.forEach(([title, flow, body], i) => {
      const x = M + (i % 2) * (cw + gap);
      const y = TOP + Math.floor(i / 2) * (ch + rowGap);
      card(s, x, y, cw, ch, title, `${flow}\n${body}`, {
        hi: i === 0, titleSize: 14, bodySize: 11.5,
      });
    });
  });

  /* 7 · the key idea */
  add(7, (s) => {
    kicker(s, '3 · How it works: the one idea that matters');
    heading(s, 'Shared album. Personal copy.');
    subtitle(s, "Store the album once. Store each person's copy separately.");
    const cw = 5.05, gap = 0.2, mid = 1.33;
    const lx = M, rx = M + cw + gap + mid + gap;
    // left card
    s.addShape(SHAPE.roundRect, { x: lx, y: TOP, w: cw, h: 3.2, fill: { color: C.card }, line: { color: C.coral, width: 1.5 } });
    s.addText('SHARED', { x: lx + 0.24, y: TOP + 0.2, w: 2, h: 0.24, fontFace: MONO, fontSize: 8.5, color: C.coral, charSpacing: 1.4, margin: 0 });
    s.addText('The album', { x: lx + 0.24, y: TOP + 0.46, w: cw - 0.48, h: 0.36, fontFace: HEAD, fontSize: 16, bold: true, color: C.cream, margin: 0 });
    s.addText('title · artist · year', { x: lx + 0.24, y: TOP + 0.9, w: cw - 0.48, h: 0.3, fontFace: MONO, fontSize: 12, color: C.cream, margin: 0 });
    s.addText('One row per record. Everyone sees the same album, so the catalogue is never duplicated.', {
      x: lx + 0.24, y: TOP + 1.35, w: cw - 0.48, h: 1.55, fontFace: BODY, fontSize: 12, color: C.muted, margin: 0, valign: 'top', lineSpacingMultiple: 1.15,
    });
    // middle
    s.addText('↔', { x: lx + cw + gap, y: TOP + 1.05, w: mid, h: 0.5, fontFace: BODY, fontSize: 26, color: C.coral, align: 'center', margin: 0 });
    s.addText('linked by\ncollection_albums', {
      x: lx + cw + gap, y: TOP + 1.55, w: mid, h: 0.6,
      fontFace: MONO, fontSize: 8.5, color: C.sage, align: 'center', margin: 0, lineSpacingMultiple: 1.2,
    });
    // right card
    s.addShape(SHAPE.roundRect, { x: rx, y: TOP, w: cw, h: 3.2, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addText('PERSONAL', { x: rx + 0.24, y: TOP + 0.2, w: 2, h: 0.24, fontFace: MONO, fontSize: 8.5, color: C.sage, charSpacing: 1.4, margin: 0 });
    s.addText('Your copy', { x: rx + 0.24, y: TOP + 0.46, w: cw - 0.48, h: 0.36, fontFace: HEAD, fontSize: 16, bold: true, color: C.cream, margin: 0 });
    s.addText('format · condition · price · notes', { x: rx + 0.24, y: TOP + 0.9, w: cw - 0.48, h: 0.3, fontFace: MONO, fontSize: 11, color: C.cream, margin: 0 });
    s.addText('One row per shelf. Only you can change it, and only you see your condition and price.', {
      x: rx + 0.24, y: TOP + 1.35, w: cw - 0.48, h: 1.55, fontFace: BODY, fontSize: 12, color: C.muted, margin: 0, valign: 'top', lineSpacingMultiple: 1.15,
    });
    // callout
    s.addShape(SHAPE.rect, { x: M, y: 5.95, w: 0.06, h: 0.58, fill: { color: C.coral }, line: { color: C.coral } });
    s.addShape(SHAPE.rect, { x: M + 0.06, y: 5.95, w: CW - 0.06, h: 0.58, fill: { color: '2E2624' }, line: { color: '2E2624' } });
    s.addText("Editing your copy never changes anyone else's album. The database enforces the link.", {
      x: M + 0.24, y: 6.08, w: CW - 0.45, h: 0.32, fontFace: BODY, fontSize: 12.5, color: C.cream, margin: 0,
    });
  });

  /* 8 · design */
  add(8, (s) => {
    kicker(s, '4 · Design: one app, two screens');
    heading(s, 'Same app, two shapes');
    subtitle(s, 'One set of components. The navigation moves to where your thumb can reach.');
    const cw = 5.75, ch = 3.55;
    // desktop card
    const dx = M;
    s.addShape(SHAPE.roundRect, { x: dx, y: TOP, w: cw, h: ch, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addText('Desktop', { x: dx + 0.22, y: TOP + 0.15, w: cw - 0.44, h: 0.32, fontFace: HEAD, fontSize: 15, bold: true, color: C.cream, margin: 0 });
    s.addShape(SHAPE.roundRect, { x: dx + 0.24, y: TOP + 0.62, w: 0.95, h: 1.55, fill: { color: C.card2 }, line: { color: C.line } });
    for (let i = 0; i < 5; i++) {
      s.addShape(SHAPE.roundRect, {
        x: dx + 0.38, y: TOP + 0.8 + i * 0.26, w: 0.66, h: 0.09,
        fill: { color: i === 0 ? C.coral : C.line }, line: { color: i === 0 ? C.coral : C.line },
      });
    }
    s.addShape(SHAPE.roundRect, { x: dx + 1.35, y: TOP + 0.62, w: 4.15, h: 1.55, fill: { color: C.card2 }, line: { color: C.line } });
    for (let i = 0; i < 3; i++) {
      s.addShape(SHAPE.roundRect, { x: dx + 1.52 + i * 1.28, y: TOP + 0.8, w: 1.15, h: 0.36, fill: { color: '47322B' }, line: { color: C.coral, width: 0.75 } });
    }
    s.addShape(SHAPE.roundRect, { x: dx + 1.52, y: TOP + 1.3, w: 3.95, h: 0.7, fill: { color: '47322B' }, line: { color: C.coral, width: 0.75 } });
    s.addText('A left rail with five tabs and multi-column grids.', {
      x: dx + 0.22, y: TOP + 2.35, w: cw - 0.44, h: 0.6, fontFace: BODY, fontSize: 12.5, color: C.muted, margin: 0, valign: 'top',
    });
    // mobile card
    const mx = M + cw + 0.33;
    s.addShape(SHAPE.roundRect, { x: mx, y: TOP, w: cw, h: ch, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addText('Mobile', { x: mx + 0.22, y: TOP + 0.15, w: cw - 0.44, h: 0.32, fontFace: HEAD, fontSize: 15, bold: true, color: C.cream, margin: 0 });
    s.addShape(SHAPE.roundRect, { x: mx + 0.24, y: TOP + 0.62, w: 1.25, h: 1.55, fill: { color: C.card2 }, line: { color: C.line } });
    s.addShape(SHAPE.roundRect, { x: mx + 0.36, y: TOP + 0.78, w: 1.0, h: 0.4, fill: { color: '47322B' }, line: { color: C.coral, width: 0.75 } });
    s.addShape(SHAPE.roundRect, { x: mx + 0.36, y: TOP + 1.28, w: 1.0, h: 0.5, fill: { color: '47322B' }, line: { color: C.coral, width: 0.75 } });
    s.addShape(SHAPE.roundRect, { x: mx + 0.36, y: TOP + 1.86, w: 1.0, h: 0.2, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText('HOME · STACKS', { x: mx + 0.36, y: TOP + 1.89, w: 1.0, h: 0.15, fontFace: HEAD, fontSize: 6.5, bold: true, color: C.dark, align: 'center', margin: 0 });
    s.addText('Same five tabs', { x: mx + 1.7, y: TOP + 0.72, w: cw - 1.95, h: 0.3, fontFace: HEAD, fontSize: 13, bold: true, color: C.cream, margin: 0 });
    s.addText('The tabs move to a floating bottom dock, within thumb reach.', {
      x: mx + 1.7, y: TOP + 1.1, w: cw - 1.95, h: 0.8, fontFace: BODY, fontSize: 11.5, color: C.muted, margin: 0, valign: 'top',
    });
    s.addText('The same pages, stacked into a single column.', {
      x: mx + 0.22, y: TOP + 2.35, w: cw - 0.44, h: 0.6, fontFace: BODY, fontSize: 12.5, color: C.muted, margin: 0, valign: 'top',
    });
    s.addText('Thick outlines, solid shadows, pill buttons and springy motion, and every animation respects reduced motion.', {
      x: M, y: 6.18, w: CW, h: 0.34, fontFace: BODY, fontSize: 11, color: C.muted, margin: 0,
    });
  });

  /* 9 · hosting */
  add(9, (s) => {
    kicker(s, '5 · Proof: where it runs');
    heading(s, 'One container, one URL');
    subtitle(s, 'The pages and the API share one address, so login just works.');
    const nx = M, nw = 6.35, nh = 0.92;
    node(s, nx, 2.5, nw, nh, 'DOCKER', 'One image', 'The built client and the Express API', C.coral);
    arrow(s, nx + nw / 2, 3.44);
    node(s, nx, 3.66, nw, nh, 'RENDER', 'One service', `${LIVE_URL} · HTTPS`, C.coral);
    arrow(s, nx + nw / 2, 4.6);
    node(s, nx, 4.82, nw, nh, 'POSTGRES', 'Managed database', 'Postgres 16 (data and sessions)', C.sage);
    card(s, 7.5, 2.5, 5.08, 1.55, 'Why one URL',
      'The pages and the API share one origin, so the login cookie works and there is no CORS. One link to demo.', { bodySize: 12.5 });
    card(s, 7.5, 4.25, 5.08, 1.5, 'Safe redeploys',
      'Migrations run at container start and can be repeated. A split hosting option and a local Docker path are documented.', { bodySize: 12.5 });
  });

  /* 10 · proof */
  add(10, (s) => {
    kicker(s, '5 · Proof: how I know it works');
    heading(s, 'Proof: it works');
    subtitle(s, 'Tests, a live deployment, and demo data that makes the app feel real.');
    const stats = [
      ['128', 'automated tests', 'The real API against a real Postgres database: ownership, constraints and permissions.'],
      ['1', 'live URL', 'The production container builds, migrates, serves the app, handles deep links and logs in.'],
      ['3', 'seeded shelves', 'Two collectors, a wantlist, a journal and a story, so the app is never empty.'],
    ];
    const cw = 3.75, gap = 0.25;
    stats.forEach(([big, title, body], i) => {
      const x = M + i * (cw + gap);
      s.addShape(SHAPE.roundRect, {
        x, y: TOP, w: cw, h: 3.35,
        fill: { color: C.card },
        line: { color: i === 0 ? C.coral : C.line, width: i === 0 ? 1.5 : 1 },
      });
      s.addText(big, {
        x: x + 0.24, y: TOP + 0.25, w: cw - 0.48, h: 0.9,
        fontFace: HEAD, fontSize: 46, bold: true, color: C.coral, margin: 0,
      });
      s.addText(title, {
        x: x + 0.24, y: TOP + 1.2, w: cw - 0.48, h: 0.32,
        fontFace: HEAD, fontSize: 15, bold: true, color: C.cream, margin: 0,
      });
      s.addText(body, {
        x: x + 0.24, y: TOP + 1.62, w: cw - 0.48, h: 1.55,
        fontFace: BODY, fontSize: 12, color: C.muted, margin: 0, valign: 'top', lineSpacingMultiple: 1.15,
      });
    });
    s.addText('The same client also runs as an Android app.', {
      x: M, y: 6.12, w: CW, h: 0.28, fontFace: BODY, fontSize: 11, color: C.muted, margin: 0,
    });
  });

  /* 11 · reflection */
  add(11, (s) => {
    kicker(s, '6 · Reflection: what I learned');
    heading(s, "What worked, what didn't");
    subtitle(s, "Three things I'd keep, three I'd change, and three lessons.");
    const cols = [
      ['Worked', C.sage, ['Schema first, so every feature followed', 'One feature per commit', 'AI wrote code inside boundaries I set'], false],
      ['Didn’t', C.rose, ['Scope was too big', 'The first UI looked generic', 'Free hosting sleeps on demo day'], false],
      ['Learned', C.coral, ['A collection is a join table, not a list', 'Real-database tests catch more', 'Saying no is part of design'], true],
    ];
    const cw = 3.75, gap = 0.25;
    cols.forEach(([title, colour, items, hi], i) => {
      const x = M + i * (cw + gap);
      s.addShape(SHAPE.roundRect, {
        x, y: TOP, w: cw, h: 3.35,
        fill: { color: C.card },
        line: { color: hi ? C.coral : C.line, width: hi ? 1.5 : 1 },
      });
      s.addText(title, {
        x: x + 0.24, y: TOP + 0.2, w: cw - 0.48, h: 0.35,
        fontFace: HEAD, fontSize: 16, bold: true, color: colour, margin: 0,
      });
      bullets(s, x + 0.24, TOP + 0.72, cw - 0.48, 2.4, items, 12.5, C.muted);
    });
  });

  /* 12 · questions */
  add(12, (s) => {
    kicker(s, '6 · Reflection: over to you');
    s.addText('Questions?', {
      x: 0.85, y: 1.45, w: 11.6, h: 1.1,
      fontFace: HEAD, fontSize: 54, bold: true, color: C.cream, margin: 0,
    });
    rule(s, 0.9, 2.72, 1.3);
    s.addText('Happy to go deeper on the data model,\nthe API, security or hosting.', {
      x: 0.9, y: 3.05, w: 10.8, h: 0.95,
      fontFace: BODY, fontSize: 18, color: C.muted, margin: 0, lineSpacingMultiple: 1.18,
    });
    const cols = [
      ['LIVE', LIVE_URL],
      ['REPO', 'github.com/josephgreville/trackstack-v2'],
      ['PLAIN ENGLISH', 'docs/plain-english.md'],
    ];
    cols.forEach(([label, value], i) => {
      const x = 0.9 + i * 4.0;
      s.addText(label, { x, y: 5.15, w: 3.7, h: 0.24, fontFace: MONO, fontSize: 8.5, color: C.muted, charSpacing: 1, margin: 0 });
      s.addText(value, { x, y: 5.45, w: 3.7, h: 0.5, fontFace: BODY, fontSize: 12, bold: true, color: C.coral, margin: 0 });
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
