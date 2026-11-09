import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createRequestLimiter } from '../src/middleware/rate-limit.js';
import { createErrorHandler } from '../src/middleware/error-handler.js';
import { validateSecurityEnvironment } from '../src/config/security.js';
import { createTokens, verifyToken } from '../src/modules/authentication/token.service.js';

async function serve(t, app) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('Production refuses weak/shared secrets and non-HTTPS origins', () => {
  const valid = {
    NODE_ENV: 'production',
    JWT_ACCESS_SECRET: randomUUID(),
    JWT_REFRESH_SECRET: randomUUID(),
    FRONTEND_URL: 'https://gym.example.com',
  };
  assert.doesNotThrow(() => validateSecurityEnvironment(valid));
  for (const patch of [
    { JWT_ACCESS_SECRET: '' },
    { JWT_ACCESS_SECRET: valid.JWT_REFRESH_SECRET },
    { JWT_ACCESS_SECRET: 'replace_with_a_long_random_secret' },
    { FRONTEND_URL: 'http://gym.example.com' },
  ]) {
    assert.throws(() => validateSecurityEnvironment({ ...valid, ...patch }));
  }
});

test('JWT verification rejects wrong algorithm, audience, kind and missing session binding', () => {
  const user = { id: randomUUID() };
  const tokens = createTokens(user);
  assert.equal(verifyToken(tokens.accessToken, 'access').sub, user.id);
  assert.equal(verifyToken(tokens.refreshToken, 'refresh').sub, user.id);
  assert.throws(() => verifyToken(tokens.refreshToken, 'access'));
  const claims = { sub: user.id, kind: 'access', sid: 'a'.repeat(64) };
  for (const options of [
    { algorithm: 'HS384', audience: 'gymnasyum-api' },
    { algorithm: 'HS256', audience: 'other-app' },
  ]) {
    const token = jwt.sign(claims, process.env.JWT_ACCESS_SECRET, {
      ...options,
      issuer: 'gymnasyum',
      expiresIn: '1m',
    });
    assert.throws(() => verifyToken(token, 'access'));
  }
  const unbound = jwt.sign({ sub: user.id, kind: 'access' }, process.env.JWT_ACCESS_SECRET, {
    issuer: 'gymnasyum',
    audience: 'gymnasyum-api',
  });
  assert.throws(() => verifyToken(unbound, 'access'));
});

test('Request limiting returns 429 and retry metadata', async (t) => {
  const app = express();
  app.use(createRequestLimiter({ limit: 2, windowMs: 60000 }));
  app.get('/', (_req, res) => res.json({ ok: true }));
  const base = await serve(t, app);
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(base)).status, 200);
  const denied = await fetch(base);
  assert.equal(denied.status, 429);
  assert.ok(Number(denied.headers.get('retry-after')) > 0);
});

test('Error responses redact internal failures and reject malformed/oversized JSON', async (t) => {
  const app = express();
  app.use(express.json({ limit: '1kb' }));
  app.get('/failure', () => {
    throw new Error('password=TOP_SECRET; SELECT private_data');
  });
  app.post('/', (_req, res) => res.json({ ok: true }));
  app.use(createErrorHandler({ includeStatus: false }));
  const base = await serve(t, app);
  const failure = await fetch(base + '/failure');
  assert.equal(failure.status, 500);
  assert.equal((await failure.json()).message, 'Layanan belum tersedia.');
  for (const [body, status] of [
    ['{invalid', 400],
    [JSON.stringify({ payload: 'x'.repeat(2000) }), 413],
  ]) {
    const response = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    assert.equal(response.status, status);
    assert.ok(!(await response.text()).includes('payload'));
  }
});
