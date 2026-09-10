import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES } from '../src/data/compendium/classes';
import {
  DND_CLASS_PROGRESSION,
  FULL_CASTER_SPELL_SLOTS,
  getSpellSlotsForClassLevel,
  getClassSubclassLevel,
  isClassSubclassMilestone,
} from '../src/data/compendium/class-progression';
import { getAutoGrantedSpellsForLevel } from '../src/data/compendium/auto-spells-engine';
import { getLevelUpChoicesConfig, BLADESINGING_WEAPONS } from '../src/components/levelup/level-up-choices';
import { createDefaultCharacter, CharacterData } from '../src/lib/dnd-types';

test('Wizard base class in compendium has correct core stats and saving throws', () => {
  const wizard = DND_COMPENDIUM_CLASSES.find(c => c.id === 'wizard');
  assert.ok(wizard, 'Wizard must exist in DND_COMPENDIUM_CLASSES');
  assert.strictEqual(wizard?.hitDieSize, 6);
  assert.strictEqual(wizard?.primaryAbility, 'ИНТ');
  assert.deepStrictEqual(wizard?.savingThrowProfs, ['ИНТ', 'МДР']);
  assert.strictEqual(wizard?.subclassLevel, 2);
});

test('Wizard has all 12 official subclasses with features at levels 2, 6, 10, 14', () => {
  const wizard = DND_COMPENDIUM_CLASSES.find(c => c.id === 'wizard');
  assert.ok(wizard, 'Wizard must exist');
  assert.strictEqual(wizard?.subclasses?.length, 12, `Expected 12 subclasses, found ${wizard?.subclasses?.length}`);

  const expectedSubclasses = [
    { id: 'evocation', nameEn: 'School of Evocation' },
    { id: 'abjuration', nameEn: 'School of Abjuration' },
    { id: 'divination', nameEn: 'School of Divination' },
    { id: 'necromancy', nameEn: 'School of Necromancy' },
    { id: 'illusion', nameEn: 'School of Illusion' },
    { id: 'enchantment', nameEn: 'School of Enchantment' },
    { id: 'transmutation', nameEn: 'School of Transmutation' },
    { id: 'conjuration', nameEn: 'School of Conjuration' },
    { id: 'war-magic', nameEn: 'War Magic' },
    { id: 'bladesinging', nameEn: 'Bladesinging' },
    { id: 'scribes', nameEn: 'Order of Scribes' },
    { id: 'chronurgy', nameEn: 'Chronurgy Magic' },
  ];

  for (const expected of expectedSubclasses) {
    const sub = wizard?.subclasses?.find(s => s.id === expected.id);
    assert.ok(sub, `Subclass ${expected.id} (${expected.nameEn}) must exist`);
    
    const levels = (sub?.features || []).map(f => f.level);
    assert.ok(levels.includes(2), `${expected.id} must have level 2 feature(s)`);
    assert.ok(levels.includes(6), `${expected.id} must have level 6 feature(s)`);
    assert.ok(levels.includes(10), `${expected.id} must have level 10 feature(s)`);
    assert.ok(levels.includes(14), `${expected.id} must have level 14 feature(s)`);
  }
});

test('Wizard class progression spans levels 1 to 20 with full caster spell slots', () => {
  const prog = DND_CLASS_PROGRESSION['Волшебник'];
  assert.ok(prog, 'Progression for Волшебник must exist');
  assert.strictEqual(prog.subclassLevel, 2);
  assert.deepStrictEqual(prog.subclassFeatureLevels, [2, 6, 10, 14]);

  for (let lvl = 1; lvl <= 20; lvl++) {
    const slots = getSpellSlotsForClassLevel('Волшебник', lvl);
    assert.deepStrictEqual(slots, FULL_CASTER_SPELL_SLOTS[lvl], `Slots mismatch at level ${lvl}`);
  }

  assert.strictEqual(getClassSubclassLevel('Волшебник'), 2);
  assert.strictEqual(isClassSubclassMilestone('Волшебник', 2), true);
  assert.strictEqual(isClassSubclassMilestone('Волшебник', 6), true);
  assert.strictEqual(isClassSubclassMilestone('Волшебник', 10), true);
  assert.strictEqual(isClassSubclassMilestone('Волшебник', 14), true);
  assert.strictEqual(isClassSubclassMilestone('Волшебник', 5), false);
});

