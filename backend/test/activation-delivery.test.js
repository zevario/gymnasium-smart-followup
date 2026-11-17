import test from 'node:test';
import assert from 'node:assert/strict';
import { resendActivation } from '../../frontend/src/features/auth/services/activationDelivery.js';

test('Resend distinguishes accepted queue from unavailable sender', async () => {
  for (const [delivery, phrase] of [
    [undefined, 'Permintaan pengiriman ulang diterima'],
    ['waiting-for-sender', 'layanan pengirim email belum siap'],
  ]) {
    const message = await resendActivation('customer@example.com', async (url, options) => {
      assert.equal(url, '/api/auth/resend-activation');
      assert.equal(options.method, 'POST');
      assert.deepEqual(JSON.parse(options.body), { email: 'customer@example.com' });
      return { ok: true, json: async () => ({ data: true, delivery }) };
    });
    assert.ok(message.includes(phrase));
    assert.ok(!message.includes('Email aktivasi dikirim ulang'));
  }
});

test('Resend rejects failed or invalid responses instead of showing success', async () => {
  await assert.rejects(
    resendActivation('customer@example.com', async () => ({
      ok: false,
      json: async () => ({ message: 'Coba lagi nanti.' }),
    })),
    /Coba lagi nanti/,
  );
  await assert.rejects(
    resendActivation('customer@example.com', async () => ({ ok: true, json: async () => ({}) })),
    /belum dapat diminta ulang/,
  );
  await assert.rejects(
    resendActivation('customer@example.com', async () => ({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    })),
    /belum dapat diminta ulang/,
  );
});
