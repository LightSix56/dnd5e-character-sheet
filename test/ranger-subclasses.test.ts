import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES, getSubclassesForClass } from '../src/data/compendium/classes';
import { SUBCLASS_EXPANDED_SPELLS } from '../src/data/compendium/class-spells';
import { getAutoGrantedSpellsForLevel } from '../src/data/compendium/auto-spells-engine';
import {
  getClassFeaturesForLevel,
  getClassSubclassLevel,
  getSpellSlotsForClassLevel,
  HALF_CASTER_SPELL_SLOTS
} from '../src/data/compendium/class-progression';
import { getLevelUpChoicesConfig } from '../src/components/levelup/level-up-choices';
import { createDefaultCharacter } from '../src/lib/dnd-types';

const EXPECTED_RANGER_SUBCLASSES = [
  { id: 'hunter', name: 'Охотник', nameEn: 'Hunter', source: 'PHB' },
  { id: 'beast-master', name: 'Повелитель зверей', nameEn: 'Beast Master', source: 'PHB' },
  { id: 'gloom-stalker', name: 'Сумрачный охотник', nameEn: 'Gloom Stalker', source: 'XGE' },
  { id: 'horizon-walker', name: 'Странник горизонта', nameEn: 'Horizon Walker', source: 'XGE' },
  { id: 'monster-slayer', name: 'Убийца чудовищ', nameEn: 'Monster Slayer', source: 'XGE' },
  { id: 'fey-wanderer', name: 'Странник Фей', nameEn: 'Fey Wanderer', source: 'TCE' },
  { id: 'swarmkeeper', name: 'Хранитель роя', nameEn: 'Swarmkeeper', source: 'TCE' },
  { id: 'drakewarden', name: 'Драконий страж', nameEn: 'Drakewarden', source: 'FTD' },
];

test('Ranger Subclasses: Exactly 8 official subclasses exist from dnd.su', () => {
  const rangerClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'ranger');
  assert.ok(rangerClass, 'Ranger class must exist in compendium');
  assert.equal(rangerClass.subclasses.length, 8, 'Must have exactly 8 official subclasses');

  for (const expected of EXPECTED_RANGER_SUBCLASSES) {
    const found = rangerClass.subclasses.find(s => s.id === expected.id);
    assert.ok(found, `Subclass ${expected.id} (${expected.name}) must exist`);
    assert.equal(found.name, expected.name);
    assert.equal(found.nameEn, expected.nameEn);
    assert.equal(found.source, expected.source);
  }
});

