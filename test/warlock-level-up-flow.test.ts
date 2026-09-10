import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter, CharacterData } from '../src/lib/dnd-types';
import { getLevelUpChoicesConfig } from '../src/components/levelup/level-up-choices';
import { getSpellSlotsForClassLevel } from '../src/data/compendium';

test('Warlock Level-Up Progression Flow & Choices', async (t) => {
  await t.test('1 -> 2: Warlock gains 2 invocations and 2 1st-circle pact slots', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Колдун',
      level: 1,
      subclass: 'Исчадие',
      cantrips: ['Мистический заряд'],
      spellSlots: { 1: { totalSlots: 1, expendedSlots: 0 } },
    };

    const config = getLevelUpChoicesConfig(char, 2);
    assert.strictEqual(config.needsInvocations, true);
    assert.strictEqual(config.invocationsCount, 2);

    const slots = getSpellSlotsForClassLevel('Колдун', 2);
    assert.deepStrictEqual(slots, { 1: 2 });
  });

  await t.test('2 -> 3: Warlock chooses Pact Boon and upgrades pact slots to 2nd circle', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Колдун',
      level: 2,
      subclass: 'Исчадие',
      cantrips: ['Мистический заряд'],
      spellSlots: { 1: { totalSlots: 2, expendedSlots: 0 } },
      traitsList: [
        {
          id: 'invocation-agonizing-blast',
          name: 'Таинственное воззвание: Мучительный взрыв',
          source: 'Колдун (2 ур.)',
          summary: 'Мучительный взрыв'
        },
        {
          id: 'invocation-armor-of-shadows',
          name: 'Таинственное воззвание: Броня теней',
          source: 'Колдун (2 ур.)',
          summary: 'Броня теней'
        }
      ]
    };

    const config = getLevelUpChoicesConfig(char, 3);
    assert.strictEqual(config.needsPactBoon, true);
    assert.strictEqual(config.pactBoonOptions?.length, 4);

    const slots = getSpellSlotsForClassLevel('Колдун', 3);
    assert.deepStrictEqual(slots, { 2: 2 }); // Upgraded to 2nd level slots only
  });

  await t.test('Level 10 Fiend: Grants Fiendish Resilience choice', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Колдун',
      level: 9,
      subclass: 'Исчадие',
      traitsList: [
        {
          id: 'pact-boon-blade',
          name: 'Договор клинка',
          source: 'Колдун (3 ур.)',
          summary: 'Оружие пакта'
        }
      ]
    };

    const config = getLevelUpChoicesConfig(char, 10);
    assert.strictEqual(config.needsFiendResilience, true);
    assert.ok(config.fiendResilienceOptions?.includes('огонь'));
    assert.ok(config.fiendResilienceOptions?.includes('холод'));
  });

  await t.test('Level 11: Grants Mystic Arcanum 6th circle and 3 pact slots of 5th circle', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Колдун',
      level: 10,
      subclass: 'Архифея',
    };

    const config = getLevelUpChoicesConfig(char, 11);
    assert.strictEqual(config.needsMysticArcanum, true);
    assert.strictEqual(config.arcanumCircle, 6);
    assert.ok(config.arcanumOptions?.length! > 0);

    const slots = getSpellSlotsForClassLevel('Колдун', 11);
    assert.deepStrictEqual(slots, { 5: 3 }); // 3 slots of 5th circle
  });

  await t.test('Level 17: Grants Mystic Arcanum 9th circle and 4 pact slots of 5th circle', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Колдун',
      level: 16,
      subclass: 'Архифея',
    };

    const config = getLevelUpChoicesConfig(char, 17);
    assert.strictEqual(config.needsMysticArcanum, true);
    assert.strictEqual(config.arcanumCircle, 9);
    assert.ok(config.arcanumOptions?.includes('Слово силы: смерть'));
    assert.ok(config.arcanumOptions?.includes('Истинное превращение'));

    const slots = getSpellSlotsForClassLevel('Колдун', 17);
    assert.deepStrictEqual(slots, { 5: 4 }); // 4 slots of 5th circle
  });
});
