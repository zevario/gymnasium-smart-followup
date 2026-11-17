import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import DraftGeneratorService, {
  requestDraft,
} from '../src/modules/reminders/draft-generator.service.js';
import { draftFor } from '../src/modules/pilot/pilot.drafts.js';

// Layanan AI tiruan: /draft membalas sesuai `mode`, /health melaporkan status Gemini.
async function fakeDraftService(t) {
  const state = { mode: 'gemini', lastBody: null };
  const server = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    state.lastBody = raw ? JSON.parse(raw) : null;
    if (state.mode === 'timeout') return;
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/health') {
      return res.end(
        JSON.stringify({ draft: { provider: 'gemini', configured: true, model: 'm' } }),
      );
    }
    if (state.mode === 'error') {
      res.statusCode = 500;
      return res.end('{}');
    }
    const message =
      state.mode === 'long' ? 'x'.repeat(501) : 'Halo Kak Andi, terima kasih sudah mencoba.';
    res.end(JSON.stringify({ message, source: 'gemini', model: 'gemini-test', reason: null }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const originals = { url: process.env.DRAFT_API_URL, timeout: process.env.DRAFT_TIMEOUT_MS };
  process.env.DRAFT_API_URL = 'http://127.0.0.1:' + server.address().port;
  process.env.DRAFT_TIMEOUT_MS = '300';
  t.after(async () => {
    for (const [key, value] of [
      ['DRAFT_API_URL', originals.url],
      ['DRAFT_TIMEOUT_MS', originals.timeout],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  return state;
}

const facts = { kind: 'followup_trial', customerName: 'Andi', packageName: 'Trial Bintaro' };

test('Draft service replies are accepted only inside the contract', async (t) => {
  const service = await fakeDraftService(t);
  const accepted = await requestDraft(facts);
  assert.equal(accepted.source, 'gemini');
  assert.match(accepted.message, /Andi/);
  assert.equal(service.lastBody.customerName, 'Andi');

  for (const mode of ['long', 'error', 'timeout']) {
    service.mode = mode;
    assert.equal(await requestDraft(facts), null, mode);
  }
  assert.equal(await requestDraft({ ...facts, kind: 'promo' }), null);
  delete process.env.DRAFT_API_URL;
  assert.equal(await requestDraft(facts), null);
});

test('Follow-up draft uses GenAI when available and the phrase catalog otherwise', async (t) => {
  const service = await fakeDraftService(t);
  const row = {
    goal: 'trial',
    name: 'Andi',
    facts: { package: 'Trial Bintaro', anchor: '2026-11-14T03:00:00Z' },
  };
  const ai = await draftFor(row);
  assert.equal(ai.kind, 'AI · Gemini');
  assert.equal(service.lastBody.trialDate, '2026-11-14');

  service.mode = 'error';
  const fallback = await draftFor(row);
  assert.equal(fallback.kind, 'Template');
  assert.match(fallback.message, /Trial Bintaro/);
});

test('Draft status reports the GenAI service and its absence', async (t) => {
  await fakeDraftService(t);
  const status = await DraftGeneratorService.getDraftGeneratorStatus();
  assert.equal(status.available, true);
  assert.equal(status.provider, 'gemini');
  delete process.env.DRAFT_API_URL;
  assert.equal((await DraftGeneratorService.getDraftGeneratorStatus()).available, false);
});
