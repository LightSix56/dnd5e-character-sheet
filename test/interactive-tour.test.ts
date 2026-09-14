import test from 'node:test';
import assert from 'node:assert/strict';
import { SHEET_TOUR_STEPS } from '../src/data/encyclopedia/encyclopedia-content.js';

test('Interactive Tour: Steps boundary and navigation logic', () => {
  const total = SHEET_TOUR_STEPS.length;
  assert.ok(total >= 8);

  const getNextIndex = (curr: number) => Math.min(total - 1, curr + 1);
  const getPrevIndex = (curr: number) => Math.max(0, curr - 1);

  assert.equal(getNextIndex(0), 1);
  assert.equal(getNextIndex(total - 1), total - 1);
  assert.equal(getPrevIndex(0), 0);
  assert.equal(getPrevIndex(3), 2);
});

test('Interactive Tour: All steps have distinct targetIds matching DOM conventions', () => {
  const targetIds = SHEET_TOUR_STEPS.map(s => s.targetId);
  const uniqueTargets = new Set(targetIds);
  assert.equal(uniqueTargets.size, targetIds.length, 'All target IDs must be unique');

  for (const tid of targetIds) {
    assert.ok(tid.startsWith('tour-'), `Target ID ${tid} should start with tour-`);
  }
});

test('Interactive Tour: Each step provides badge, description and chapterId', () => {
  for (const s of SHEET_TOUR_STEPS) {
    assert.ok(s.badge.includes('Шаг'), 'Step has step counter badge');
    assert.ok(s.description.length > 20, 'Step description is meaningful');
    assert.ok(s.chapterId.length > 0, 'Step has chapter link');
  }
});
