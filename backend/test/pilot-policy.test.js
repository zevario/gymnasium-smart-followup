import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY, HOUR, evaluate, schedule } from '../src/modules/pilot/pilot.policy.js';
const now = Date.parse('2026-10-14T10:00:00+07:00');
const at = (time) => new Date(time).toISOString();
function task(goal, offset) {
  const anchor = at(now + offset),
    dates = schedule(goal, anchor, now);
  return {
    id: 'cycle',
    goal,
    phone: '+620000000001',
    consent: 'granted',
    facts: { anchor, interest: 'information', visits: 4 },
    opens_at: at(dates.opens),
    due_at: at(dates.due),
    expires_at: at(dates.expires),
  };
}
test('Trial starts at 24 hours, changes urgency after 48h and 7 days, expires at 14 days', () => {
  for (const [age, ready, score] of [
    [23 / 24, false, 0],
    [1, true, 40],
    [2, true, 40],
    [2.01, true, 30],
    [7, true, 30],
    [7.01, true, 15],
    [14, false, 0],
  ]) {
    const result = evaluate(task('trial', -age * DAY), [], now);
    assert.equal(result.canPrepare, ready);
    assert.equal(result.parts.urgency, score);
  }
});
test('Renewal H−7 through H+7 and business due date', () => {
  for (const [days, ready, score] of [
    [8, false, 0],
    [7, true, 30],
    [2, true, 40],
    [0, true, 40],
    [-1, true, 20],
    [-7, true, 20],
    [-8, false, 0],
  ]) {
    const state = evaluate(task('renewal', days * DAY), [], now);
    assert.equal(state.canPrepare, ready);
    assert.equal(state.parts.urgency, score);
  }
  assert.equal(evaluate(task('renewal', 2 * DAY), [], now).score, 75);
  const late = schedule('trial', at(now - DAY + 7 * HOUR));
  assert.equal(late.due, now + DAY + 8 * HOUR);
});
test('Cross-goal cooldown, rolling caps, reply hold, opt-out and pending handoff', () => {
  const row = task('trial', -DAY);
  const sent = (hours, goal = 'renewal') => ({
    cycle_id: 'other',
    state: 'accepted',
    accepted_at: at(now - hours * HOUR),
    goal,
  });
  assert.equal(evaluate(row, [sent(47.99)], now).canPrepare, false);
  assert.equal(evaluate(row, [sent(48)], now).canPrepare, true);
  assert.equal(evaluate(row, [sent(48), sent(99), sent(160)], now).canPrepare, false);
  assert.equal(evaluate(row, [sent(48), sent(99), sent(168)], now).canPrepare, true);
  assert.equal(evaluate(row, [sent(50, 'trial'), sent(120, 'trial')], now).canPrepare, false);
  assert.equal(evaluate(row, [{ state: 'unknown', cycle_id: 'other' }], now).canPrepare, false);
  assert.equal(evaluate({ ...row, status: 'reply' }, [], now).canPrepare, false);
  assert.equal(evaluate({ ...row, opted_out_at: at(now) }, [], now).canPrepare, false);
  assert.equal(evaluate({ ...row, consent: 'unknown' }, [], now).canPrepare, false);
});
test('Trial waits 72h, renewal waits 48h and H−2 on the same cycle', () => {
  const sent = (age, goal) => ({
    cycle_id: 'cycle',
    state: 'accepted',
    accepted_at: at(now - age * HOUR),
    goal,
  });
  assert.equal(
    evaluate(task('trial', -4 * DAY), [sent(71, 'trial')], now).status,
    'Menunggu balasan',
  );
  assert.equal(evaluate(task('trial', -4 * DAY), [sent(72, 'trial')], now).canPrepare, true);
  assert.equal(evaluate(task('renewal', 3 * DAY), [sent(48, 'renewal')], now).status, 'Mendatang');
  assert.equal(evaluate(task('renewal', 2 * DAY), [sent(48, 'renewal')], now).canPrepare, true);
});
