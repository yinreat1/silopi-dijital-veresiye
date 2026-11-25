# SilopiDijital Veresiye 0.3.0

## Vercel build fix
- Corrected unnecessary quote escaping in the brand regression test.
- Removed an unused catch binding, test-only environment variable snapshot, unused Node Module import, and unused request-body destructuring parameter reported by ESLint.
- Added regression coverage for performance and PWA behavior.

## Performance
- QR-code generation library is loaded only when the administrator opens the QR dialog.
- Reuses one Turkish lira `Intl.NumberFormat` instance rather than recreating it for each balance and transaction row.
- Calculates dashboard totals and active-account count in one memoized pass.
- Removes the render-blocking external Google Fonts stylesheet; system fonts render immediately.
- Vercel serves content-hashed build assets with immutable one-year caching.
- Login Edge Function v6 reuses date/time formatters and overlaps independent database, session-validation, HMAC, token-signing, and last-login tasks.
- Admin Edge Function v3 overlaps token/business checks, staff lookup and PIN verification, candidate-admin PIN checks, and access-code hash/encryption work.

## PWA
- Service Worker cache v9 refreshes installed clients for this release.
- Official Silopi Dijital logo and app icons remain in the offline shell.
- Current Vite entry JavaScript and CSS are pre-cached during Service Worker installation.
- Navigation waits briefly for the network, then opens the cached app shell on slow or unavailable connections.
- `/api/` responses are explicitly excluded; customer balances, purchases, login sessions, and admin responses are never cached.
- Service Worker update checks bypass stale HTTP cache.

No database migration was applied and no customer, balance, sale, or payment data was changed.
