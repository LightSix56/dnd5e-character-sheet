import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES } from '../src/data/compendium/classes';
import {
  DND_CLASS_PROGRESSION,
  FULL_CASTER_SPELL_SLOTS,
  getSpellSlotsForClassLevel,
  getClassFeaturesForLevel,
  getClassSubclassLevel,
  isClassSubclassMilestone,
} from '../src/data/compendium/class-progression';
import { SUBCLASS_EXPANDED_SPELLS, SUBCLASS_FULL_CLASS_SPELLS } from '../src/data/compendium/class-spells';
import { getAutoGrantedSpellsForLevel } from '../src/data/compendium/auto-spells-engine';
import { getLevelUpChoicesConfig, METAMAGIC_OPTIONS } from '../src/components/levelup/level-up-choices';
import { createDefaultCharacter, CharacterData } from '../src/lib/dnd-types';

test('Sorcerer base class in compendium has correct core stats and saving throws', () => {
  const sorcerer = DND_COMPENDIUM_CLASSES.find(c => c.id === 'sorcerer');
  assert.ok(sorcerer, 'Sorcerer must exist in DND_COMPENDIUM_CLASSES');
  assert.strictEqual(sorcerer?.hitDieSize, 6);
  assert.strictEqual(sorcerer?.primaryAbility, 'ХАР');
  assert.deepStrictEqual(sorcerer?.savingThrowProfs, ['ТЕЛ', 'ХАР']);
  assert.strictEqual(sorcerer?.subclassLevel, 1);
});

test('Sorcerer has all 7 official subclasses with features at levels 1, 6, 14, 18', () => {
  const sorcerer = DND_COMPENDIUM_CLASSES.find(c => c.id === 'sorcerer');
  assert.ok(sorcerer, 'Sorcerer must exist');
  assert.strictEqual(sorcerer?.subclasses?.length, 7, `Expected 7 subclasses, found ${sorcerer?.subclasses?.length}`);

  const expectedSubclasses = [
    { id: 'draconic', nameEn: 'Draconic Bloodline' },
    { id: 'wild-magic', nameEn: 'Wild Magic' },
    { id: 'divine-soul', nameEn: 'Divine Soul' },
    { id: 'shadow-magic', nameEn: 'Shadow Magic' },
    { id: 'storm-sorcery', nameEn: 'Storm Sorcery' },
    { id: 'aberrant-mind', nameEn: 'Aberrant Mind' },
    { id: 'clockwork-soul', nameEn: 'Clockwork Soul' },
  ];

  for (const expected of expectedSubclasses) {
    const sub = sorcerer?.subclasses?.find(s => s.id === expected.id);
    assert.ok(sub, `Subclass ${expected.id} (${expected.nameEn}) must exist`);
    
    const levels = (sub?.features || []).map(f => f.level);
    assert.ok(levels.includes(1), `${expected.id} must have level 1 feature(s)`);
    assert.ok(levels.includes(6), `${expected.id} must have level 6 feature(s)`);
    assert.ok(levels.includes(14), `${expected.id} must have level 14 feature(s)`);
    assert.ok(levels.includes(18), `${expected.id} must have level 18 feature(s)`);
  }
});

test('Sorcerer class progression spans levels 1 to 20 with full caster spell slots', () => {
  const prog = DND_CLASS_PROGRESSION['Чародей'];
  assert.ok(prog, 'Sorcerer progression must exist');
  assert.strictEqual(prog.hitDie, 6);
  assert.strictEqual(prog.subclassLevel, 1);
  assert.deepStrictEqual(prog.subclassFeatureLevels, [1, 6, 14, 18]);
  assert.deepStrictEqual(prog.asiLevels, [4, 8, 12, 16, 19]);

  for (let lvl = 1; lvl <= 20; lvl++) {
    const features = getClassFeaturesForLevel('Чародей', lvl);
    assert.ok(features.length > 0, `Sorcerer must have features at level ${lvl}`);

    const slots = getSpellSlotsForClassLevel('Чародей', lvl);
    assert.deepStrictEqual(slots, FULL_CASTER_SPELL_SLOTS[lvl], `Level ${lvl} spell slots must match full caster table`);
  }

  assert.strictEqual(getClassSubclassLevel('Чародей'), 1);
  assert.strictEqual(isClassSubclassMilestone('Чародей', 1), true);
  assert.strictEqual(isClassSubclassMilestone('Чародей', 6), true);
  assert.strictEqual(isClassSubclassMilestone('Чародей', 14), true);
  assert.strictEqual(isClassSubclassMilestone('Чародей', 18), true);
  assert.strictEqual(isClassSubclassMilestone('Чародей', 5), false);
});

