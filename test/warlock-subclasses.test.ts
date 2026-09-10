import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES } from '../src/data/compendium/classes';
import { DND_CLASS_PROGRESSION, WARLOCK_PACT_SPELL_SLOTS } from '../src/data/compendium/class-progression';

test('Warlock class has all 9 official subclasses with features at levels 1, 6, 10, 14', () => {
  const warlock = DND_COMPENDIUM_CLASSES.find(c => c.id === 'warlock');
  assert.ok(warlock, 'Warlock class must exist in compendium');
  assert.strictEqual(warlock?.subclasses?.length, 9, `Expected 9 subclasses, got ${warlock?.subclasses?.length}`);

  const expectedIds = [
    'fiend',
    'hexblade',
    'archfey',
    'great-old-one',
    'celestial',
    'fathomless',
    'genie',
    'undead',
    'undying'
  ];

  for (const id of expectedIds) {
    const sub = warlock?.subclasses?.find(s => s.id === id);
    assert.ok(sub, `Subclass ${id} should exist`);
    const levels = (sub?.features || []).map(f => f.level);
    assert.ok(levels.includes(1), `${id} must have level 1 feature`);
    assert.ok(levels.includes(6), `${id} must have level 6 feature`);
    assert.ok(levels.includes(10), `${id} must have level 10 feature`);
    assert.ok(levels.includes(14), `${id} must have level 14 feature`);
  }
});

test('Warlock progression has accurate pact slots progression', () => {
  const warlockProg = DND_CLASS_PROGRESSION['Колдун'];
  assert.ok(warlockProg, 'Warlock progression must exist');
  assert.deepStrictEqual(warlockProg.subclassFeatureLevels, [1, 6, 10, 14]);

  // Level 1: 1 slot of 1st circle
  assert.strictEqual(WARLOCK_PACT_SPELL_SLOTS[1][1], 1);

  // Level 2: 2 slots of 1st circle
  assert.strictEqual(WARLOCK_PACT_SPELL_SLOTS[2][1], 2);

  // Level 5: 2 slots of 3rd circle
  assert.strictEqual(WARLOCK_PACT_SPELL_SLOTS[5][3], 2);

  // Level 9: 2 slots of 5th circle
  assert.strictEqual(WARLOCK_PACT_SPELL_SLOTS[9][5], 2);

  // Level 11: 3 slots of 5th circle
  assert.strictEqual(WARLOCK_PACT_SPELL_SLOTS[11][5], 3);

  // Level 17: 4 slots of 5th circle
  assert.strictEqual(WARLOCK_PACT_SPELL_SLOTS[17][5], 4);
});
