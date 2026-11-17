const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'docs', 'presentation', 'index.html'), 'utf8');
const override = `
<style>
  html, body { overflow: visible !important; height: auto !important; }
  body { padding: 24px 0 !important; }
  #stage { position: static !important; display: block !important; }
  .slide { display: flex !important; transform: none !important; margin: 24px auto !important; box-shadow: none !important; animation: none !important; }
  #chrome, #notes, #help, #progress { display: none !important; }
</style>
<script>
window.addEventListener('load', function () {
  setTimeout(function () {
    var report = [];
    document.querySelectorAll('.slide').forEach(function (s, i) {
      var sr = s.getBoundingClientRect(), issues = [];
      s.querySelectorAll('.content,.card,.step,.node,.stat,.callout,.compare-card,ul.clean,ul.tight,h2').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        var t = el.tagName.toLowerCase() + '.' + String(el.className).trim().replace(/\\s+/g, '.');
        if (r.bottom > sr.bottom - 60) issues.push('PAST FOOTER ' + t);
        if (el.scrollHeight > el.clientHeight + 3 && el.clientHeight > 0) issues.push('OVERFLOW Y ' + t);
        if (el.scrollWidth > el.clientWidth + 3 && el.clientWidth > 0) issues.push('OVERFLOW X ' + t + ' ' + el.scrollWidth + '>' + el.clientWidth);
      });
      s.querySelectorAll('.card p,.card h3,.step p,.step h3,.node .name,.node .desc,.stat .big,.compare-card p').forEach(function (el) {
        var r = el.getBoundingClientRect(), box = el.closest('.card,.step,.node,.stat,.compare-card');
        if (!box) return;
        var br = box.getBoundingClientRect();
        if (r.bottom > br.bottom - 1) issues.push('TEXT PAST BOX ' + (el.textContent || '').trim().slice(0, 24));
      });
      report.push({ slide: i + 1, issues: Array.from(new Set(issues)) });
    });
    var pre = document.createElement('pre');
    pre.id = 'report';
    pre.textContent = JSON.stringify(report);
    document.body.innerHTML = '';
    document.body.appendChild(pre);
  }, 1500);
});
</script>
`;
fs.writeFileSync(path.join(ROOT, 'submission', '_measure.html'), src.replace('</head>', override + '</head>'));
console.log('Wrote submission/_measure.html');
