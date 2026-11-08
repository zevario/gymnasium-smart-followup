import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import pg from 'pg';
import bcrypt from 'bcrypt';

test('Pilot HTTP workflow in an isolated PostgreSQL schema', { timeout: 60000 }, async (t) => {
  const schema = 'pilot_test_' + randomUUID().replaceAll('-', '');
  const env = {
    ...process.env,
    PGOPTIONS: '-c search_path=' + schema,
    PILOT_PORT: '0',
    PILOT_AI_MODEL: '',
    PILOT_HOST: '127.0.0.1',
  };
  const db = new pg.Client();
  await db.connect();
  t.after(async () => {
    await db.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE');
    await db.end();
  });
  execFileSync(
    './node_modules/.bin/node-pg-migrate',
    ['up', '--schema', schema, '--create-schema'],
    { env, stdio: 'pipe' },
  );
  await db.query('SET search_path TO ' + schema);
  const password = randomUUID();
  const hash = await bcrypt.hash(password, 4);
  for (const [email, role] of [
    ['lead', 'spv'],
    ['staff', 'staff'],
    ['second', 'staff'],
    ['system', 'admin'],
    ['outside', 'spv'],
  ]) {
    await db.query(
      'INSERT INTO users(name,email,role,password_hash,pilot_location) VALUES($1,$2,$3,$4,$5)',
      [email, email + '@example.com', role, hash, email === 'outside' ? null : 'bintaro'],
    );
  }
  // Exercise handoff during opening hours independent of the machine's current time.
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  let now = Date.parse(today + 'T10:00:00+07:00');
  if (now > Date.now()) now -= 86400000;
  const temp = await mkdtemp(path.join(tmpdir(), 'gym-pilot-test-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const clock = path.join(temp, 'clock.mjs');
  await writeFile(clock, 'Date.now=()=>' + now + ';');
  const child = spawn(process.execPath, ['--import', clock, 'src/pilot-server.js'], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => {
    if (child.exitCode === null) {
      const done = once(child, 'exit');
      child.kill();
      await done;
    }
  });
  const [startup] = await once(child.stdout, 'data');
  const port = String(startup).match(/listening on (\d+)/)?.[1];
  assert.ok(port, 'API must start');
  const base = 'http://127.0.0.1:' + port;
  async function call(path, token, body, method = body ? 'POST' : 'GET') {
    const res = await fetch(base + '/api' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    return { status: res.status, ...json };
  }
  const tokens = {};
  for (const account of ['lead', 'staff', 'second', 'system', 'outside']) {
    const auth = await call('/auth/login', null, { email: account + '@example.com', password });
    assert.equal(auth.status, 'success');
    tokens[account] = auth.data.accessToken;
  }
  assert.equal((await call('/pilot/tasks')).status, 'error');
  assert.equal((await call('/pilot/tasks', tokens.system)).status, 'error');
  assert.equal((await call('/pilot/tasks', tokens.outside)).status, 403);
  assert.equal((await call('/users', tokens.system)).data.length, 4);
  const created = await call('/users', tokens.system, {
    name: 'New worker',
    email: 'new@example.com',
    role: 'staff',
    password,
  });
  assert.equal(created.status, 'success');
  const createdLogin = await call('/auth/login', null, { email: 'new@example.com', password });
  assert.equal(
    (await call('/session', createdLogin.data.accessToken)).data.user.pilot_location,
    'bintaro',
  );
  const record = {
    location: 'bintaro',
    customerId: 'sample',
    name: 'Sample Member',
    phone: '+620000000001',
    consent: 'granted',
    consentAt: new Date(now - 3600000).toISOString(),
    consentRef: 'consent-sample',
    complaint: false,
    transaction: null,
    observedAt: new Date(now - 60000).toISOString(),
    cycleId: 'first',
    goal: 'trial',
    package: 'Trial Bintaro',
    anchor: new Date(now - 26 * 3600000).toISOString(),
  };
  const upload = (records) => call('/pilot/import', tokens.lead, { records });
  assert.equal((await call('/pilot/import', tokens.staff, { records: [record] })).status, 'error');
  assert.equal((await upload([{ ...record, location: 'other' }])).status, 400);
  assert.equal((await upload([record])).data.updated, 1);
  assert.equal((await upload([record])).data.unchanged, 1);
  const list = async () => (await call('/pilot/tasks', tokens.staff)).data;
  let [row] = await list();
  assert.equal(row.name, record.name);
  assert.equal(row.score, 50);
  const act = (task, token, action, extra = {}) =>
    call('/pilot/tasks/' + task.id + '/actions', token, {
      action,
      version: task.version,
      ...extra,
    });
  const claims = await Promise.all(
    [tokens.staff, tokens.second].map((token) => act(row, token, 'claim')),
  );
  assert.deepEqual(claims.map((r) => r.status).sort(), [200, 409]);
  const owner = claims[0].status === 200 ? tokens.staff : tokens.second;
  [row] = await list();
  assert.equal((await act(row, owner, 'draft')).status, 200);
  [row] = await list();
  assert.equal(row.draftKind, 'Template');
  assert.match(row.draft, /Trial Bintaro/);
  const request = {
    message: row.draft,
    attempt: randomUUID(),
    note: 'Verified current source and consent',
  };
  const policy = (paused) =>
    call('/pilot/policy', tokens.lead, { paused, note: 'Pilot test' }, 'PUT');
  await policy(true);
  assert.equal((await act(row, owner, 'approve', request)).status, 409);
  await policy(false);
  const output = await act(row, owner, 'approve', request);
  assert.equal(output.data.handoff.message, row.draft);
  assert.equal((await act(row, owner, 'approve', request)).data.handoff, undefined);
  [row] = await list();
  assert.ok(row.pending);
  assert.equal(
    (
      await act(row, owner, 'accepted', {
        attempt: request.attempt,
        note: 'Manual receipt example',
      })
    ).status,
    200,
  );
  [row] = await list();
  assert.equal(row.status, 'Menunggu balasan');
  await act(row, owner, 'reply', { note: 'Customer requested a callback' });
  [row] = await list();
  assert.equal(row.status, 'Dalam penanganan');
  await act(row, owner, 'optout', { note: 'Customer withdrew consent' });
  const renewal = {
    ...record,
    cycleId: 'other',
    goal: 'renewal',
    membershipState: 'renewable',
    anchor: new Date(now + 2 * 86400000).toISOString(),
  };
  await upload([renewal]);
  const all = await list();
  assert.equal(all.length, 2);
  assert.ok(all.every((x) => x.status === 'Diblokir'));
  assert.equal((await call('/pilot/reports', tokens.staff)).status, 'error');
  assert.equal((await call('/pilot/reports', tokens.lead)).data.length, 2);
  assert.ok((await call('/pilot/tasks/' + row.id + '/history', owner)).data.length >= 6);
  const fresh = {
    ...record,
    customerId: 'fresh',
    consentRef: 'fresh-approval',
    name: 'Other Member',
  };
  assert.equal((await upload([fresh])).data.updated, 1);
  const findFresh = async () => (await list()).find((r) => r.name === fresh.name);
  let changed = await findFresh();
  await act(changed, tokens.staff, 'claim');
  changed = await findFresh();
  await act(changed, tokens.staff, 'draft');
  changed = await findFresh();
  const tx = {
    ...fresh,
    observedAt: new Date(now - 1000).toISOString(),
    transaction: 'unique-payment',
    transactionAt: new Date(now - 3000).toISOString(),
  };
  assert.equal((await upload([tx])).data.updated, 1);
  assert.equal(
    (await act(changed, tokens.staff, 'approve', { ...request, attempt: randomUUID() })).status,
    409,
  );
  changed = await findFresh();
  assert.equal(changed.status, 'Selesai');
  assert.equal(changed.draft, null);
  assert.equal((await upload([fresh])).data.unchanged, 1);
  assert.equal((await findFresh()).transaction, 'unique-payment');
  // Optional local browser smoke command, using only this isolated fixture.
  if (process.env.PILOT_BROWSER_CHECK)
    execFileSync(process.execPath, [process.env.PILOT_BROWSER_CHECK], {
      env: {
        ...env,
        PILOT_TEST_NOW: String(now),
        PILOT_TEST_URL: base,
        PILOT_TEST_PASSWORD: password,
      },
      stdio: 'inherit',
      timeout: 40000,
    });
});
