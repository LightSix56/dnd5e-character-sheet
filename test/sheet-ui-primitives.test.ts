import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rollD20 } from '../src/components/sheet/SheetUIPrimitives.js';

describe('SheetUIPrimitives', () => {
  test('rollD20 produces numbers strictly between 1 and 20 with proper distribution', () => {
    const counts = new Map<number, number>();
    for (let i = 0; i < 1000; i++) {
      const roll = rollD20();
      assert.ok(Number.isInteger(roll), 'roll must be an integer');
      assert.ok(roll >= 1 && roll <= 20, `roll ${roll} must be between 1 and 20`);
      counts.set(roll, (counts.get(roll) || 0) + 1);
    }
    // All 20 numbers should have been rolled at least once in 1000 trials
    assert.equal(counts.size, 20, 'all faces 1-20 should be hit in 1000 rolls');
  });
});
