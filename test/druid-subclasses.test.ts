import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES } from '../src/data/compendium/classes';
import {
  getSpellSlotsForClassLevel,
  getCantripsKnownForLevel,
  getClassSubclassLevel,
} from '../src/data/compendium/class-progression';

const EXPECTED_DRUID_SUBCLASSES = [
  { id: 'land', name: 'Круг Земли', nameEn: 'Circle of the Land', source: 'PHB' },
  { id: 'moon', name: 'Круг Луны', nameEn: 'Circle of the Moon', source: 'PHB' },
  { id: 'shepherd', name: 'Круг Пастыря', nameEn: 'Circle of the Shepherd', source: 'XGE' },
  { id: 'dreams', name: 'Круг Снов', nameEn: 'Circle of Dreams', source: 'XGE' },
  { id: 'spores', name: 'Круг Спор', nameEn: 'Circle of Spores', source: 'TCE' },
  { id: 'stars', name: 'Круг Звёзд', nameEn: 'Circle of Stars', source: 'TCE' },
  { id: 'wildfire', name: 'Круг Дикого Огня', nameEn: 'Circle of Wildfire', source: 'TCE' },
];

test('Druid Subclasses: Exactly 7 official subclasses exist from dnd.su and WotC sourcebooks', () => {
  const druidClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'druid');
  assert.ok(druidClass, 'Druid class must exist in compendium');
  assert.equal(druidClass.subclasses.length, 7, 'Must have exactly 7 official subclasses');

  for (const expected of EXPECTED_DRUID_SUBCLASSES) {
    const found = druidClass.subclasses.find(s => s.id === expected.id);
    assert.ok(found, `Subclass ${expected.id} (${expected.name}) must exist`);
    assert.equal(found.name, expected.name);
    assert.equal(found.nameEn, expected.nameEn);
  }
});

test('Druid Subclasses: Every subclass has features for milestone levels 2, 6, 10, and 14', () => {
  const druidClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'druid')!;
  const expectedLevels = [2, 6, 10, 14];

  for (const sub of druidClass.subclasses) {
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

test('Druid Progression: Subclass choice level is 2', () => {
  const subLevel = getClassSubclassLevel('Друид');
  assert.equal(subLevel, 2, 'Druid must choose circle strictly at level 2');
});

test('Druid Progression: Full caster spell slots from 1 to 20', () => {
  const slotsLvl1 = getSpellSlotsForClassLevel('Друид', 1);
  assert.equal(slotsLvl1?.[1], 2, 'Druid lvl 1 has two 1st level spell slots');

  const slotsLvl5 = getSpellSlotsForClassLevel('Друид', 5);
  assert.equal(slotsLvl5?.[3], 2, 'Druid lvl 5 has two 3rd level spell slots');

  const slotsLvl20 = getSpellSlotsForClassLevel('Друид', 20);
  assert.equal(slotsLvl20?.[9], 1, 'Druid lvl 20 has one 9th level spell slot');
});

test('Druid Progression: Cantrips known progression (2 -> 3 -> 4)', () => {
  assert.equal(getCantripsKnownForLevel('Друид', '', 1), 2);
  assert.equal(getCantripsKnownForLevel('Друид', '', 3), 2);
  assert.equal(getCantripsKnownForLevel('Друид', '', 4), 3);
  assert.equal(getCantripsKnownForLevel('Друид', '', 9), 3);
  assert.equal(getCantripsKnownForLevel('Друид', '', 10), 4);
  assert.equal(getCantripsKnownForLevel('Друид', '', 20), 4);
});
