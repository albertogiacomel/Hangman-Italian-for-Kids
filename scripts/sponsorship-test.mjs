import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { openBrowser, delay } from './game-kit-cdp.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifacts = join(root, 'artifacts', 'sponsorship');
await mkdir(artifacts, { recursive: true });
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' });
let markup;
try {
  const { AdBanner } = await server.ssrLoadModule('/components/AdBanner.tsx');
  const render = (language, message) => renderToStaticMarkup(React.createElement(AdBanner, { language, message }));
  const message = {
    reviewed: true,
    name: 'Fixture <script>alert(1)</script>',
    copy: { it: 'Testo di prova ' + 'x'.repeat(150), en: 'Test message <img src="https://example.invalid/pixel">' },
  };
  assert.equal(render('it', undefined), '', 'No configured sponsor means no empty banner');
  assert.equal(render('it', null), '');
  assert.equal(render('it', { ...message, reviewed: false }), '', 'Unreviewed messages stay hidden');
  assert.equal(render('it', { ...message, name: ' ' }), '');
  assert.equal(render('en', { ...message, copy: { it: 'Italian only', en: '' } }), '');
  markup = render('it', message);
  const english = render('en', message);
  assert.match(markup, /Messaggio pubblicitario/);
  assert.match(english, /Advertisement/);
  assert.match(markup, /&lt;script&gt;/);
  assert.match(english, /&lt;img/);
  assert.doesNotMatch(markup + english, /<(?:script|img|iframe|a)\b/i, 'Sponsor content cannot create embeds or outbound links');
} finally {
  await server.close();
}

const html = await readFile(join(root, 'dist', 'index.html'), 'utf8');
assert.doesNotMatch(html, /adsbygoogle|googlesyndication|ca-pub-/i, 'Production entry must not load the old ad network');
const page = await openBrowser(join(root, 'dist'), { entry: '/index.html', artifactsPath: artifacts, blockRemoteAI: true });
try {
  for (let i = 0; i < 200 && !await page.evaluate('Boolean(window.__gameKit)'); i++) await delay(25);
  assert.ok(await page.evaluate('Boolean(window.__gameKit)'));
  assert.equal(await page.evaluate('document.querySelectorAll("[data-sponsor-message],.adsbygoogle").length'), 0);
  assert.equal(await page.evaluate('performance.getEntriesByType("resource").some(e=>/googlesyndication|doubleclick|adsbygoogle/i.test(e.name))'), false);
  // Inject actual server-rendered component output; no fixture code is shipped.
  await page.evaluate(`document.querySelector('main').insertAdjacentHTML('beforeend',${JSON.stringify(markup)})`);
  const geometry = [];
  for (const theme of ['light', 'dark']) {
    await page.evaluate(`window.__gameKit.settings.update({theme:${JSON.stringify(theme)}})`);
    for (const width of [1280, 390, 320]) {
      await page.command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
      await delay(50);
      const result = await page.evaluate(`(()=>{const e=document.querySelector('[data-sponsor-message]');const r=e.getBoundingClientRect();const peer=e.previousElementSibling.getBoundingClientRect();return {x:r.x,width:r.width,peerX:peer.x,peerWidth:peer.width,overflow:e.scrollWidth>e.clientWidth,labelSize:parseFloat(getComputedStyle(e.firstElementChild).fontSize),textSize:parseFloat(getComputedStyle(e.lastElementChild).fontSize),embeds:e.querySelectorAll('script,img,iframe,a').length};})()`);
      assert.ok(Math.abs(result.width - result.peerWidth) <= 1 && Math.abs(result.x - result.peerX) <= 1, 'Sponsor aligns with native grid');
      assert.equal(result.overflow, false, 'Long sponsor text wraps on narrow screens');
      assert.ok(result.labelSize >= 14 && result.textSize >= 16);
      assert.equal(result.embeds, 0);
      geometry.push({ theme, viewport: width, ...result });
    }
  }
  assert.deepEqual(page.errors, []);
  const shot = await page.command('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(artifacts, 'sponsor-fixture-mobile.png'), Buffer.from(shot.data, 'base64'));
  await writeFile(join(artifacts, 'verification.json'), JSON.stringify({ checkedAt: new Date().toISOString(), status: 'PASS', fixtureOnly: true, defaultAdRequests: 0, geometry }, null, 2) + '\n', 'utf8');
  console.log('PASS sponsorship: disabled by default, review gate, escaped text, no ad-network requests, aligned light/dark layouts at 1280/390/320px');
} finally {
  await page.close();
}
