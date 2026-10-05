import test from 'node:test';
import assert from 'node:assert/strict';
import { levelUpGate } from '../src/lib/xp-thresholds';

const campaign = { campaignName: 'Встреча' };

test('original is not limited by experience', () => {
  assert.deepEqual(levelUpGate({ level: 1, experiencePoints: 0 }, null), { allowed: true, reason: null });
  assert.deepEqual(levelUpGate({ level: 20, experiencePoints: 0 }, null), { allowed: false, reason: null });
});

test('campaign version below the threshold is blocked with the missing amount', () => {
  assert.deepEqual(levelUpGate({ level: 1, experiencePoints: 299 }, campaign), {
    allowed: false,
    reason: 'До 2 уровня не хватает 1 опыта',
  });
  assert.deepEqual(levelUpGate({ level: 4, experiencePoints: 2700 }, campaign), {
    allowed: false,
    reason: 'До 5 уровня не хватает 3800 опыта',
  });
});

test('campaign version at the threshold may level up', () => {
  assert.deepEqual(levelUpGate({ level: 1, experiencePoints: 300 }, campaign), { allowed: true, reason: null });
});

test('campaign version at level 20 is blocked without an xp reason', () => {
  assert.deepEqual(levelUpGate({ level: 20, experiencePoints: 999999 }, campaign), { allowed: false, reason: null });
});

test('missing experience on a campaign version counts as zero', () => {
  const gate = levelUpGate({ level: 1, experiencePoints: undefined as unknown as number }, campaign);
  assert.equal(gate.allowed, false);
  assert.equal(gate.reason, 'До 2 уровня не хватает 300 опыта');
});
