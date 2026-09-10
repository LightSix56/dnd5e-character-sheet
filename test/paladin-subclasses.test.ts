import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES, getSubclassesForClass } from '../src/data/compendium/classes';
import { SUBCLASS_EXPANDED_SPELLS } from '../src/data/compendium/class-spells';
import { getAutoGrantedSpellsForLevel } from '../src/data/compendium/auto-spells-engine';
import { getSpellSlotsForClassLevel, getClassFeaturesForLevel, getClassSubclassLevel } from '../src/data/compendium/class-progression';
import { getLevelUpChoicesConfig } from '../src/components/levelup/level-up-choices';
import { createDefaultCharacter } from '../src/lib/dnd-types';

const EXPECTED_PALADIN_SUBCLASSES = [
  { id: 'devotion', name: 'Клятва преданности', nameEn: 'Oath of Devotion', source: 'PHB' },
  { id: 'ancients', name: 'Клятва древних', nameEn: 'Oath of the Ancients', source: 'PHB' },
  { id: 'vengeance', name: 'Клятва мести', nameEn: 'Oath of Vengeance', source: 'PHB' },
  { id: 'crown', name: 'Клятва короны', nameEn: 'Oath of the Crown', source: 'SCAG' },
  { id: 'conquest', name: 'Клятва покорения', nameEn: 'Oath of Conquest', source: 'XGE' },
  { id: 'redemption', name: 'Клятва искупления', nameEn: 'Oath of Redemption', source: 'XGE' },
  { id: 'glory', name: 'Клятва славы', nameEn: 'Oath of Glory', source: 'TCE' },
  { id: 'watchers', name: 'Клятва часовых', nameEn: 'Oath of the Watchers', source: 'TCE' },
  { id: 'oathbreaker', name: 'Клятвопреступник', nameEn: 'Oathbreaker', source: 'DMG' },
];

test('Paladin Subclasses: Exactly 9 official subclasses exist from dnd.su', () => {
  const paladinClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'paladin');
  assert.ok(paladinClass, 'Paladin class must exist in compendium');
  assert.equal(paladinClass.subclasses.length, 9, 'Must have exactly 9 official subclasses');

  for (const expected of EXPECTED_PALADIN_SUBCLASSES) {
    const found = paladinClass.subclasses.find(s => s.id === expected.id);
    assert.ok(found, `Subclass ${expected.id} (${expected.name}) must exist`);
    assert.equal(found.name, expected.name);
    assert.equal(found.nameEn, expected.nameEn);
    assert.equal(found.source, expected.source);
  }
});

test('Paladin Subclasses: Every subclass has features for levels 3, 7, 15, and 20', () => {
  const paladinClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'paladin')!;
  const expectedLevels = [3, 7, 15, 20];

  for (const sub of paladinClass.subclasses) {
    for (const lvl of expectedLevels) {
      const featAtLvl = sub.features.filter(f => f.level === lvl);
      assert.ok(
        featAtLvl.length > 0,
        `Subclass "${sub.name}" must have at least one feature at level ${lvl}`
      );
      for (const feat of featAtLvl) {
        assert.ok(feat.name && feat.name.length > 0, `Feature at lvl ${lvl} in ${sub.name} must have a name`);
        assert.ok(feat.description && feat.description.length > 0, `Feature at lvl ${lvl} in ${sub.name} must have description`);
      }
    }
  }
});

test('Paladin Oath Spells: All 9 subclasses have exactly 10 oath spells in SUBCLASS_EXPANDED_SPELLS', () => {
  const oathKeys = [
    'клятва преданности',
    'клятва древних',
    'клятва мести',
    'клятва короны',
    'клятва покорения',
    'клятва искупления',
    'клятва славы',
    'клятва часовых',
    'клятвопреступник',
  ];

  for (const key of oathKeys) {
    const spells = SUBCLASS_EXPANDED_SPELLS[key];
    assert.ok(spells, `Oath spells for "${key}" must be registered in SUBCLASS_EXPANDED_SPELLS`);
    assert.equal(spells.length, 10, `Oath "${key}" must have exactly 10 oath spells (2 per circle)`);
  }
});

