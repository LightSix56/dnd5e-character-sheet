import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES } from '../src/data/compendium/classes';
import {
  getSpellSlotsForClassLevel,
  getClassSubclassLevel,
} from '../src/data/compendium/class-progression';

const EXPECTED_ARTIFICER_SUBCLASSES = [
  { id: 'alchemist', name: 'Алхимик', nameEn: 'Alchemist', source: 'TCE' },
  { id: 'armorer', name: 'Бронник', nameEn: 'Armorer', source: 'TCE' },
  { id: 'artillerist', name: 'Артиллерист', nameEn: 'Artillerist', source: 'TCE' },
  { id: 'battle-smith', name: 'Боевой кузнец', nameEn: 'Battle Smith', source: 'TCE' },
];

test('Artificer Subclasses: Exactly 4 official subclasses exist from dnd.su and WotC sourcebooks', () => {
  const artClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'artificer');
  assert.ok(artClass, 'Artificer class must exist in compendium');
  assert.equal(artClass.subclasses.length, 4, 'Must have exactly 4 official subclasses');

  for (const expected of EXPECTED_ARTIFICER_SUBCLASSES) {
    const found = artClass.subclasses.find(s => s.id === expected.id);
    assert.ok(found, `Subclass ${expected.id} (${expected.name}) must exist`);
    assert.equal(found.name, expected.name);
    assert.equal(found.nameEn, expected.nameEn);
  }
});

test('Artificer Subclasses: Every subclass has features for milestone levels 3, 5, 9, and 15', () => {
  const artClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'artificer')!;
  const expectedLevels = [3, 5, 9, 15];

  for (const sub of artClass.subclasses) {
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

test('Artificer Progression: Subclass choice level is 3', () => {
  const subLevel = getClassSubclassLevel('Изобретатель');
  assert.equal(subLevel, 3, 'Artificer must choose specialization strictly at level 3');
});

test('Artificer Progression: Spell slots from 1 to 20 (half-caster with level 1 slots)', () => {
  const slotsLvl1 = getSpellSlotsForClassLevel('Изобретатель', 1);
  assert.equal(slotsLvl1?.[1], 2, 'Artificer lvl 1 has two 1st level spell slots');

  const slotsLvl5 = getSpellSlotsForClassLevel('Изобретатель', 5);
  assert.equal(slotsLvl5?.[2], 2, 'Artificer lvl 5 has two 2nd level spell slots');

  const slotsLvl17 = getSpellSlotsForClassLevel('Изобретатель', 17);
  assert.equal(slotsLvl17?.[5], 1, 'Artificer lvl 17 has one 5th level spell slot');
});
