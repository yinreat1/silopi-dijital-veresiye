const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'));
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

assert.match(app, /import\('qrcode'\)/, 'QR generation must load only when the QR dialog is opened');
assert.doesNotMatch(app, /import QRCode from ['"]qrcode['"]/, 'QR library must not be part of the initial application import graph');
assert.match(app, /const currencyFormatter = new Intl\.NumberFormat/, 'Currency formatter must be created once and reused');
assert.doesNotMatch(css, /fonts\.googleapis\.com/, 'Initial rendering must not wait for a remote Google Fonts CSS import');
assert.match(worker, /silopi-veresiye-v9/, 'PWA shell cache must be versioned for this release');
assert.match(worker, /url\.pathname\.startsWith\('\/api\/'\)/, 'Private API responses must bypass the service-worker cache');
assert.match(worker, /NAVIGATION_TIMEOUT_MS = 2200/, 'PWA must fall back to the cached app shell on slow networks');
assert.match(worker, /Pre-cache the current Vite entry JS\/CSS/, 'PWA must pre-cache the current application entry assets during install');
assert.match(worker, /html\.matchAll/, 'PWA must discover the current hashed JS/CSS entry assets instead of hardcoding build hashes');
assert.match(worker, /url\.pathname\.startsWith\('\/assets\/'\)/, 'Hashed static assets must use the cache-first path');
assert.match(main, /updateViaCache: 'none'/, 'Installed clients must check for service-worker updates without stale HTTP cache');
assert.equal(manifest.display, 'standalone', 'PWA must retain standalone install mode');
assert.ok(manifest.icons.some((icon) => icon.src === '/icon-192.png'), 'PWA 192px icon must be retained');
assert.ok(manifest.icons.some((icon) => icon.src === '/icon-512.png'), 'PWA 512px icon must be retained');
assert.ok(vercel.headers.some((entry) => entry.source === '/assets/(.*)' && entry.headers.some((header) => header.key === 'Cache-Control' && header.value.includes('immutable'))), 'Vercel must serve hashed build assets with immutable caching');

console.log('PASS: Performance and PWA regression — lazy QR chunk, reused currency formatter, no render-blocking remote font, v9 offline app shell, API cache exclusion, immutable asset caching, and install metadata.');