test('Paladin Auto-Spells Engine: Grants Divine Smite at level 2 and Oath spells at 3, 5, 9, 13, 17', () => {
  const char = createDefaultCharacter();
  char.className = 'Паладин';
  char.level = 1;

  // Level 2: Divine Smite
  const lvl2Spells = getAutoGrantedSpellsForLevel(char, 2);
  assert.ok(
    lvl2Spells.some(s => s.name === 'Божественная кара'),
    'Paladin level 2 must automatically receive Divine Smite'
  );

  // Level 3: Oath spells (using Oath of Devotion)
  char.subclass = 'Клятва преданности';
  const lvl3Spells = getAutoGrantedSpellsForLevel(char, 3);
  assert.equal(lvl3Spells.length, 2, 'Level 3 must grant 2 oath spells');
  assert.ok(lvl3Spells.some(s => s.name === 'Защита от Зла и Добра' || s.name.toLowerCase().includes('защита от')));
  assert.ok(lvl3Spells.some(s => s.name === 'Убежище'));

  // Level 5: 2nd circle oath spells
  const lvl5Spells = getAutoGrantedSpellsForLevel(char, 5);
  assert.equal(lvl5Spells.length, 2, 'Level 5 must grant 2 2nd-circle oath spells');
  assert.ok(lvl5Spells.some(s => s.name === 'Малое восстановление'));
  assert.ok(lvl5Spells.some(s => s.name === 'Зона правды'));

  // Level 9: 3rd circle oath spells
  const lvl9Spells = getAutoGrantedSpellsForLevel(char, 9);
  assert.equal(lvl9Spells.length, 2, 'Level 9 must grant 2 3rd-circle oath spells');
  assert.ok(lvl9Spells.some(s => s.name === 'Маяк надежды'));
  assert.ok(lvl9Spells.some(s => s.name === 'Рассеивание магии'));

  // Level 13: 4th circle oath spells
  const lvl13Spells = getAutoGrantedSpellsForLevel(char, 13);
  assert.equal(lvl13Spells.length, 2, 'Level 13 must grant 2 4th-circle oath spells');
  assert.ok(lvl13Spells.some(s => s.name === 'Свобода движений'));
  assert.ok(lvl13Spells.some(s => s.name === 'Страж веры'));

  // Level 17: 5th circle oath spells
  const lvl17Spells = getAutoGrantedSpellsForLevel(char, 17);
  assert.equal(lvl17Spells.length, 2, 'Level 17 must grant 2 5th-circle oath spells');
  assert.ok(lvl17Spells.some(s => s.name === 'Освящение'));
  assert.ok(lvl17Spells.some(s => s.name === 'Общение'));
});

test('Paladin Level-Up Choices: Fighting Style at level 2, Subclass at level 3', () => {
  const char = createDefaultCharacter();
  char.className = 'Паладин';
  char.level = 1;

  // Level 2 choice
  const cfg2 = getLevelUpChoicesConfig(char, 2);
  assert.equal(cfg2.needsFightingStyle, true, 'Paladin level 2 needs Fighting Style');
  assert.ok(cfg2.fightingStyleOptions && cfg2.fightingStyleOptions.length >= 4);
  const fsIds = cfg2.fightingStyleOptions.map(f => f.id);
  assert.ok(fsIds.includes('defense'));
  assert.ok(fsIds.includes('dueling'));
  assert.ok(fsIds.includes('great-weapon'));
  assert.ok(fsIds.includes('protection'));

  // Subclass requirement level in progression rules
  const reqLvl = getClassSubclassLevel('Паладин');
  assert.equal(reqLvl, 3, 'Paladin must choose Sacred Oath at level 3');
});

test('Paladin Half-Caster Spell Slot Progression: Accurate 1-20 slots', () => {
  assert.deepEqual(getSpellSlotsForClassLevel('Паладин', 1), {});
  assert.deepEqual(getSpellSlotsForClassLevel('Паладин', 2), { 1: 2 });
  assert.deepEqual(getSpellSlotsForClassLevel('Паладин', 3), { 1: 3 });
  assert.deepEqual(getSpellSlotsForClassLevel('Паладин', 4), { 1: 3 });
  assert.deepEqual(getSpellSlotsForClassLevel('Паладин', 5), { 1: 4, 2: 2 });
  assert.deepEqual(getSpellSlotsForClassLevel('Паладин', 9), { 1: 4, 2: 3, 3: 2 });
  assert.deepEqual(getSpellSlotsForClassLevel('Паладин', 13), { 1: 4, 2: 3, 3: 3, 4: 1 });
  assert.deepEqual(getSpellSlotsForClassLevel('Паладин', 17), { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 });
  assert.deepEqual(getSpellSlotsForClassLevel('Паладин', 20), { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 });
});

test('Paladin Progression Simulation: Full 1 -> 20 level up across all 9 subclasses', () => {
  for (const expected of EXPECTED_PALADIN_SUBCLASSES) {
    const char = createDefaultCharacter();
    char.className = 'Паладин';
    char.subclass = expected.name;

    for (let lvl = 1; lvl <= 20; lvl++) {
      char.level = lvl;
      const feats = getClassFeaturesForLevel('Паладин', lvl);
      assert.ok(Array.isArray(feats), `Level ${lvl} features for ${expected.name} must be an array`);

      const subObj = getSubclassesForClass('Паладин').find(s => s.name === expected.name);
      assert.ok(subObj, `Subclass object ${expected.name} must exist`);
      const subFeats = subObj.features.filter(f => f.level === lvl);
      assert.ok(Array.isArray(subFeats), `Subclass level ${lvl} features for ${expected.name} must be an array`);

      const autoSpells = getAutoGrantedSpellsForLevel(char, lvl);
      assert.ok(Array.isArray(autoSpells), `Auto-spells at level ${lvl} for ${expected.name} must be an array`);
    }
  }
});
