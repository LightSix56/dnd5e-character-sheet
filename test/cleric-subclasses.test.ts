import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES } from '../src/data/compendium/classes';
import {
  getSpellSlotsForClassLevel,
  getCantripsKnownForLevel,
  getClassSubclassLevel,
} from '../src/data/compendium/class-progression';

const EXPECTED_CLERIC_SUBCLASSES = [
  { id: 'life', name: 'Домен Жизни', nameEn: 'Life Domain', source: 'PHB' },
  { id: 'light', name: 'Домен Света', nameEn: 'Light Domain', source: 'PHB' },
  { id: 'war', name: 'Домен Войны', nameEn: 'War Domain', source: 'PHB' },
  { id: 'tempest', name: 'Домен Бури', nameEn: 'Tempest Domain', source: 'PHB' },
  { id: 'knowledge', name: 'Домен Знаний', nameEn: 'Knowledge Domain', source: 'PHB' },
  { id: 'trickery', name: 'Домен Обмана', nameEn: 'Trickery Domain', source: 'PHB' },
  { id: 'nature', name: 'Домен Природы', nameEn: 'Nature Domain', source: 'PHB' },
  { id: 'death', name: 'Домен Смерти', nameEn: 'Death Domain', source: 'DMG' },
  { id: 'arcana', name: 'Домен Магии', nameEn: 'Arcana Domain', source: 'SCAG' },
  { id: 'forge', name: 'Домен Кузни', nameEn: 'Forge Domain', source: 'XGE' },
  { id: 'grave', name: 'Домен Упокоения', nameEn: 'Grave Domain', source: 'XGE' },
  { id: 'peace', name: 'Домен Мира', nameEn: 'Peace Domain', source: 'TCE' },
  { id: 'order', name: 'Домен Порядка', nameEn: 'Order Domain', source: 'TCE' },
  { id: 'twilight', name: 'Домен Сумерек', nameEn: 'Twilight Domain', source: 'TCE' },
];

test('Cleric Subclasses: Exactly 14 official subclasses exist from dnd.su and WotC sourcebooks', () => {
  const clericClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'cleric');
  assert.ok(clericClass, 'Cleric class must exist in compendium');
  assert.equal(clericClass.subclasses.length, 14, 'Must have exactly 14 official subclasses');

  for (const expected of EXPECTED_CLERIC_SUBCLASSES) {
    const found = clericClass.subclasses.find(s => s.id === expected.id);
    assert.ok(found, `Subclass ${expected.id} (${expected.name}) must exist`);
    assert.equal(found.name, expected.name);
    assert.equal(found.nameEn, expected.nameEn);
    assert.equal(found.source, expected.source);
  }
});

test('Cleric Subclasses: Every subclass has features for milestone levels 1, 2, 6, 8, and 17', () => {
  const clericClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'cleric')!;
  const expectedLevels = [1, 2, 6, 8, 17];

  for (const sub of clericClass.subclasses) {
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

test('Cleric Progression: Subclass choice level is 1', () => {
  const subLevel = getClassSubclassLevel('Жрец');
  assert.equal(subLevel, 1, 'Cleric must choose domain strictly at level 1');
});

test('Cleric Progression: Full caster spell slots from 1 to 20', () => {
  const slotsLvl1 = getSpellSlotsForClassLevel('Жрец', 1);
  assert.equal(slotsLvl1?.[1], 2, 'Cleric lvl 1 has two 1st level spell slots');

  const slotsLvl5 = getSpellSlotsForClassLevel('Жрец', 5);
  assert.equal(slotsLvl5?.[3], 2, 'Cleric lvl 5 has two 3rd level spell slots');

  const slotsLvl20 = getSpellSlotsForClassLevel('Жрец', 20);
  assert.equal(slotsLvl20?.[9], 1, 'Cleric lvl 20 has one 9th level spell slot');
});

test('Cleric Progression: Cantrips known progression (3 -> 4 -> 5)', () => {
  assert.equal(getCantripsKnownForLevel('Жрец', '', 1), 3);
  assert.equal(getCantripsKnownForLevel('Жрец', '', 3), 3);
  assert.equal(getCantripsKnownForLevel('Жрец', '', 4), 4);
  assert.equal(getCantripsKnownForLevel('Жрец', '', 9), 4);
  assert.equal(getCantripsKnownForLevel('Жрец', '', 10), 5);
  assert.equal(getCantripsKnownForLevel('Жрец', '', 20), 5);
});
