// Rigenera public/og.png (anteprima per WhatsApp/Facebook) da brand/og.html. Uso: node scripts/og.cjs
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('file://' + path.resolve('brand/og.html'));
  await p.waitForTimeout(300);
  await p.screenshot({ path: 'public/og.png' });
  await b.close();
})();
