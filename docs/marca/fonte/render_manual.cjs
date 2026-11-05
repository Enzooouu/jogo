const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1123, height: 794 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + process.cwd() + '/manual.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
  console.log('font', await p.evaluate(() => document.fonts.check('italic 900 20px Barlow')));
  // páginas que transbordam
  console.log('overflow', await p.evaluate(() => [...document.querySelectorAll('.page')].map((pg, i) => { const c = pg.querySelector('.pc'); return c.scrollHeight > c.clientHeight + 2 ? `${i + 1}:${c.scrollHeight - c.clientHeight}` : null; }).filter(Boolean)));
  await p.pdf({ path: 'Manual-Identidade-Elementum.pdf', width: '297mm', height: '210mm', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  console.log(errs); await b.close();
})();
