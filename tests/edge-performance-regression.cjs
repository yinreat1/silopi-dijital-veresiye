const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'supabase', 'functions', 'veresiye-portal-login', 'index.ts'),
  'utf8',
);

assert.match(source, /const dateFormatter = new Intl\.DateTimeFormat\('tr-TR'/);
assert.match(source, /const timeFormatter = new Intl\.DateTimeFormat\('tr-TR'/);
const formatter = source.match(/function formatDateTime\(iso: string\) \{[\s\S]*?\n\}/);
assert.ok(formatter, 'transaction date formatter helper must exist');
assert.doesNotMatch(formatter[0], /new Intl\.DateTimeFormat/, 'Intl formatters must not be recreated per transaction');

assert.match(source, /const \[businessResult, sessionPayload, loginHashes\] = await Promise\.all\(/);
assert.match(source, /hmacHex\('customer-access-code', code\)[\s\S]*hmacHex\('login-ip-fingerprint'/);
assert.match(source, /const \[newSessionToken\] = await Promise\.all\(/, 'session signing and last-login write should run concurrently');
assert.match(source, /veresiye_portal_register_login_attempt/, 'failed-login rate limiting must remain active');
assert.match(source, /verifyCustomerSessionToken\(sessionToken\)/, 'remembered sessions must still be verified');
assert.match(source, /\.eq\('is_active', true\)/, 'disabled customer portal access must still be rejected');
assert.match(source, /30 \* 24 \* 60 \* 60/, '30-day remembered-session lifetime must remain unchanged');

const adminSource = fs.readFileSync(
  path.join(__dirname, '..', 'supabase', 'functions', 'veresiye-portal-admin', 'index.ts'),
  'utf8',
);
assert.match(adminSource, /const \[businessId, verifiedToken\] = await Promise\.all\(/, 'admin-token verification should overlap the business lookup');
assert.match(adminSource, /const verifiedAdmins = await Promise\.all\(admins\.map/, 'candidate admin PIN checks must not run sequentially');
assert.doesNotMatch(adminSource, /for \(const candidate of admins\)/, 'sequential per-admin PIN verification must be removed');
assert.match(adminSource, /const \[ipHash, pinHash\] = await Promise\.all\(/, 'failed-login fingerprint hashes should be computed concurrently');
assert.match(adminSource, /const \[codeHash, encrypted\] = await Promise\.all\(/, 'new access-code hash and encryption should run concurrently');

console.log('PASS: login and admin Edge Function performance regressions, with access checks and rate limiting preserved.');
