import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES } from '../src/data/compendium/classes';
import {
  getSpellSlotsForClassLevel,
  getCantripsKnownForLevel,
  getClassSubclassLevel,
} from '../src/data/compendium/class-progression';

const EXPECTED_BARD_SUBCLASSES = [
  { id: 'lore', name: 'Коллегия знаний', nameEn: 'College of Lore', source: 'PHB' },
  { id: 'valor', name: 'Коллегия доблести', nameEn: 'College of Valor', source: 'PHB' },
  { id: 'swords', name: 'Коллегия мечей', nameEn: 'College of Swords', source: 'XGE' },
  { id: 'glamour', name: 'Коллегия очарования', nameEn: 'College of Glamour', source: 'XGE' },
  { id: 'whispers', name: 'Коллегия шёпотов', nameEn: 'College of Whispers', source: 'XGE' },
  { id: 'eloquence', name: 'Коллегия красноречия', nameEn: 'College of Eloquence', source: 'TCE' },
  { id: 'creation', name: 'Коллегия созидания', nameEn: 'College of Creation', source: 'TCE' },
  { id: 'spirits', name: 'Коллегия духов', nameEn: 'College of Spirits', source: 'VRGtR' },
];

test('Bard Subclasses: Exactly 8 official subclasses exist from dnd.su and WotC sourcebooks', () => {
  const bardClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'bard');
  assert.ok(bardClass, 'Bard class must exist in compendium');
  assert.equal(bardClass.subclasses.length, 8, 'Must have exactly 8 official subclasses');

  for (const expected of EXPECTED_BARD_SUBCLASSES) {
    const found = bardClass.subclasses.find(s => s.id === expected.id);
    assert.ok(found, `Subclass ${expected.id} (${expected.name}) must exist`);
    assert.equal(found.name, expected.name);
    assert.equal(found.nameEn, expected.nameEn);
    assert.equal(found.source, expected.source);
  }
});

test('Bard Subclasses: Every subclass has features for milestone levels 3, 6, and 14', () => {
  const bardClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'bard')!;
  const expectedLevels = [3, 6, 14];

  for (const sub of bardClass.subclasses) {
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

test('Bard Progression: Subclass choice level is 3', () => {
  const subLevel = getClassSubclassLevel('Бард');
  assert.equal(subLevel, 3, 'Bard must choose college strictly at level 3');
});

test('Bard Progression: Full caster spell slots from 1 to 20', () => {
  const slotsLvl1 = getSpellSlotsForClassLevel('Бард', 1);
  assert.equal(slotsLvl1?.[1], 2, 'Bard lvl 1 has two 1st level spell slots');

  const slotsLvl5 = getSpellSlotsForClassLevel('Бард', 5);
  assert.equal(slotsLvl5?.[3], 2, 'Bard lvl 5 has two 3rd level spell slots');

  const slotsLvl20 = getSpellSlotsForClassLevel('Бард', 20);
  assert.equal(slotsLvl20?.[9], 1, 'Bard lvl 20 has one 9th level spell slot');
});

test('Bard Progression: Cantrips known progression (2 -> 3 -> 4)', () => {
  assert.equal(getCantripsKnownForLevel('Бард', '', 1), 2);
  assert.equal(getCantripsKnownForLevel('Бард', '', 3), 2);
  assert.equal(getCantripsKnownForLevel('Бард', '', 4), 3);
  assert.equal(getCantripsKnownForLevel('Бард', '', 9), 3);
  assert.equal(getCantripsKnownForLevel('Бард', '', 10), 4);
  assert.equal(getCantripsKnownForLevel('Бард', '', 20), 4);
});
