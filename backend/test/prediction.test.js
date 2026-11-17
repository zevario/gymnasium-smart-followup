import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { createInferenceApp, validateModel } from '../ml/app.js';
import { generateDataset } from '../ml/generate.js';
import { FEATURES, fitPreprocessor, predict } from '../ml/features.js';
import { stratifiedSplit, train } from '../ml/train.js';
import { askModel } from '../src/modules/predictions/prediction.service.js';

const model = JSON.parse(
  await readFile(new URL('../ml/artifacts/priority-model.json', import.meta.url)),
);
const sample = {
  customerId: 'test-customer',
  visits30Days: 4,
  daysSinceLastVisit: 12,
  attendanceRatio: 0.8,
  reschedules: 1,
  noResponses: 0,
  responseRatio: 0.75,
  remainingSessions: 5,
  daysToExpiry: 10,
};

async function serve(t, app) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );
  return `http://127.0.0.1:${server.address().port}`;
}

test('Synthetic generation is repeatable and split IDs never overlap', () => {
  const rows = generateDataset(600);
  assert.deepEqual(rows, generateDataset(600));
  const split = stratifiedSplit(rows);
  const ids = Object.values(split)
    .flat()
    .map((row) => row.customerId);
  assert.equal(ids.length, rows.length);
  assert.equal(new Set(ids).size, rows.length);
  for (const partition of Object.values(split))
    assert.equal(new Set(partition.map((r) => r.priority)).size, 3);
});

test('Training uses only train preprocessing and is deterministic', () => {
  const rows = generateDataset(300);
  const result = train(rows, { epochs: 30 });
  assert.deepEqual(result.model.preprocessing, fitPreprocessor(result.split.train));
  assert.deepEqual(result.model, train(rows, { epochs: 30 }).model);
  const changedTest = new Set(result.split.test.map((r) => r.customerId));
  const changed = rows.map((r) =>
    changedTest.has(r.customerId) ? { ...r, visits30Days: 100000 } : r,
  );
  assert.deepEqual(result.model, train(changed, { epochs: 30 }).model);
});

test('Artifact is tied to dataset and has finite normalized output with missing values', async () => {
  const raw = await readFile(new URL('../ml/data/synthetic-customers.jsonl', import.meta.url));
  assert.equal(createHash('sha256').update(raw).digest('hex'), model.datasetSha256);
  validateModel(model);
  for (const input of [
    sample,
    {
      ...sample,
      daysSinceLastVisit: null,
      attendanceRatio: null,
      responseRatio: null,
      remainingSessions: null,
      daysToExpiry: null,
    },
  ]) {
    const result = predict(model, input);
    assert.ok(Number.isFinite(result.score));
    assert.ok(result.score >= 0 && result.score <= 1);
    assert.ok(Math.abs(Object.values(result.probabilities).reduce((a, b) => a + b, 0) - 1) < 1e-10);
  }
  assert.throws(() => validateModel({ ...model, weights: [[NaN]] }));
});

test('Inference HTTP contract, validation and backend integration', async (t) => {
  const base = await serve(t, createInferenceApp(model));
  const health = await (await fetch(base + '/health')).json();
  assert.equal(health.modelVersion, model.modelVersion);
  assert.deepEqual(health.features, FEATURES);
  const post = (body) =>
    fetch(base + '/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  const result = await (await post({ customers: [sample] })).json();
  assert.equal(result.predictions[0].customerId, sample.customerId);
  assert.equal(result.predictions[0].priority, predict(model, sample).priority);
  for (const customers of [
    [],
    [sample, sample],
    [{ ...sample, visits30Days: -1 }],
    [{ ...sample, responseRatio: 1.1 }],
    [{ ...sample, noResponses: '2' }],
    [{ ...sample, extra: 'not allowed' }],
    [{ customerId: 'missing' }],
    Array.from({ length: 501 }, (_, i) => ({ ...sample, customerId: String(i) })),
  ]) {
    assert.equal((await post({ customers })).status, 400);
  }
  assert.equal(
    (
      await fetch(base + '/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      })
    ).status,
    400,
  );
  const original = process.env.INFERENCE_API_URL;
  t.after(() => {
    if (original === undefined) delete process.env.INFERENCE_API_URL;
    else process.env.INFERENCE_API_URL = original;
  });
  process.env.INFERENCE_API_URL = base;
  const accepted = await askModel([sample]);
  assert.equal(accepted[0].source, 'model');
  assert.equal(accepted[0].modelVersion, model.modelVersion);
  delete process.env.INFERENCE_API_URL;
  assert.equal(await askModel([sample]), null);
  process.env.INFERENCE_API_URL = base + ':invalid';
  assert.equal(await askModel([sample]), null);
});

test('Backend rejects duplicate IDs, invalid scores and timed-out model responses', async (t) => {
  let mode = 'duplicate';
  const server = createServer((_req, res) => {
    if (mode === 'timeout') return;
    res.setHeader('Content-Type', 'application/json');
    const entry = {
      customerId: sample.customerId,
      priority: 'high',
      score: mode === 'score' ? 2 : 0.8,
    };
    res.end(
      JSON.stringify({
        modelVersion: 'test',
        predictions: mode === 'duplicate' ? [entry, entry] : [entry],
      }),
    );
  });
  const originalUrl = process.env.INFERENCE_API_URL,
    originalTimeout = process.env.INFERENCE_TIMEOUT_MS;
  t.after(() => {
    if (originalUrl === undefined) delete process.env.INFERENCE_API_URL;
    else process.env.INFERENCE_API_URL = originalUrl;
    if (originalTimeout === undefined) delete process.env.INFERENCE_TIMEOUT_MS;
    else process.env.INFERENCE_TIMEOUT_MS = originalTimeout;
  });
  process.env.INFERENCE_API_URL = await serve(t, server);
  assert.equal(await askModel([sample, { ...sample, customerId: 'second' }]), null);
  mode = 'score';
  assert.equal(await askModel([sample]), null);
  mode = 'timeout';
  process.env.INFERENCE_TIMEOUT_MS = '25';
  assert.equal(await askModel([sample]), null);
});