test('School of Illusion auto-grants Minor Illusion at level 2', () => {
  const char: CharacterData = {
    ...createDefaultCharacter(),
    name: 'Illusionist',
    className: 'Волшебник',
    level: 2,
    subclass: 'Школа Иллюзии',
    abilityScores: { 'СИЛ': 8, 'ЛОВ': 14, 'ТЕЛ': 14, 'ИНТ': 16, 'МДР': 12, 'ХАР': 10 },
  };

  const lvl2Spells = getAutoGrantedSpellsForLevel(char, 2);
  const lvl2Names = lvl2Spells.map(s => s.name.toLowerCase());
  assert.ok(lvl2Names.includes('малая иллюзия') || lvl2Names.includes('маленькая иллюзия'), 'Should grant Minor Illusion at lvl 2');
});

test('School of Necromancy auto-grants Animate Dead at level 6', () => {
  const char: CharacterData = {
    ...createDefaultCharacter(),
    name: 'Necromancer',
    className: 'Волшебник',
    level: 6,
    subclass: 'Школа Некромантии',
    abilityScores: { 'СИЛ': 8, 'ЛОВ': 14, 'ТЕЛ': 14, 'ИНТ': 16, 'МДР': 12, 'ХАР': 10 },
  };

  const lvl6Spells = getAutoGrantedSpellsForLevel(char, 6);
  const lvl6Names = lvl6Spells.map(s => s.name.toLowerCase());
  assert.ok(
    lvl6Names.includes('восставший труп') ||
    lvl6Names.includes('восставший из мёртвых') ||
    lvl6Names.includes('восставший из мертвых') ||
    lvl6Names.includes('оживление нежити'),
    'Should grant Animate Dead at level 6 for Necromancy'
  );
});

test('Bladesinging weapon and training choices configured in level-up choices', () => {
  const char: CharacterData = {
    ...createDefaultCharacter(),
    name: 'Bladesinger',
    className: 'Волшебник',
    level: 1,
    subclass: '',
    abilityScores: { 'СИЛ': 8, 'ЛОВ': 16, 'ТЕЛ': 14, 'ИНТ': 16, 'МДР': 10, 'ХАР': 10 },
  };

  // Level 2 choices when selecting Bladesinging
  const config2 = getLevelUpChoicesConfig(char, 2, 'Песнь клинка');
  assert.ok(config2.needsBladesingingWeapon, 'Should require bladesinging weapon choice at level 2');
  assert.ok(Array.isArray(config2.bladesingingWeaponOptions) && config2.bladesingingWeaponOptions.length >= 6);
  assert.ok(BLADESINGING_WEAPONS.length >= 6);
});

test('Spell Mastery and Signature Spells configured at levels 18 and 20', () => {
  const char: CharacterData = {
    ...createDefaultCharacter(),
    name: 'Archmage',
    className: 'Волшебник',
    level: 17,
    subclass: 'Школа Воплощения',
    abilityScores: { 'СИЛ': 8, 'ЛОВ': 14, 'ТЕЛ': 14, 'ИНТ': 20, 'МДР': 12, 'ХАР': 10 },
  };

  // Level 18: Spell Mastery
  const config18 = getLevelUpChoicesConfig(char, 18);
  assert.ok(config18.needsSpellMastery, 'Should require Spell Mastery at level 18');

  // Level 20: Signature Spells
  const char19: CharacterData = { ...char, level: 19 };
  const config20 = getLevelUpChoicesConfig(char19, 20);
  assert.ok(config20.needsSignatureSpells, 'Should require Signature Spells at level 20');
});
