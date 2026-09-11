import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES, getSubclassesForClass } from '../src/data/compendium/classes';
import {
  getSpellSlotsForClassLevel,
  getCantripsKnownForLevel,
  getClassSubclassLevel,
} from '../src/data/compendium/class-progression';
import { getLevelUpChoicesConfig } from '../src/components/levelup/level-up-choices';
import { createDefaultCharacter } from '../src/lib/dnd-types';

const EXPECTED_FIGHTER_SUBCLASSES = [
  { id: 'champion', name: 'Чемпион', nameEn: 'Champion', source: 'PHB' },
  { id: 'battle-master', name: 'Мастер боевых искусств', nameEn: 'Battle Master', source: 'PHB' },
  { id: 'eldritch-knight', name: 'Мистический рыцарь', nameEn: 'Eldritch Knight', source: 'PHB' },
  { id: 'echo-knight', name: 'Рыцарь эха', nameEn: 'Echo Knight', source: 'EGW' },
  { id: 'samurai', name: 'Самурай', nameEn: 'Samurai', source: 'XGE' },
  { id: 'psi-warrior', name: 'Пси-воин', nameEn: 'Psi Warrior', source: 'TCE' },
  { id: 'rune-knight', name: 'Рунический рыцарь', nameEn: 'Rune Knight', source: 'TCE' },
  { id: 'cavalier', name: 'Кавалерист', nameEn: 'Cavalier', source: 'XGE' },
  { id: 'arcane-archer', name: 'Мистический лучник', nameEn: 'Arcane Archer', source: 'XGE' },
];

test('Fighter Subclasses: Exactly 9 official subclasses exist from dnd.su', () => {
  const fighterClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'fighter');
  assert.ok(fighterClass, 'Fighter class must exist in compendium');
  assert.equal(fighterClass.subclasses.length, 9, 'Must have exactly 9 official subclasses');

  for (const expected of EXPECTED_FIGHTER_SUBCLASSES) {
    const found = fighterClass.subclasses.find(s => s.id === expected.id);
    assert.ok(found, `Subclass ${expected.id} (${expected.name}) must exist`);
    assert.equal(found.name, expected.name);
    assert.equal(found.nameEn, expected.nameEn);
    assert.equal(found.source, expected.source);
  }
});

test('Fighter Subclasses: Every subclass has features for milestone levels 3, 7, 10, 15, and 18', () => {
  const fighterClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'fighter')!;
  const expectedLevels = [3, 7, 10, 15, 18];

  for (const sub of fighterClass.subclasses) {
    for (const lvl of expectedLevels) {
      const featAtLvl = sub.features.filter(f => f.level === lvl);
      assert.ok(
        featAtLvl.length > 0,
        `Subclass "${sub.name}" (${sub.id}) must have at least one feature at level ${lvl}`
      );
      for (const feat of featAtLvl) {
        assert.ok(feat.name && feat.name.length > 0, `Feature at lvl ${lvl} in ${sub.name} must have a name`);
        assert.ok(feat.description && feat.description.length > 0, `Feature at lvl ${lvl} in ${sub.name} must have description`);
      }
    }
  }
});

test('Fighter Progression: Subclass choice level is 3', () => {
  const subLevel = getClassSubclassLevel('Воин');
  assert.equal(subLevel, 3, 'Fighter must choose archetype strictly at level 3');
});

test('Fighter Choices: Champion at level 10 gains second Fighting Style', () => {
  const char = createDefaultCharacter();
  char.className = 'Воин';
  char.subclass = 'Чемпион';
  char.level = 9;

  const config = getLevelUpChoicesConfig(char, 10);
  assert.equal(config.needsFightingStyle, true, 'Level 10 Champion must choose an additional fighting style');
  assert.ok(config.fightingStyleOptions && config.fightingStyleOptions.length >= 6, 'Must have full list of fighting style options');
});

test('Fighter Spellcasting: Eldritch Knight spell slots and cantrips progression', () => {
  // Cantrips: 2 at lvl 3, 3 at lvl 10
  assert.equal(getCantripsKnownForLevel('Воин', 'Мистический рыцарь', 2), 0);
  assert.equal(getCantripsKnownForLevel('Воин', 'Мистический рыцарь', 3), 2);
  assert.equal(getCantripsKnownForLevel('Воин', 'Мистический рыцарь', 10), 3);

  // Spell slots: 1/3 caster progression
  const slotsLvl2 = getSpellSlotsForClassLevel('Воин', 2, 'Мистический рыцарь');
  assert.equal(slotsLvl2, null, 'No spell slots before level 3');

  const slotsLvl3 = getSpellSlotsForClassLevel('Воин', 3, 'Мистический рыцарь');
  assert.ok(slotsLvl3, 'Has spell slots at level 3');
  assert.equal(slotsLvl3[1], 2, 'Level 3 EK gets two 1st-level slots');

  const slotsLvl20 = getSpellSlotsForClassLevel('Воин', 20, 'Мистический рыцарь');
  assert.ok(slotsLvl20, 'Has spell slots at level 20');
  assert.equal(slotsLvl20[1], 4, '4 1st-level slots at lvl 20');
  assert.equal(slotsLvl20[2], 3, '3 2nd-level slots at lvl 20');
  assert.equal(slotsLvl20[3], 3, '3 3rd-level slots at lvl 20');
  assert.equal(slotsLvl20[4], 1, '1 4th-level slot at lvl 20');
});
