# Test report — SilopiDijital Veresiye 0.3.0

## Changes
- Cleaned the eight reported Vercel ESLint findings: unused catch binding, unnecessary regex escapes, unused test variable, unused import, and unused request destructuring.
- Deferred QR-code library loading until the administrator opens the QR dialog. Currency formatting now reuses one formatter; dashboard totals use one memoized pass.
- Removed the render-blocking external font import and configured immutable caching for Vite's content-hashed assets.
- PWA Service Worker v9 pre-caches the app shell and current JS/CSS entry assets, falls back to the cached shell on slow connections, and never caches `/api/` responses. Original logo, icons, manifest, and standalone install mode are retained.
- Optimized the live login Edge Function: module-scope date/time formatters, parallel business/session/fingerprint work, and parallel session signing + last-login update.
- Optimized the live admin Edge Function: parallel token/business verification, concurrent staff/PIN verification, concurrent checks for candidate admins, and parallel HMAC/encryption work.

## Checks completed
- 13 local regression/security tests passed, including API contract, Vercel and Vite proxy HTTP smoke tests (upstream mocked), original brand asset hashes, session security, publishable key, PWA caching, and Edge Function performance assertions.
- `node --check` passed for the Service Worker, affected test scripts, and local proxy script.
- TypeScript transpile syntax checks passed for the app, main entry, Vite config, Vercel API route, and login Edge Function.
- JSON parsing passed for package.json, package-lock.json, vercel.json, and the PWA manifest.
- Supabase confirmed `veresiye-portal-login` v6 ACTIVE and `veresiye-portal-admin` v3 ACTIVE, both retaining `verify_jwt=false` and their in-function authorization checks.

## Checks not completed in this environment
- Full ESLint, project-wide TypeScript type-check, and Vite production build could not be run here because `npm ci` did not finish installing dependencies (npm install timed out; ESLint executable and several type packages were unavailable). The original Vercel failure was addressed in the named files, but the final hosted build still needs to be confirmed by Vercel after this source is pushed.
- No live customer six-digit code was used for an end-to-end login test. The live Edge Function deployment is confirmed; test customer records were not modified.
- Performance log samples before optimization measured login around 2.7–3.4 seconds and admin actions around 1.5–3.6 seconds. No post-deploy customer traffic sample was available, so an exact new response time or percentage improvement is not claimed.

## Data and safety
- No Supabase schema change or SQL migration was applied.
- No customer code, balance, sales, or payment records were changed.
- Customer balances, purchase history, login, and admin API responses remain no-store / excluded from PWA cache.
- The original Silopi Dijital / Yunus ProPOS logo and app icon assets were not modified.
