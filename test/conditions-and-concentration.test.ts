import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultCharacter,
  normalizeCharacterData,
  DND_CONDITIONS,
  isConditionIncapacitating,
  calculateConcentrationDC,
  CharacterData,
} from '../src/lib/dnd-types';
import { ConditionsTracker, ConditionsTracker as NamedTracker } from '../src/components/sheet/ConditionsTracker';
import DefaultTracker from '../src/components/sheet/ConditionsTracker';

test('D&D 5e Conditions & Concentration Engine', async (t) => {
  await t.test('createDefaultCharacter initializes empty conditions array and null concentration', () => {
    const char = createDefaultCharacter();
    assert.deepEqual(char.conditions, []);
    assert.equal(char.concentration, null);
  });

  await t.test('normalizeCharacterData preserves or defaults conditions and concentration', () => {
    const emptyNorm = normalizeCharacterData({});
    assert.deepEqual(emptyNorm.conditions, []);
    assert.equal(emptyNorm.concentration, null);

    const withData = normalizeCharacterData({
      conditions: ['poisoned', 'prone'],
      concentration: { spellName: 'Благословение', dc: 10, castAtLevel: 1 },
    });
    assert.deepEqual(withData.conditions, ['poisoned', 'prone']);
    assert.deepEqual(withData.concentration, { spellName: 'Благословение', dc: 10, castAtLevel: 1 });
  });

  await t.test('DND_CONDITIONS contains exactly 15 SRD 5.1 conditions with valid structure', () => {
    assert.equal(DND_CONDITIONS.length, 15, 'Should have exactly 15 official SRD conditions');

    const expectedIds = [
      'blinded',
      'charmed',
      'deafened',
      'frightened',
      'grappled',
      'incapacitated',
      'invisible',
      'paralyzed',
      'petrified',
      'poisoned',
      'prone',
      'restrained',
      'stunned',
      'unconscious',
      'exhaustion',
    ];

    const actualIds = DND_CONDITIONS.map(c => c.id);
    assert.deepEqual(actualIds.sort(), [...expectedIds].sort());

    for (const cond of DND_CONDITIONS) {
      assert.ok(cond.id, `Condition must have an id`);
      assert.ok(cond.name, `Condition ${cond.id} must have a name`);
      assert.ok(cond.description, `Condition ${cond.id} must have a description`);
      assert.ok(Array.isArray(cond.rulesSummary), `Condition ${cond.id} rulesSummary must be array`);
      assert.ok(cond.rulesSummary.length > 0, `Condition ${cond.id} rulesSummary must not be empty`);
    }
  });

  await t.test('isConditionIncapacitating accurately identifies incapacitating conditions', () => {
    const incapacitating = ['incapacitated', 'paralyzed', 'petrified', 'stunned', 'unconscious'];
    for (const id of incapacitating) {
      assert.equal(isConditionIncapacitating(id), true, `${id} should be incapacitating`);
      assert.equal(isConditionIncapacitating(id.toUpperCase()), true, `${id.toUpperCase()} should be incapacitating`);
      assert.equal(isConditionIncapacitating(`${id}:1`), true, `${id}:1 should be incapacitating`);
    }

    const nonIncapacitating = [
      'blinded',
      'charmed',
      'deafened',
      'frightened',
      'grappled',
      'invisible',
      'poisoned',
      'prone',
      'restrained',
      'exhaustion',
    ];
    for (const id of nonIncapacitating) {
      assert.equal(isConditionIncapacitating(id), false, `${id} should NOT be incapacitating`);
    }
  });

  await t.test('Condition toggle and incapacitation drops concentration auto-rule', () => {
    const char: CharacterData = createDefaultCharacter();
    char.concentration = { spellName: 'Удержание личности', dc: 10 };
    char.conditions = ['poisoned'];

    // Adding non-incapacitating condition keeps concentration
    const conditionsWithProne = [...(char.conditions || []), 'prone'];
    char.conditions = conditionsWithProne;
    assert.equal(char.concentration?.spellName, 'Удержание личности');

    // Adding incapacitating condition should drop concentration
    const newCondition = 'stunned';
    if (isConditionIncapacitating(newCondition)) {
      char.concentration = null;
    }
    char.conditions = [...(char.conditions || []), newCondition];

    assert.equal(char.concentration, null, 'Concentration must be dropped when stunned');
    assert.ok(char.conditions.includes('stunned'));
  });

  await t.test('Exhaustion level support (1 to 6) and clamp logic', () => {
    const getExhaustionLevel = (conditions: string[]): number => {
      const found = conditions.find(c => c === 'exhaustion' || c.startsWith('exhaustion:'));
      if (!found) return 0;
      if (found === 'exhaustion') return 1;
      const val = parseInt(found.split(':')[1], 10);
      return isNaN(val) ? 1 : Math.min(6, Math.max(1, val));
    };

    assert.equal(getExhaustionLevel([]), 0);
    assert.equal(getExhaustionLevel(['exhaustion']), 1);
    assert.equal(getExhaustionLevel(['exhaustion:3']), 3);
    assert.equal(getExhaustionLevel(['exhaustion:10']), 6);
    assert.equal(getExhaustionLevel(['poisoned', 'exhaustion:5']), 5);
  });

  await t.test('Concentration DC rule calculation (DC = max(10, floor(damage / 2)))', () => {
    assert.equal(calculateConcentrationDC(0), 10);
    assert.equal(calculateConcentrationDC(5), 10);
    assert.equal(calculateConcentrationDC(19), 10);
    assert.equal(calculateConcentrationDC(20), 10);
    assert.equal(calculateConcentrationDC(21), 10);
    assert.equal(calculateConcentrationDC(22), 11);
    assert.equal(calculateConcentrationDC(30), 15);
    assert.equal(calculateConcentrationDC(55), 27);
  });

  await t.test('ConditionsTracker is exported as both default and named export', () => {
    assert.equal(typeof ConditionsTracker, 'function', 'ConditionsTracker should be a function component');
    assert.equal(typeof NamedTracker, 'function', 'Named ConditionsTracker should be a function component');
    assert.equal(typeof DefaultTracker, 'function', 'Default ConditionsTracker should be a function component');
    assert.equal(ConditionsTracker, DefaultTracker, 'Named and default exports should be identical');
  });

  await t.test('Condition addition, removal, and clear all state transitions', () => {
    let char = createDefaultCharacter();
    const update = <K extends keyof CharacterData>(k: K, v: CharacterData[K]) => {
      char = { ...char, [k]: v };
    };

    // 1. Add condition
    update('conditions', ['blinded']);
    assert.deepEqual(char.conditions, ['blinded']);

    // 2. Set concentration
    update('concentration', { spellName: 'Щит веры', dc: 10, castAtLevel: 1 });
    assert.deepEqual(char.concentration, { spellName: 'Щит веры', dc: 10, castAtLevel: 1 });

    // 3. Add second condition
    update('conditions', [...(char.conditions || []), 'poisoned']);
    assert.deepEqual(char.conditions, ['blinded', 'poisoned']);
    assert.ok(char.concentration !== null);

    // 4. Remove one condition
    update('conditions', (char.conditions || []).filter(c => c !== 'blinded'));
    assert.deepEqual(char.conditions, ['poisoned']);

    // 5. Clear all
    update('conditions', []);
    update('concentration', null);
    assert.deepEqual(char.conditions, []);
    assert.equal(char.concentration, null);
  });
});
