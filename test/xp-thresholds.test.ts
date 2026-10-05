import test from 'node:test';
import assert from 'node:assert/strict';
import {
  XP_THRESHOLDS,
  xpRequiredForLevel,
  canLevelUpWithXp,
  xpMissingForNextLevel,
} from '../src/lib/xp-thresholds';

test('thresholds match D&D 5e', () => {
  assert.equal(xpRequiredForLevel(1), 0);
  assert.equal(xpRequiredForLevel(2), 300);
  assert.equal(xpRequiredForLevel(5), 6500);
  assert.equal(xpRequiredForLevel(11), 85000);
  assert.equal(xpRequiredForLevel(20), 355000);
  assert.equal(XP_THRESHOLDS.length, 21);
});

test('level-up allowed only at threshold', () => {
  assert.equal(canLevelUpWithXp(1, 299), false);
  assert.equal(canLevelUpWithXp(1, 300), true);
  assert.equal(canLevelUpWithXp(4, 6499), false);
  assert.equal(canLevelUpWithXp(4, 6500), true);
  assert.equal(canLevelUpWithXp(20, 999999), false);
  assert.equal(xpMissingForNextLevel(1, 120), 180);
  assert.equal(xpMissingForNextLevel(1, 500), 0);
  assert.equal(xpMissingForNextLevel(20, 0), 0);
});

test('garbage input is treated as zero xp / level 1', () => {
  assert.equal(canLevelUpWithXp(NaN as number, undefined as unknown as number), false);
  assert.equal(xpMissingForNextLevel(undefined as unknown as number, '250' as unknown as number), 50);
  assert.equal(xpRequiredForLevel(0), 0);
  assert.equal(xpRequiredForLevel(99), 355000);
});