test('Divine Soul grants access to Cleric spells', () => {
  assert.strictEqual(SUBCLASS_FULL_CLASS_SPELLS['божественная душа'], 'Жрец');
});

test('Aberrant Mind auto-grants psionic spells across levels 1, 3, 5, 7, 9', () => {
  const char: CharacterData = {
    ...createDefaultCharacter(),
    name: 'Mind Master',
    className: 'Чародей',
    level: 1,
    subclass: 'Магия аберраций',
    abilityScores: { 'СИЛ': 10, 'ЛОВ': 14, 'ТЕЛ': 14, 'ИНТ': 10, 'МДР': 12, 'ХАР': 16 },
  };

  const lvl1Spells = getAutoGrantedSpellsForLevel(char, 1);
  const lvl1Names = lvl1Spells.map(s => s.name.toLowerCase());
  assert.ok(lvl1Names.includes('диссонирующий шёпот') || lvl1Names.includes('диссонирующий шепот'), 'Should grant Dissonant Whispers at lvl 1');
  assert.ok(lvl1Names.includes('руки хадара'), 'Should grant Arms of Hadar at lvl 1');
  assert.ok(lvl1Names.includes('расщепление разума'), 'Should grant Mind Sliver at lvl 1');

  const lvl3Spells = getAutoGrantedSpellsForLevel(char, 3);
  const lvl3Names = lvl3Spells.map(s => s.name.toLowerCase());
  assert.ok(lvl3Names.includes('обнаружение мыслей') || lvl3Names.includes('чтение мыслей'), 'Should grant Detect Thoughts at lvl 3');
  assert.ok(lvl3Names.includes('умиротворение'), 'Should grant Calm Emotions at lvl 3');

  const lvl5Spells = getAutoGrantedSpellsForLevel(char, 5);
  const lvl5Names = lvl5Spells.map(s => s.name.toLowerCase());
  assert.ok(lvl5Names.includes('голод хадара'), 'Should grant Hunger of Hadar at lvl 5');
  assert.ok(lvl5Names.includes('послание'), 'Should grant Sending at lvl 5');

  const lvl7Spells = getAutoGrantedSpellsForLevel(char, 7);
  const lvl7Names = lvl7Spells.map(s => s.name.toLowerCase());
  assert.ok(lvl7Names.includes('эвардовы чёрные щупальца') || lvl7Names.includes('черные щупальца эварда') || lvl7Names.includes('эвардовы черные щупальца'), 'Should grant Evard Black Tentacles at lvl 7');

  const lvl9Spells = getAutoGrantedSpellsForLevel(char, 9);
  const lvl9Names = lvl9Spells.map(s => s.name.toLowerCase());
  assert.ok(lvl9Names.includes('телекинез'), 'Should grant Telekinesis at lvl 9');
});

