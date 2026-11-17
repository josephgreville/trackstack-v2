/*
 * Build a printable submission pack from the Markdown deliverables.
 *
 *   node scripts/build-submission.cjs
 *
 * Produces submission/TrackStack-Submission.html, which is then printed to
 * PDF with Edge/Chrome. The PDF is what gets attached in Google Classroom.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'submission');

const DOCS = [
  { file: 'plain-english.md', title: 'TrackStack in plain English' },
  { file: 'brief.md', title: 'Project brief' },
  { file: 'architecture.md', title: 'Architecture' },
  { file: 'page-designs.md', title: 'Page designs' },
  { file: 'presentation.md', title: 'Presentation script and Q&A' },
  { file: 'hosting.md', title: 'Hosting plan and runbook' },
  { file: 'testing.md', title: 'Testing' },
];

const escapeHtml = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const DOC_ANCHORS = {
  'plain-english.md': '#plain-english',
  'brief.md': '#brief',
  'architecture.md': '#architecture',
  'page-designs.md': '#page-designs',
  'presentation.md': '#presentation',
  'hosting.md': '#hosting',
  'testing.md': '#testing',
};

function inline(text) {
  const codes = [];
  text = text.replace(/`([^`]+)`/g, (_m, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });

  text = escapeHtml(text);

  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt) => `<span class="muted">[image: ${alt}]</span>`);
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
    const clean = href.replace(/&amp;/g, '&');
    let target = clean;
    const docLink = clean.match(/^(?:\.\/)?([\w-]+\.md)(#.*)?$/);
    if (docLink) {
      target = docLink[2] || DOC_ANCHORS[docLink[1]] || '#';
    } else if (/presentation\/TrackStack-Presentation\.pptx$/.test(clean)) {
      target = 'TrackStack-Presentation.pptx';
    } else if (/presentation\/index\.html$/.test(clean)) {
      target = '#presentation';
    }
    return `<a href="${escapeHtml(target)}">${label}</a>`;
  });
  text = text.replace(/&lt;(https?:\/\/[^\s]+?)&gt;/g, (_m, url) => `<a href="${url}">${url}</a>`);

  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

  text = text.replace(/\u0000(\d+)\u0000/g, (_m, i) => `<code>${escapeHtml(codes[+i])}</code>`);
  return text;
}

function tableCells(line) {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim());
}

function markdownToHtml(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // fenced code
    if (/^\s*```/.test(line)) {
      const lang = line.replace(/^\s*```/, '').trim();
      const body = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push(
        `<pre${lang ? ` data-lang="${escapeHtml(lang)}"` : ''}><code>${escapeHtml(body.join('\n'))}</code></pre>`,
      );
      continue;
    }

    // headings
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      out.push(`<h${level} id="${slug(text)}">${inline(text)}</h${level}>`);
      i += 1;
      continue;
    }

    // horizontal rule
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push('<hr/>');
      i += 1;
      continue;
    }

    // blockquote
    if (/^\s*>/.test(line)) {
      const quote = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      out.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`);
      continue;
    }

    // table
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:-]+\|/.test(lines[i + 1])) {
      const header = tableCells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        rows.push(tableCells(lines[i]));
        i += 1;
      }
      out.push(
        `<table><thead><tr>${header.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table>`,
      );
      continue;
    }

    // lists
    const listMatch = line.match(/^\s*([-*]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1]);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^\s*([-*]|\d+\.)\s+(.*)$/);
        if (!m || /\d+\./.test(m[1]) !== ordered) break;
        let item = m[2];
        i += 1;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
          item += ` ${lines[i].trim()}`;
          i += 1;
        }
        items.push(`<li>${inline(item)}</li>`);
      }
      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
      continue;
    }

    // paragraph
    const para = [line.trim()];
    i += 1;
    while (i < lines.length) {
      const next = lines[i];
      if (
        !next.trim() ||
        /^\s*```/.test(next) ||
        /^(#{1,4})\s+/.test(next) ||
        /^\s*(-{3,}|\*{3,})\s*$/.test(next) ||
        /^\s*>/.test(next) ||
        /^\s*\|/.test(next) ||
        /^\s*([-*]|\d+\.)\s+/.test(next)
      ) {
        break;
      }
      para.push(next.trim());
      i += 1;
    }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }

  return out.join('\n');
}

const CSS = `
  :root {
    --ink: #242424;
    --muted: #6d6661;
    --coral: #d95735;
    --paper: #ffffff;
    --cream: #fbf8f4;
    --line: #e4ddd6;
  }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    font-family: "Segoe UI", Calibri, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: var(--ink);
    background: var(--paper);
  }
  .doc { padding: 0 0 8mm; }
  .doc + .doc { break-before: page; page-break-before: always; }
  .cover {
    min-height: 250mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 12mm 0 4mm;
    break-after: page;
    page-break-after: always;
  }
  .cover .kicker {
    font-size: 9pt;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: var(--coral);
    font-weight: 700;
  }
  .cover h1 {
    font-size: 38pt;
    line-height: 1.05;
    margin: 8mm 0 4mm;
    border: 0;
    padding: 0;
  }
  .cover .lede { font-size: 14pt; color: var(--muted); max-width: 150mm; }
  .cover .meta { margin-top: 12mm; font-size: 10.5pt; }
  .cover .meta td { border: 0; padding: 2.5mm 8mm 2.5mm 0; vertical-align: top; }
  .cover .meta td:first-child { color: var(--muted); width: 36mm; }
  .cover .contents {
    background: var(--cream);
    border: 1px solid var(--line);
    border-radius: 4mm;
    padding: 6mm 8mm;
    margin-top: 10mm;
  }
  .cover .contents h2 { margin: 0 0 3mm; border: 0; font-size: 13pt; }
  .cover .contents ol { margin: 0; padding-left: 5mm; }
  .cover .contents li { margin: 1.2mm 0; }
  h1, h2, h3, h4 { color: var(--ink); line-height: 1.2; }
  h1 {
    font-size: 24pt;
    margin: 0 0 6mm;
    padding-bottom: 3mm;
    border-bottom: 2px solid var(--coral);
  }
  h2 {
    font-size: 15.5pt;
    margin: 8mm 0 3mm;
    break-after: avoid;
    page-break-after: avoid;
  }
  h3 {
    font-size: 12pt;
    margin: 6mm 0 2mm;
    color: #3a3532;
    break-after: avoid;
    page-break-after: avoid;
  }
  h4 { font-size: 10.5pt; margin: 5mm 0 1.5mm; }
  p { margin: 0 0 3mm; }
  a { color: var(--coral); text-decoration: none; word-break: break-word; }
  strong { color: #1d1b1a; }
  hr { border: 0; border-top: 1px solid var(--line); margin: 6mm 0; }
  blockquote {
    margin: 3mm 0 4mm;
    padding: 3mm 5mm;
    background: #fff5f1;
    border-left: 4px solid var(--coral);
    color: #4a423d;
  }
  blockquote p:last-child { margin-bottom: 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 3mm 0 5mm;
    font-size: 9pt;
    break-inside: auto;
  }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th, td {
    border: 1px solid var(--line);
    padding: 2mm 2.4mm;
    text-align: left;
    vertical-align: top;
  }
  th { background: var(--cream); font-weight: 700; }
  code {
    font-family: Consolas, "Courier New", monospace;
    font-size: 8.8pt;
    background: #f2efeb;
    padding: .3mm 1.2mm;
    border-radius: 1mm;
  }
  pre {
    margin: 3mm 0 5mm;
    padding: 4mm 5mm;
    background: #f7f4f0;
    border-left: 4px solid #d9cfc5;
    border-radius: 0 2mm 2mm 0;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  pre code { background: none; padding: 0; font-size: 8.6pt; line-height: 1.45; }
  ul, ol { margin: 0 0 3.5mm; padding-left: 6mm; }
  li { margin: 1mm 0; }
  .muted { color: var(--muted); }
  @media print {
    @page { size: A4; margin: 15mm 15mm 17mm; }
    a { color: #b4492c; }
  }
`;

function cover() {
  const docsList = DOCS.map((d) => `<li>${d.title}</li>`).join('');
  return `
  <section class="cover">
    <div>
      <div class="kicker">Final Project · Vibe Coding Web App</div>
      <h1>TrackStack</h1>
      <p class="lede">A home for physical music collections. Browse a catalogue, build shelves,
      track every copy, and share the room.</p>
      <table class="meta">
        <tr><td>Author</td><td>Joseph Greville</td></tr>
        <tr><td>Route</td><td>Route B: records</td></tr>
        <tr><td>Repository</td><td><a href="https://github.com/josephgreville/trackstack-v2">github.com/josephgreville/trackstack-v2</a></td></tr>
        <tr><td>Live app</td><td><a href="https://trackstack-zin9.onrender.com">trackstack-zin9.onrender.com</a></td></tr>
        <tr><td>Demo login</td><td><code>joey@example.com</code> / <code>Password123!</code></td></tr>
      </table>
      <div class="contents">
        <h2>Contents</h2>
        <ol>${docsList}</ol>
      </div>
    </div>
    <p class="muted" style="margin:0;font-size:9pt">The app sleeps after 15 minutes idle on the free
    hosting tier. Allow ~30 seconds for the first request.</p>
  </section>`;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const sections = DOCS.map(({ file, title }, index) => {
    const md = fs.readFileSync(path.join(ROOT, 'docs', file), 'utf8');
    const body = markdownToHtml(md);
    return `<section class="doc" id="${path.basename(file, '.md')}"${index === 0 ? ' data-first="true"' : ''} data-title="${escapeHtml(title)}">
${body}
</section>`;
  });

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>TrackStack Submission Pack</title>
<style>${CSS}</style>
</head>
<body>
${cover()}
${sections.join('\n')}
</body>
</html>`;

  const target = path.join(OUT_DIR, 'TrackStack-Submission.html');
  fs.writeFileSync(target, html);
  console.log(`Wrote ${path.relative(ROOT, target)}`);
}

main();
