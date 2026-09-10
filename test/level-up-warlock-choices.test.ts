import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevelUpChoicesConfig } from '../src/components/levelup/level-up-choices';
import { getAutoGrantedSpellsForLevel } from '../src/data/compendium/auto-spells-engine';
import { CharacterData } from '../src/lib/dnd-types';

const baseChar: CharacterData = {
  id: 'test-warlock',
  name: 'Колдун Тест',
  race: 'Человек',
  className: 'Колдун',
  level: 1,
  subclass: 'Исчадие',
  spellsByLevel: { 0: [{ name: 'Мистический заряд', prepared: true }], 1: [] },
  traitsList: [],
  spellSlots: { 1: { total: 1, current: 1 } },
  stats: { СИЛ: 10, ЛОВ: 14, ТЕЛ: 14, ИНТ: 10, МДР: 12, ХАР: 16 },
} as unknown as CharacterData;

test('Warlock level 1 requires patron if no subclass is set', () => {
  const noSubChar = { ...baseChar, subclass: '' };
  const config = getLevelUpChoicesConfig(noSubChar, 1);
  assert.strictEqual(config.needsWarlockPatron, true);
});

test('Warlock level 1 with Genie requires genie kind', () => {
  const genieChar = { ...baseChar, subclass: 'Джинн' };
  const config = getLevelUpChoicesConfig(genieChar, 1);
  assert.strictEqual(config.needsGenieKind, true);
});

test('Warlock level 2 grants 2 invocations with Eldritch Blast filtered', () => {
  const config = getLevelUpChoicesConfig(baseChar, 2);
  assert.strictEqual(config.needsInvocations, true);
  assert.strictEqual(config.invocationsCount, 2);
  assert.ok(config.eligibleInvocations && config.eligibleInvocations.length >= 10);
  assert.ok(config.eligibleInvocations?.some(i => i.id === 'agonizing-blast'));
});

test('Warlock level 3 grants Pact Boon choice', () => {
  const config = getLevelUpChoicesConfig(baseChar, 3);
  assert.strictEqual(config.needsPactBoon, true);
  assert.strictEqual(config.canSwapInvocation, true);
});

test('Warlock level 5 grants 1 invocation and unlocks 5th-level invocations', () => {
  const bladeChar: CharacterData = {
    ...baseChar,
    level: 4,
    traitsList: [{ id: 'pact-blade', name: 'Предмет договора: Договор клинка', source: 'Колдун' }],
  } as unknown as CharacterData;
  const config = getLevelUpChoicesConfig(bladeChar, 5);
  assert.strictEqual(config.needsInvocations, true);
  assert.strictEqual(config.invocationsCount, 1);
  assert.ok(config.eligibleInvocations?.some(i => i.id === 'thirsting-blade'));
});

test('Warlock level 10 Fiend grants Fiendish Resilience choice', () => {
  const fiendChar = { ...baseChar, level: 9, subclass: 'Исчадие' };
  const config = getLevelUpChoicesConfig(fiendChar, 10);
  assert.strictEqual(config.needsFiendResilience, true);
});

test('Warlock level 11 grants Mystic Arcanum 6th circle', () => {
  const char10 = { ...baseChar, level: 10 };
  const config = getLevelUpChoicesConfig(char10, 11);
  assert.strictEqual(config.needsMysticArcanum, true);
  assert.strictEqual(config.arcanumCircle, 6);
  assert.ok(config.arcanumOptions && config.arcanumOptions.length > 0);
});

test('Warlock level 17 grants Mystic Arcanum 9th circle', () => {
  const char16 = { ...baseChar, level: 16 };
  const config = getLevelUpChoicesConfig(char16, 17);
  assert.strictEqual(config.needsMysticArcanum, true);
  assert.strictEqual(config.arcanumCircle, 9);
  assert.ok(config.arcanumOptions && config.arcanumOptions.includes('Слово силы: смерть'));
});

test('Celestial warlock gets bonus cantrips at level 1 via auto-spells', () => {
  const char = { ...baseChar, subclass: 'Небожитель' };
  const auto = getAutoGrantedSpellsForLevel(char, 1, 'Небожитель');
  assert.ok(auto.some(s => s.name === 'Священное пламя'));
  assert.ok(auto.some(s => s.name === 'Свет'));
});

test('Undying warlock gets Spare the Dying cantrip at level 1 via auto-spells', () => {
  const char = { ...baseChar, subclass: 'Бессмертный' };
  const auto = getAutoGrantedSpellsForLevel(char, 1, 'Бессмертный');
  assert.ok(auto.some(s => s.name === 'Уход за умирающим'));
});