test('Clockwork Soul auto-grants clockwork magic across levels 1, 3, 5, 7, 9', () => {
  const char: CharacterData = {
    ...createDefaultCharacter(),
    name: 'Gear Master',
    className: 'Чародей',
    level: 1,
    subclass: 'Заводная душа',
    abilityScores: { 'СИЛ': 10, 'ЛОВ': 14, 'ТЕЛ': 14, 'ИНТ': 10, 'МДР': 12, 'ХАР': 16 },
  };

  const lvl1Spells = getAutoGrantedSpellsForLevel(char, 1);
  const lvl1Names = lvl1Spells.map(s => s.name.toLowerCase());
  assert.ok(lvl1Names.includes('сигнал тревоги') || lvl1Names.includes('тревога'), 'Should grant Alarm at lvl 1');
  assert.ok(lvl1Names.includes('защита от зла и добра') || lvl1Names.includes('защита от добра и зла'), 'Should grant Protection from Evil and Good at lvl 1');

  const lvl3Spells = getAutoGrantedSpellsForLevel(char, 3);
  const lvl3Names = lvl3Spells.map(s => s.name.toLowerCase());
  assert.ok(lvl3Names.includes('малое восстановление'), 'Should grant Lesser Restoration at lvl 3');
  assert.ok(lvl3Names.includes('подмога'), 'Should grant Aid at lvl 3');

  const lvl5Spells = getAutoGrantedSpellsForLevel(char, 5);
  const lvl5Names = lvl5Spells.map(s => s.name.toLowerCase());
  assert.ok(lvl5Names.includes('рассеивание магии') || lvl5Names.includes('развеять магию'), 'Should grant Dispel Magic at lvl 5');
  assert.ok(lvl5Names.includes('защита от энергии'), 'Should grant Protection from Energy at lvl 5');

  const lvl7Spells = getAutoGrantedSpellsForLevel(char, 7);
  const lvl7Names = lvl7Spells.map(s => s.name.toLowerCase());
  assert.ok(lvl7Names.includes('свобода перемещения') || lvl7Names.includes('свобода передвижения'), 'Should grant Freedom of Movement at lvl 7');

  const lvl9Spells = getAutoGrantedSpellsForLevel(char, 9);
  const lvl9Names = lvl9Spells.map(s => s.name.toLowerCase());
  assert.ok(lvl9Names.includes('высшее восстановление') || lvl9Names.includes('улучшенное восстановление'), 'Should grant Greater Restoration at lvl 9');
  assert.ok(lvl9Names.includes('силовая стена'), 'Should grant Wall of Force at lvl 9');
});

test('Shadow Magic auto-grants Darkness at level 3', () => {
  const char: CharacterData = {
    ...createDefaultCharacter(),
    name: 'Shadow Mage',
    className: 'Чародей',
    level: 3,
    subclass: 'Теневая магия',
    abilityScores: { 'СИЛ': 10, 'ЛОВ': 14, 'ТЕЛ': 14, 'ИНТ': 10, 'МДР': 12, 'ХАР': 16 },
  };

  const lvl3Spells = getAutoGrantedSpellsForLevel(char, 3);
  const lvl3Names = lvl3Spells.map(s => s.name.toLowerCase());
  assert.ok(lvl3Names.includes('тьма'), 'Should auto-grant Darkness at level 3 for Shadow Magic');
});

test('Sorcerer Metamagic and Subclass choices configured in level-up choices', () => {
  const char: CharacterData = {
    ...createDefaultCharacter(),
    name: 'Meta Sorcerer',
    className: 'Чародей',
    level: 1,
    subclass: 'Драконья кровь',
    abilityScores: { 'СИЛ': 10, 'ЛОВ': 14, 'ТЕЛ': 14, 'ИНТ': 10, 'МДР': 12, 'ХАР': 16 },
  };

  // Level 1 choices: Draconic Ancestor choice
  const config1 = getLevelUpChoicesConfig(char, 1, 'Драконья кровь');
  assert.ok(config1.needsDraconicAncestry, 'Should require draconic ancestry choice at level 1 for Draconic Bloodline');
  assert.ok((config1.draconicAncestryOptions || []).length >= 10, 'Should offer at least 10 dragon color/element options');

  // Level 1 choices: Divine Soul Affinity choice
  const configDivine = getLevelUpChoicesConfig(char, 1, 'Божественная душа');
  assert.ok(configDivine.needsDivineAffinity, 'Should require divine affinity choice at level 1 for Divine Soul');
  assert.ok((configDivine.divineAffinityOptions || []).length >= 5, 'Should offer at least 5 divine affinity options');

  // Level 3 choices: Metamagic (2 options)
  const config3 = getLevelUpChoicesConfig(char, 3);
  assert.strictEqual(config3.needsMetamagic, true);
  assert.strictEqual(config3.metamagicCount, 2);
  assert.ok((config3.metamagicOptions || []).length >= 8);

  // Level 10 choices: Metamagic (1 option)
  const config10 = getLevelUpChoicesConfig(char, 10);
  assert.strictEqual(config10.needsMetamagic, true);
  assert.strictEqual(config10.metamagicCount, 1);

  // Level 17 choices: Metamagic (1 option)
  const config17 = getLevelUpChoicesConfig(char, 17);
  assert.strictEqual(config17.needsMetamagic, true);
  assert.strictEqual(config17.metamagicCount, 1);
});
