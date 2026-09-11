import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES } from '../src/data/compendium/classes';
import { getClassSubclassLevel } from '../src/data/compendium/class-progression';

const EXPECTED_MONK_SUBCLASSES = [
  { id: 'open-hand', name: 'Путь открытой ладони', nameEn: 'Way of the Open Hand', source: 'PHB' },
  { id: 'shadow', name: 'Путь тени', nameEn: 'Way of Shadow', source: 'PHB' },
  { id: 'four-elements', name: 'Путь четырёх стихий', nameEn: 'Way of the Four Elements', source: 'PHB' },
  { id: 'long-death', name: 'Путь долгой смерти', nameEn: 'Way of the Long Death', source: 'SCAG' },
  { id: 'kensei', name: 'Путь кэнсэя', nameEn: 'Way of the Kensei', source: 'XGE' },
  { id: 'drunken-master', name: 'Путь пьяного мастера', nameEn: 'Way of the Drunken Master', source: 'XGE' },
  { id: 'sun-soul', name: 'Путь солнечной души', nameEn: 'Way of the Sun Soul', source: 'XGE' },
  { id: 'astral-self', name: 'Путь астрального тела', nameEn: 'Way of the Astral Self', source: 'TCE' },
  { id: 'mercy', name: 'Путь милосердия', nameEn: 'Way of Mercy', source: 'TCE' },
  { id: 'ascendant-dragon', name: 'Путь восходящего дракона', nameEn: 'Way of the Ascendant Dragon', source: 'FTD' },
];

test('Monk Subclasses: Exactly 10 official subclasses exist from dnd.su and WotC sourcebooks', () => {
  const monkClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'monk');
  assert.ok(monkClass, 'Monk class must exist in compendium');
  assert.equal(monkClass.subclasses.length, 10, 'Must have exactly 10 official subclasses');

  for (const expected of EXPECTED_MONK_SUBCLASSES) {
    const found = monkClass.subclasses.find(s => s.id === expected.id);
    assert.ok(found, `Subclass ${expected.id} (${expected.name}) must exist`);
    assert.equal(found.name, expected.name);
    assert.equal(found.nameEn, expected.nameEn);
  }
});

test('Monk Subclasses: Every subclass has features for milestone levels 3, 6, 11, and 17', () => {
  const monkClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'monk')!;
  const expectedLevels = [3, 6, 11, 17];

  for (const sub of monkClass.subclasses) {
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

test('Monk Progression: Subclass choice level is 3', () => {
  const subLevel = getClassSubclassLevel('Монах');
  assert.equal(subLevel, 3, 'Monk must choose tradition strictly at level 3');
});
