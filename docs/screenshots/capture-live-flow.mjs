import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1400, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:5173/?tab=stream', { waitUntil: 'networkidle0' });

// shot 1: empty stream
await page.screenshot({ path: 'docs/screenshots/10-stream-empty.png' });
console.log('shot empty');

// click the Iceland demo prompt
await page.waitForSelector('.demo-prompt-btn');
const buttons = await page.$$('.demo-prompt-btn');
await buttons[0].click();
console.log('clicked Iceland prompt');

// wait for the offer to appear
await page.waitForSelector('.veritype-offer .btn.primary', { timeout: 8000 });
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: 'docs/screenshots/11-stream-offer.png' });
console.log('shot offer');

// click verify
await page.click('.veritype-offer .btn.primary');
console.log('clicked verify');

// wait for working spinner
await page.waitForSelector('.working-card', { timeout: 5000 });
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: 'docs/screenshots/12-stream-working.png' });
console.log('shot working');

// wait for verdict card to appear (fixture mode: ~1.8s wait)
await page.waitForSelector('.veritype-card', { timeout: 15000 });
await new Promise((r) => setTimeout(r, 800));
await page.evaluate(() => {
  const el = document.querySelector('.main-scroll');
  if (el) el.scrollTop = el.scrollHeight;
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: 'docs/screenshots/13-stream-verdict.png' });
console.log('shot verdict');

await browser.close();
console.log('done');
