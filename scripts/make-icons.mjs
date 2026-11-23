// Renders public/icons/icon.svg to the PNG sizes the PWA manifest and iOS need.
// Usage: node scripts/make-icons.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public/icons/icon.svg'), 'utf8');
const sizes = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180]
];

const browser = await chromium.launch();
for (const [name, size] of sizes) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: join(root, 'public/icons', name) });
  await page.close();
}
await browser.close();
console.log('icons written');
