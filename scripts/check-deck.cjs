const fs = require('fs');
const h = fs.readFileSync('docs/presentation/index.html', 'utf8');
const count = (re) => (h.match(re) || []).length;
console.log('slide sections :', count(/<section class="slide/g));
console.log('section close  :', count(/<\/section>/g));
console.log('notes entries  :', count(/^\s+`\d:\d\d —/gm));
console.log('pagenum stamps  :', count(/class="pagenum"/g));
console.log('div balance    :', count(/<div\b/g), 'vs', count(/<\/div>/g));
console.log('script blocks  :', count(/<script/g), 'vs', count(/<\/script>/g));
