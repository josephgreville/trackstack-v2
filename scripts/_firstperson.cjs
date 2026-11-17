const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function edit(rel, pairs) {
  const file = path.join(ROOT, rel);
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    const re = new RegExp(esc(from).replace(/\n/g, '\\r?\\n'), 'g');
    if (!re.test(text)) throw new Error(`${rel}: not found: ${from.slice(0, 80)}`);
    re.lastIndex = 0;
    text = text.replace(re, to);
  }
  const left = text.match(/\b(we|our|us)\b/gi) || [];
  if (left.length) throw new Error(`${rel}: still has ${left.length} first-person plural word(s): ${left.join(', ')}`);
  fs.writeFileSync(file, text);
  console.log(`${rel}: ${pairs.length} replacement(s), no we/our/us left`);
}

edit('docs/architecture.md', [
  ['the risks we know about.', 'the risks I know about.'],
  ['pattern we need.', 'pattern I need.'],
  ['and we have follows, likes, comments and stories. Postgres gives us real foreign keys,', 'and the model includes follows, likes, comments and stories. Postgres gives me real foreign keys,'],
  ['the ecosystem we know well.', 'the ecosystem I know well.'],
  ['> people own the same pressing we do not duplicate the album row. We insert two rows into', '> people own the same pressing, I do not duplicate the album row. I insert two rows into'],
  ['proxied and cached by our API)', 'proxied and cached by my API)'],
  ['| Concern | What we did |', '| Concern | What I did |'],
  ['## 8. Risks and how we would handle them', '## 8. Risks and how I would handle them'],
  ['## 9. Trade-offs we accepted', '## 9. Trade-offs I accepted'],
  ['a data model we can explain.', 'a data model I can explain.'],
]);

edit('docs/plain-english.md', [
  ['"The browser talks to our API, the API talks to the database, and iTunes only', '"The browser talks to the API I built, the API talks to the database, and iTunes only'],
]);

edit('docs/presentation.md', [
  ['| **5 · Browser → our API → database** | How it works | 2:20–2:55 | 2:55 |', '| **5 · Browser → the API I built → database** | How it works | 2:20–2:55 | 2:55 |'],
  ['"Browse searches the iTunes catalogue through *our* API, not Apple directly."', '"Browse searches the iTunes catalogue through the API I built, not Apple directly."'],
  ['**Say:** "The browser talks to our API; the API talks to Postgres.', '**Say:** "The browser talks to the API I built; the API talks to Postgres.'],
]);

edit('docs/presentation/index.html', [
  ['<h2>Browser → our API → database</h2>', '<h2>Browser → the API I built → database</h2>'],
  ['<span class="name">Our Express API</span>', '<span class="name">The API I built</span>'],
  ['<p>iTunes supplies album information only. Our API calls it. The browser never does.</p>', '<p>iTunes supplies album information only. The API I built calls it. The browser never does.</p>'],
  ['The browser talks to our API; the API talks to Postgres.', 'The browser talks to the API I built; the API talks to Postgres.'],
]);

edit('scripts/build-pptx.cjs', [
  ["heading(s, 'Browser → our API → database');", "heading(s, 'Browser → the API I built → database');"],
  ["'API', 'Our Express API', 'Checks every request and applies the rules'", "'API', 'The API I built', 'Checks every request and applies the rules'"],
  ["'iTunes supplies album information only. Our API calls it. The browser never does.'", "'iTunes supplies album information only. The API I built calls it. The browser never does.'"],
]);

console.log('Done.');