test('Ranger Subclasses: Every subclass has features for milestone levels [3, 7, 11, 15]', () => {
  const rangerClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'ranger')!;
  const expectedLevels = [3, 7, 11, 15];

  for (const sub of rangerClass.subclasses) {
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

test('Ranger Expanded Spells: All 5 spell-granting archetypes have accurate 5-spell lists in SUBCLASS_EXPANDED_SPELLS', () => {
  const spellGrantingSubclasses = [
    'сумрачный охотник',
    'странник горизонта',
    'убийца чудовищ',
    'странник фей',
    'хранитель роя'
  ];

  for (const subKey of spellGrantingSubclasses) {
    const spells = SUBCLASS_EXPANDED_SPELLS[subKey];
    assert.ok(spells, `SUBCLASS_EXPANDED_SPELLS must have entries for ${subKey}`);
    assert.equal(spells.length, 5, `${subKey} must have exactly 5 expanded spells (one per circle 1-5)`);
  }
});

test('Ranger Auto-Spells Engine: Grants archetype spells at 3, 5, 9, 13, 17 and cantrips at 3', () => {
  // Swarmkeeper gets Mage Hand cantrip at lvl 3
  const swarmChar = createDefaultCharacter();
  swarmChar.className = 'Следопыт';
  swarmChar.subclass = 'Хранитель роя';
  const swarmSpellsLvl3 = getAutoGrantedSpellsForLevel(swarmChar, 3);
  assert.ok(
    swarmSpellsLvl3.some(s => s.name === 'Волшебная рука'),
    'Swarmkeeper must automatically gain Mage Hand (Волшебная рука) at level 3'
  );
  assert.ok(
    swarmSpellsLvl3.some(s => s.name === 'Магическая стрела'),
    'Swarmkeeper must gain Magic Missile (Магическая стрела) at level 3'
  );

  // Drakewarden gets Thaumaturgy cantrip at lvl 3
  const drakeChar = createDefaultCharacter();
  drakeChar.className = 'Следопыт';
  drakeChar.subclass = 'Драконий страж';
  const drakeSpellsLvl3 = getAutoGrantedSpellsForLevel(drakeChar, 3);
  assert.ok(
    drakeSpellsLvl3.some(s => s.name === 'Волшебство' || s.name === 'Чудотворство'),
    'Drakewarden must automatically gain Thaumaturgy (Волшебство/Чудотворство) at level 3'
  );

  // Gloom Stalker progression across circles
  const gloomChar = createDefaultCharacter();
  gloomChar.className = 'Следопыт';
  gloomChar.subclass = 'Сумрачный охотник';

  const gLvl3 = getAutoGrantedSpellsForLevel(gloomChar, 3);
  assert.ok(gLvl3.some(s => s.name === 'Маскировка'), 'Gloom Stalker must gain Disguise Self at level 3');

  const gLvl5 = getAutoGrantedSpellsForLevel(gloomChar, 5);
  assert.ok(gLvl5.some(s => s.name.includes('веревкой')), 'Gloom Stalker must gain Rope Trick at level 5');

  const gLvl9 = getAutoGrantedSpellsForLevel(gloomChar, 9);
  assert.ok(gLvl9.some(s => s.name === 'Страх'), 'Gloom Stalker must gain Fear at level 9');

  const gLvl13 = getAutoGrantedSpellsForLevel(gloomChar, 13);
  assert.ok(gLvl13.some(s => s.name.includes('невидимость')), 'Gloom Stalker must gain Greater Invisibility at level 13');

  const gLvl17 = getAutoGrantedSpellsForLevel(gloomChar, 17);
  assert.ok(gLvl17.some(s => s.name === 'Притворство' || s.name.includes('Притворство')), 'Gloom Stalker must gain Seeming at level 17');
});

test('Ranger Level-Up Choices & Proficiencies: Fighting Style at 2, Gloom Stalker save at 7, Fey Wanderer skill at 3, Hunter choices at 3, 7, 11, 15', () => {
  const char = createDefaultCharacter();
  char.className = 'Следопыт';

  // Level 2: Fighting Style (Archery, Defense, Dueling, Two-Weapon Fighting)
  const cfg2 = getLevelUpChoicesConfig(char, 2);
  assert.equal(cfg2.needsFightingStyle, true, 'Ranger level 2 must choose Fighting Style');
  assert.ok(cfg2.fightingStyleOptions?.some(fs => fs.id === 'archery'), 'Must offer Archery');
  assert.ok(cfg2.fightingStyleOptions?.some(fs => fs.id === 'two-weapon'), 'Must offer Two-Weapon Fighting');

  // Level 3 Hunter: Hunter Prey
  char.subclass = 'Охотник';
  const cfgHunter3 = getLevelUpChoicesConfig(char, 3);
  assert.equal(cfgHunter3.needsHunterChoice, true, 'Hunter level 3 must choose Hunter Prey');

  // Level 7 Hunter: Defensive Tactics
  const cfgHunter7 = getLevelUpChoicesConfig(char, 7);
  assert.equal(cfgHunter7.needsHunterChoice, true, 'Hunter level 7 must choose Defensive Tactics');

  // Level 11 Hunter: Multiattack (Volley / Whirlwind)
  const cfgHunter11 = getLevelUpChoicesConfig(char, 11);
  assert.equal(cfgHunter11.needsHunterChoice, true, 'Hunter level 11 must choose Multiattack');

  // Level 15 Hunter: Superior Hunter's Defense
  const cfgHunter15 = getLevelUpChoicesConfig(char, 15);
  assert.equal(cfgHunter15.needsHunterChoice, true, 'Hunter level 15 must choose Superior Hunter Defense');

  // Level 7 Gloom Stalker: Iron Mind gives Wisdom saving throw proficiency choice if already proficient
  const gloomChar = createDefaultCharacter();
  gloomChar.className = 'Следопыт';
  gloomChar.subclass = 'Сумрачный охотник';
  gloomChar.savingThrowProficiencies = {
    'СИЛ': true,
    'ЛОВ': true,
    'ТЕЛ': false,
    'ИНТ': false,
    'МДР': false,
    'ХАР': false
  };

  const cfgGloom7 = getLevelUpChoicesConfig(gloomChar, 7);
  assert.equal(cfgGloom7.needsSavingThrowProficiency, true, 'Gloom Stalker level 7 must trigger Iron Mind saving throw');
  assert.ok(cfgGloom7.savingThrowOptions?.includes('МДР'), 'Should offer МДР if not already proficient');

  // If already proficient in МДР, offer ИНТ or ХАР
  gloomChar.savingThrowProficiencies['МДР'] = true;
  const cfgGloom7Alt = getLevelUpChoicesConfig(gloomChar, 7);
  assert.equal(cfgGloom7Alt.needsSavingThrowProficiency, true);
  assert.ok(cfgGloom7Alt.savingThrowOptions?.includes('ИНТ'));
  assert.ok(cfgGloom7Alt.savingThrowOptions?.includes('ХАР'));
  assert.ok(!cfgGloom7Alt.savingThrowOptions?.includes('МДР'));

  // Level 3 Fey Wanderer: Otherworldly Glamour grants choice of Deception, Performance, or Persuasion
  const feyChar = createDefaultCharacter();
  feyChar.className = 'Следопыт';
  feyChar.subclass = 'Странник Фей';
  const cfgFey3 = getLevelUpChoicesConfig(feyChar, 3);
  assert.equal(cfgFey3.needsFeyWandererSkill, true, 'Fey Wanderer level 3 must choose skill proficiency');
  assert.ok(cfgFey3.feyWandererSkillOptions?.includes('Обман'));
  assert.ok(cfgFey3.feyWandererSkillOptions?.includes('Выступление'));
  assert.ok(cfgFey3.feyWandererSkillOptions?.includes('Убеждение'));
});

test('Ranger Half-Caster Spell Slot Progression: Accurate 1-20 slots', () => {
  // Level 1: no slots (empty object or 0 keys)
  const lvl1Slots = getSpellSlotsForClassLevel('Следопыт', 1);
  assert.ok(!lvl1Slots || Object.keys(lvl1Slots).length === 0);

  // Level 2: 2 of 1st circle
  const lvl2Slots = getSpellSlotsForClassLevel('Следопыт', 2);
  assert.deepEqual(lvl2Slots, { 1: 2 });

  // Level 5: 4 of 1st, 2 of 2nd circle
  const lvl5Slots = getSpellSlotsForClassLevel('Следопыт', 5);
  assert.deepEqual(lvl5Slots, { 1: 4, 2: 2 });

  // Level 9: 4 of 1st, 3 of 2nd, 2 of 3rd
  const lvl9Slots = getSpellSlotsForClassLevel('Следопыт', 9);
  assert.deepEqual(lvl9Slots, { 1: 4, 2: 3, 3: 2 });

  // Level 13: 4 of 1st, 3 of 2nd, 3 of 3rd, 1 of 4th
  const lvl13Slots = getSpellSlotsForClassLevel('Следопыт', 13);
  assert.deepEqual(lvl13Slots, { 1: 4, 2: 3, 3: 3, 4: 1 });

  // Level 17: 4 of 1st, 3 of 2nd, 3 of 3rd, 3 of 4th, 1 of 5th
  const lvl17Slots = getSpellSlotsForClassLevel('Следопыт', 17);
  assert.deepEqual(lvl17Slots, { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 });

  // Matches HALF_CASTER_SPELL_SLOTS exactly
  for (let lvl = 2; lvl <= 20; lvl++) {
    assert.deepEqual(
      getSpellSlotsForClassLevel('Следопыт', lvl),
      HALF_CASTER_SPELL_SLOTS[lvl]
    );
  }
});

test('Ranger Progression Simulation: Full 1 -> 20 level up across all 8 subclasses', () => {
  const reqLvl = getClassSubclassLevel('Следопыт');
  assert.equal(reqLvl, 3, 'Ranger must choose Conclave / Archetype at level 3');

  for (const expected of EXPECTED_RANGER_SUBCLASSES) {
    const char = createDefaultCharacter();
    char.className = 'Следопыт';
    char.subclass = expected.name;

    for (let lvl = 1; lvl <= 20; lvl++) {
      char.level = lvl;
      const feats = getClassFeaturesForLevel('Следопыт', lvl);
      assert.ok(Array.isArray(feats), `Level ${lvl} features for ${expected.name} must be an array`);

      const subObj = getSubclassesForClass('Следопыт').find(s => s.name === expected.name);
      assert.ok(subObj, `Subclass object ${expected.name} must exist`);
      const subFeats = subObj.features.filter(f => f.level === lvl);
      assert.ok(Array.isArray(subFeats), `Subclass level ${lvl} features for ${expected.name} must be an array`);

      const autoSpells = getAutoGrantedSpellsForLevel(char, lvl);
      assert.ok(Array.isArray(autoSpells), `Auto-spells at level ${lvl} for ${expected.name} must be an array`);
    }
  }
});
