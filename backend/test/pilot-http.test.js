import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn, execFile, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { SMTPServer } from 'smtp-server';
import { setTimeout as delay } from 'node:timers/promises';
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
    INFERENCE_API_URL: '',
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
  const mailInbox = [];
  const smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ['AUTH', 'STARTTLS'],
    logger: false,
    onData(stream, session, callback) {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', callback);
      stream.on('end', async () => {
        try {
          const message = {
            email: session.envelope.rcptTo[0].address,
            text: Buffer.concat(chunks)
              .toString('utf8')
              .replace(/=\r?\n/g, '')
              .replace(/=3D/gi, '='),
          };
          mailInbox.push(message);
          if (process.env.PILOT_BROWSER_CHECK)
            await writeFile(path.join(temp, 'inbox.json'), JSON.stringify(mailInbox));
          callback();
        } catch (error) {
          callback(error);
        }
      });
    },
  });
  await new Promise((resolve) => smtp.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => smtp.close(resolve)));
  Object.assign(env, {
    NODE_ENV: 'test',
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(smtp.server.address().port),
    SMTP_USER: '',
    SMTP_PASS: '',
    MAIL_FROM: 'noreply@gym.test',
    APP_PUBLIC_URL: 'http://gym.test',
  });
  async function emailedToken(email, route, after = 0) {
    for (let i = 0; i < 100; i++) {
      const mail = mailInbox.slice(after).find((m) => m.email === email && m.text.includes(route));
      if (mail) {
        const value = mail.text.match(/#([a-f0-9]{64})/);
        assert.ok(value, 'email includes a complete link token');
        return value[1];
      }
      await delay(100);
    }
    assert.fail('Expected local SMTP delivery for ' + route);
  }
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
  let startup = '';
  let port;
  for await (const chunk of child.stdout.iterator({ destroyOnReturn: false })) {
    startup += chunk;
    port = startup.match(/listening on (\d+)/)?.[1];
    if (port) break;
  }
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
  const memberEmail = 'portal@example.com';
  const memberCredentials = { email: memberEmail, password };
  assert.equal(
    (
      await call('/members/register', null, {
        ...memberCredentials,
        name: 'Portal Member',
        phone: '+6281234567801',
        contact: true,
      })
    ).data,
    true,
  );
  const pending = await call('/members/login', null, memberCredentials);
  assert.equal(pending.code, 'EMAIL_ACTIVATION_REQUIRED');
  assert.equal(pending.data, undefined);
  const firstLink = await emailedToken(memberEmail, '/activate-email');
  await db.query(
    "UPDATE account_email_links SET expires_at=now()-interval '1 minute',requested_at=now()-interval '2 minutes' WHERE email=$1",
    [memberEmail],
  );
  assert.equal((await call('/auth/activate-email', null, { token: firstLink })).status, 410);
  const beforeResend = mailInbox.length;
  assert.equal((await call('/auth/resend-activation', null, { email: memberEmail })).status, 202);
  const activation = await emailedToken(memberEmail, '/activate-email', beforeResend);
  assert.notEqual(activation, firstLink);
  const confirmations = await Promise.all(
    [1, 2].map(() => call('/auth/activate-email', null, { token: activation })),
  );
  assert.deepEqual(confirmations.map((r) => r.status).sort(), [200, 410]);
  const memberToken = (await call('/members/login', null, memberCredentials)).data.token;
  assert.equal((await call('/members/me', memberToken)).data.email, memberEmail);
  assert.equal(
    (await call('/members/requests', memberToken, { kind: 'package', note: 'Paket satu bulan' }))
      .data,
    true,
  );
  const inbox = (await call('/member-requests', tokens.staff)).data;
  const memberRequest = inbox.find((item) => item.note === 'Paket satu bulan');
  assert.ok(memberRequest);
  assert.equal(
    (
      await call('/member-requests/' + memberRequest.id, tokens.staff, {
        state: 'confirmed',
        response: 'Paket telah aktif',
        package: 'Bulanan',
        date: new Date(now + 30 * 86400000).toISOString().slice(0, 10),
      })
    ).data,
    true,
  );
  const portal = (await call('/members/me', memberToken)).data;
  assert.equal(portal.cycles[0].package, 'Bulanan');
  assert.equal(portal.requests[0].state, 'confirmed');
  const booking = {
    kind: 'booking',
    note: 'Latihan pagi',
    starts_at: new Date(Date.now() + 86400000).toISOString(),
    ends_at: new Date(Date.now() + 90000000).toISOString(),
  };
  assert.equal((await call('/members/requests', memberToken, booking)).data, true);
  const booked = (await call('/members/me', memberToken)).data.requests.find(
    (r) => r.kind === 'booking',
  );
  assert.equal(
    (
      await call('/member-requests/' + booked.id, tokens.staff, {
        state: 'confirmed',
        response: 'Reservasi tersedia',
        amount: 25000,
      })
    ).data,
    true,
  );
  assert.equal(
    (await call('/member-requests/' + booked.id + '/paid', tokens.staff, {})).data,
    true,
  );
  assert.ok(
    (await call('/members/me', memberToken)).data.requests.find((r) => r.id === booked.id).paid_at,
  );
  assert.equal(
    (await call('/members/settings', memberToken, { promoEmail: true, method: 'Tunai' }, 'PATCH'))
      .data,
    true,
  );
  assert.equal((await call('/members/acknowledge', memberToken, {})).data, true);
  assert.equal((await call('/members/me', memberToken)).data.settings.promoEmail, true);
  // Customer profile changes are atomic and never grant staff access.
  assert.equal((await call('/member-requests', memberToken)).status, 'error');
  const updatedProfile = {
    name: 'Portal Updated',
    phone: '+6281234567888',
    contact: false,
    settings: { birth: '2000-01-01', gender: '', country: 'Indonesia', address: 'Bintaro' },
  };
  assert.equal((await call('/members/me', memberToken, updatedProfile, 'PUT')).data, true);
  let memberState = (await call('/members/me', memberToken)).data;
  assert.equal(memberState.contact, false);
  assert.equal(memberState.settings.country, 'Indonesia');
  assert.equal(
    (
      await call(
        '/members/me',
        memberToken,
        { ...updatedProfile, name: 'Should rollback', settings: { birth: '2999-01-01' } },
        'PUT',
      )
    ).status,
    400,
  );
  assert.equal((await call('/members/me', memberToken)).data.name, 'Portal Updated');
  assert.equal(
    (await call('/members/settings', memberToken, { photo: 'javascript:alert(1)' }, 'PATCH'))
      .status,
    400,
  );
  assert.equal(
    (await call('/members/settings', memberToken, { photo: '/images/avatar-blue.svg' }, 'PATCH'))
      .data,
    true,
  );
  assert.equal(
    (await call('/members/me', memberToken)).data.settings.photo,
    '/images/avatar-blue.svg',
  );
  assert.equal(
    (await call('/members/requests', memberToken, { kind: 'help', note: 'Cancel me' })).data,
    true,
  );
  memberState = (await call('/members/me', memberToken)).data;
  const cancellable = memberState.requests.find((r) => r.note === 'Cancel me');
  assert.equal(
    (await call('/members/requests/' + cancellable.id + '/cancel', memberToken, {})).data,
    true,
  );
  assert.equal(
    (
      await call('/member-requests/' + cancellable.id, tokens.staff, {
        state: 'confirmed',
        response: 'Too late',
      })
    ).status,
    409,
  );
  assert.equal((await call('/members/requests/invalid/cancel', memberToken, {})).status, 400);
  const secondMember = (await call('/members/login', null, memberCredentials)).data.token;
  assert.equal(
    (
      await call(
        '/members/credentials',
        memberToken,
        { current: password, email: memberEmail, password: 'UpdatedMemberPassword123!' },
        'PUT',
      )
    ).data,
    true,
  );
  assert.equal((await call('/members/me', secondMember)).status, 401);
  assert.equal((await call('/members/login', null, memberCredentials)).status, 401);
  assert.ok(
    (
      await call('/members/login', null, {
        email: memberEmail,
        password: 'UpdatedMemberPassword123!',
      })
    ).data.token,
  );
  assert.equal((await call('/members/logout', memberToken, {})).data, true);
  assert.equal((await call('/members/me', memberToken)).status, 401);
  // Both roles recover independently, even when their registered address is identical.
  await db.query('UPDATE users SET email=$1 WHERE email=$2', [memberEmail, 'new@example.com']);
  const activeMember = (
    await call('/members/login', null, {
      email: memberEmail,
      password: 'UpdatedMemberPassword123!',
    })
  ).data.token;
  const resetPassword = 'RecoveredCustomer123!';
  const recovery = (account, email = memberEmail) =>
    call('/auth/forgot-password', null, { email, account });
  assert.deepEqual(await recovery('employee', 'missing@example.com'), await recovery('employee'));
  const employeeReset = await emailedToken(memberEmail, 'account=employee');
  assert.equal(
    (
      await call('/auth/reset-password', null, {
        account: 'customer',
        token: employeeReset,
        password: resetPassword,
      })
    ).status,
    410,
  );
  assert.equal(
    (
      await call('/auth/reset-password', null, {
        account: 'employee',
        token: employeeReset,
        password: 'aaaaaaaaaa',
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call('/auth/reset-password', null, {
        account: 'employee',
        token: employeeReset,
        password: 'RecoveredEmployee123!',
      })
    ).status,
    200,
  );
  assert.equal((await call('/session', createdLogin.data.accessToken)).status, 'error');
  assert.equal(
    (await call('/auth/login', null, { email: memberEmail, password: 'RecoveredEmployee123!' }))
      .status,
    'success',
  );
  assert.equal((await call('/members/me', activeMember)).status, 200);
  assert.equal((await recovery('customer')).status, 202);
  const memberReset = await emailedToken(memberEmail, '/reset-password?account=customer');
  const change = { account: 'customer', token: memberReset, password: resetPassword };
  assert.equal((await call('/auth/reset-password', null, change)).status, 200);
  assert.equal((await call('/auth/reset-password', null, change)).status, 410);
  assert.equal((await call('/members/me', activeMember)).status, 401);
  assert.ok(
    (await call('/members/login', null, { email: memberEmail, password: resetPassword })).data
      .token,
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
  await act(row, owner, 'snooze', {
    note: 'Call back tomorrow',
    until: new Date(now + 86400000).toISOString(),
  });
  [row] = await list();
  assert.equal(row.status, 'Ditunda');
  await act(row, owner, 'optout', { note: 'Customer withdrew consent' });
  [row] = await list();
  // The earlier snooze no longer shows once the customer opts out.
  assert.equal(row.nextAt, null);
  assert.equal(row.reason, 'Customer withdrew consent');
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
  // Security regressions use extra sessions so workflow assertions above stay independent.
  async function secureCall(path, { token, body, method = body ? 'POST' : 'GET' } = {}) {
    const result = await fetch(base + '/api' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { code: result.status, headers: result.headers, body: await result.json() };
  }
  const credentials = { email: 'staff@example.com', password };
  const signIn = async () => (await secureCall('/auth/login', { body: credentials })).body.data;
  let securitySession = await signIn();
  const parallelRefreshes = await Promise.all(
    [1, 2].map(() =>
      secureCall('/auth/refresh', { body: { refreshToken: securitySession.refreshToken } }),
    ),
  );
  assert.deepEqual(parallelRefreshes.map((result) => result.code).sort(), [200, 401]);
  assert.equal((await secureCall('/session', { token: securitySession.accessToken })).code, 401);
  securitySession = parallelRefreshes.find((result) => result.code === 200).body.data;
  assert.equal((await secureCall('/session', { token: securitySession.accessToken })).code, 200);
  const health = await secureCall('/health');
  assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.equal(health.headers.get('x-powered-by'), null);
  assert.ok(health.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
  assert.equal(
    (
      await secureCall('/users/me', {
        token: securitySession.accessToken,
        method: 'PUT',
        body: { name: 'Staff', email: 'staff@example.com', role: 'admin' },
      })
    ).code,
    400,
  );
  assert.equal(
    (
      await secureCall('/auth/logout', {
        token: 'expired-access-token',
        body: { refreshToken: securitySession.refreshToken },
      })
    ).code,
    200,
  );
  assert.equal((await secureCall('/session', { token: securitySession.accessToken })).code, 401);
  assert.equal(
    (await secureCall('/auth/refresh', { body: { refreshToken: securitySession.refreshToken } }))
      .code,
    401,
  );

  const uploadSession = await signIn();
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG9kAAAAASUVORK5CYII=',
    'base64',
  );
  const photoForm = new FormData();
  photoForm.append('photo', new Blob([png], { type: 'image/png' }), 'avatar.png');
  const photoResult = await fetch(base + '/api/users/me/photo', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + uploadSession.accessToken },
    body: photoForm,
  });
  assert.equal(photoResult.status, 200, await photoResult.text());
  const dangerousForm = new FormData();
  dangerousForm.append(
    'photo',
    new Blob(['<svg onload="alert(1)"></svg>'], { type: 'image/svg+xml' }),
    'avatar.svg',
  );
  assert.equal(
    (
      await fetch(base + '/api/users/me/photo', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + uploadSession.accessToken },
        body: dangerousForm,
      })
    ).status,
    400,
  );

  const passwordSession = await signIn();
  const otherSession = await signIn();
  const newPassword = 'UpdatedSecurePassword123!';
  assert.equal(
    (
      await secureCall('/users/me/password', {
        token: passwordSession.accessToken,
        method: 'PATCH',
        body: { currentPassword: password, newPassword, confirmPassword: newPassword },
      })
    ).code,
    200,
  );
  for (const session of [passwordSession, otherSession]) {
    assert.equal((await secureCall('/session', { token: session.accessToken })).code, 401);
    assert.equal(
      (await secureCall('/auth/refresh', { body: { refreshToken: session.refreshToken } })).code,
      401,
    );
  }
  // Restore this fixture's password for optional browser checks after proving revocation.
  await db.query('UPDATE users SET password_hash=$1 WHERE email=$2', [hash, credentials.email]);
  const resetSession = await signIn();
  const resetUser = (await secureCall('/session', { token: resetSession.accessToken })).body.data
    .user;
  assert.equal(
    (
      await secureCall('/users/' + resetUser.id, {
        token: tokens.system,
        method: 'PUT',
        body: { password: newPassword },
      })
    ).code,
    200,
  );
  assert.equal((await secureCall('/session', { token: resetSession.accessToken })).code, 401);
  await db.query('UPDATE users SET password_hash=$1 WHERE email=$2', [hash, credentials.email]);

  // Account deletion is administrator-only and preserves referenced history.
  const disposable = await call('/users', tokens.system, {
    name: 'Delete test',
    email: 'delete-test@example.com',
    role: 'staff',
    password,
  });
  const disposableId = disposable.data.id;
  const deletePath = '/users/' + disposableId;
  const disposableSession = await call('/auth/login', null, {
    email: 'delete-test@example.com',
    password,
  });
  assert.equal((await secureCall(deletePath, { method: 'DELETE' })).code, 401);
  assert.equal((await secureCall(deletePath, { token: tokens.lead, method: 'DELETE' })).code, 403);
  const systemId = (await db.query("SELECT id FROM users WHERE email='system@example.com'")).rows[0]
    .id;
  assert.equal(
    (await secureCall('/users/' + systemId, { token: tokens.system, method: 'DELETE' })).code,
    400,
  );
  await db.query('INSERT INTO pilot_rule_events(actor_id,paused,note) VALUES($1,false,$2)', [
    disposableId,
    'Deletion guard test',
  ]);
  assert.equal(
    (await secureCall(deletePath, { token: tokens.system, method: 'DELETE' })).code,
    409,
  );
  assert.equal((await db.query('SELECT id FROM users WHERE id=$1', [disposableId])).rowCount, 1);
  await db.query('DELETE FROM pilot_rule_events WHERE actor_id=$1', [disposableId]);
  assert.equal(
    (await secureCall(deletePath, { token: tokens.system, method: 'DELETE' })).code,
    200,
  );
  assert.equal((await db.query('SELECT id FROM users WHERE id=$1', [disposableId])).rowCount, 0);
  assert.equal(
    (await secureCall('/session', { token: disposableSession.data.accessToken })).code,
    401,
  );
  assert.equal(
    (await secureCall(deletePath, { token: tokens.system, method: 'DELETE' })).code,
    404,
  );

  // Optional local browser smoke command, using only this isolated fixture.
  if (process.env.PILOT_BROWSER_CHECK)
    await promisify(execFile)(process.execPath, [process.env.PILOT_BROWSER_CHECK], {
      env: {
        ...env,
        PILOT_TEST_INBOX: path.join(temp, 'inbox.json'),
        PILOT_TEST_NOW: String(now),
        PILOT_TEST_URL: base,
        PILOT_TEST_PASSWORD: password,
      },
      stdio: 'inherit',
      timeout: 40000,
    });
  for (let attempt = 0; attempt < 10; attempt++) {
    const attemptResult = await secureCall('/auth/login', {
      body: { email: 'unknown@example.com', password: 'incorrect' },
    });
    if (attemptResult.code === 429) break;
    assert.equal(attemptResult.code, 401);
  }
  assert.equal(
    (
      await secureCall('/auth/login', {
        body: { email: 'unknown@example.com', password: 'incorrect' },
      })
    ).code,
    429,
  );
});
