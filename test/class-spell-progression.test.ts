import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getCantripsKnownForLevel,
  getNewCantripsGainedForLevel,
  getNewSpellsLearnedForLevel,
} from '../src/data/compendium/class-progression';

test('Cantrip progression per dnd.su tables', async (t) => {
  await t.test('Warlock cantrips: 2 at 1-3, 3 at 4-9, 4 at 10-20', () => {
    assert.equal(getCantripsKnownForLevel('Колдун', undefined, 1), 2);
    assert.equal(getCantripsKnownForLevel('Колдун', undefined, 2), 2);
    assert.equal(getCantripsKnownForLevel('Колдун', undefined, 3), 2);
    assert.equal(getCantripsKnownForLevel('Колдун', undefined, 4), 3);
    assert.equal(getCantripsKnownForLevel('Колдун', undefined, 9), 3);
    assert.equal(getCantripsKnownForLevel('Колдун', undefined, 10), 4);
    assert.equal(getCantripsKnownForLevel('Колдун', undefined, 20), 4);

    // Delta checks
    assert.equal(getNewCantripsGainedForLevel('Колдун', undefined, 2), 0);
    assert.equal(getNewCantripsGainedForLevel('Колдун', undefined, 3), 0);
    assert.equal(getNewCantripsGainedForLevel('Колдун', undefined, 4), 1);
    assert.equal(getNewCantripsGainedForLevel('Колдун', undefined, 5), 0);
    assert.equal(getNewCantripsGainedForLevel('Колдун', undefined, 10), 1);
    assert.equal(getNewCantripsGainedForLevel('Колдун', undefined, 11), 0);
  });

  await t.test('Wizard & Cleric cantrips: 3 at 1-3, 4 at 4-9, 5 at 10-20', () => {
    assert.equal(getCantripsKnownForLevel('Волшебник', undefined, 1), 3);
    assert.equal(getCantripsKnownForLevel('Волшебник', undefined, 4), 4);
    assert.equal(getCantripsKnownForLevel('Волшебник', undefined, 10), 5);
    assert.equal(getNewCantripsGainedForLevel('Волшебник', undefined, 2), 0);
    assert.equal(getNewCantripsGainedForLevel('Волшебник', undefined, 4), 1);
    assert.equal(getNewCantripsGainedForLevel('Волшебник', undefined, 10), 1);

    assert.equal(getCantripsKnownForLevel('Жрец', undefined, 1), 3);
    assert.equal(getCantripsKnownForLevel('Жрец', undefined, 4), 4);
    assert.equal(getNewCantripsGainedForLevel('Жрец', undefined, 2), 0);
    assert.equal(getNewCantripsGainedForLevel('Жрец', undefined, 4), 1);
    assert.equal(getNewCantripsGainedForLevel('Жрец', undefined, 10), 1);
  });

  await t.test('Sorcerer cantrips: 4 at 1-3, 5 at 4-9, 6 at 10-20', () => {
    assert.equal(getCantripsKnownForLevel('Чародей', undefined, 1), 4);
    assert.equal(getCantripsKnownForLevel('Чародей', undefined, 4), 5);
    assert.equal(getCantripsKnownForLevel('Чародей', undefined, 10), 6);
    assert.equal(getNewCantripsGainedForLevel('Чародей', undefined, 2), 0);
    assert.equal(getNewCantripsGainedForLevel('Чародей', undefined, 4), 1);
    assert.equal(getNewCantripsGainedForLevel('Чародей', undefined, 10), 1);
  });

  await t.test('Artificer cantrips: 2 at 1-9, 3 at 10-13, 4 at 14-20', () => {
    assert.equal(getCantripsKnownForLevel('Изобретатель', undefined, 1), 2);
    assert.equal(getCantripsKnownForLevel('Изобретатель', undefined, 9), 2);
    assert.equal(getCantripsKnownForLevel('Изобретатель', undefined, 10), 3);
    assert.equal(getCantripsKnownForLevel('Изобретатель', undefined, 14), 4);
    assert.equal(getNewCantripsGainedForLevel('Изобретатель', undefined, 2), 0);
    assert.equal(getNewCantripsGainedForLevel('Изобретатель', undefined, 10), 1);
    assert.equal(getNewCantripsGainedForLevel('Изобретатель', undefined, 14), 1);
  });

  await t.test('Eldritch Knight & Arcane Trickster cantrips: 2 (3) at 3-9, 3 (4) at 10-20', () => {
    assert.equal(getCantripsKnownForLevel('Воин', 'Мистический рыцарь', 2), 0);
    assert.equal(getCantripsKnownForLevel('Воин', 'Мистический рыцарь', 3), 2);
    assert.equal(getCantripsKnownForLevel('Воин', 'Мистический рыцарь', 10), 3);
    assert.equal(getNewCantripsGainedForLevel('Воин', 'Мистический рыцарь', 3), 2);
    assert.equal(getNewCantripsGainedForLevel('Воин', 'Мистический рыцарь', 4), 0);
    assert.equal(getNewCantripsGainedForLevel('Воин', 'Мистический рыцарь', 10), 1);

    assert.equal(getCantripsKnownForLevel('Плут', 'Мистический ловкач', 3), 3);
    assert.equal(getCantripsKnownForLevel('Плут', 'Мистический ловкач', 10), 4);
    assert.equal(getNewCantripsGainedForLevel('Плут', 'Мистический ловкач', 3), 3);
    assert.equal(getNewCantripsGainedForLevel('Плут', 'Мистический ловкач', 10), 1);
  });

  await t.test('Non-cantrip classes (Paladin, Ranger, Barbarian) return 0', () => {
    assert.equal(getCantripsKnownForLevel('Паладин', undefined, 5), 0);
    assert.equal(getNewCantripsGainedForLevel('Паладин', undefined, 2), 0);
    assert.equal(getCantripsKnownForLevel('Следопыт', undefined, 5), 0);
    assert.equal(getNewCantripsGainedForLevel('Следопыт', undefined, 2), 0);
    assert.equal(getCantripsKnownForLevel('Варвар', undefined, 10), 0);
    assert.equal(getNewCantripsGainedForLevel('Варвар', undefined, 4), 0);
  });
});

test('Spells learned progression per dnd.su tables', async (t) => {
  await t.test('Warlock: +1 spell on levels 2-9, 11, 13, 15, 17, 19; 0 on 10, 12, 14, 16, 18, 20', () => {
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 2), 1);
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 3), 1);
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 9), 1);
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 10), 0); // 10 -> 10 known
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 11), 1); // 10 -> 11 known
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 12), 0); // 11 -> 11 known
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 13), 1);
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 14), 0);
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 15), 1);
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 16), 0);
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 17), 1);
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 18), 0);
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 19), 1);
    assert.equal(getNewSpellsLearnedForLevel('Колдун', undefined, 20), 0);
  });

  await t.test('Wizard: always +2 spells to spellbook on every level 2-20', () => {
    for (let lvl = 2; lvl <= 20; lvl++) {
      assert.equal(getNewSpellsLearnedForLevel('Волшебник', undefined, lvl), 2, `Wizard at level ${lvl} must gain 2 spells`);
    }
  });

  await t.test('Sorcerer: +1 spell on levels 2-11, 13, 15, 17; 0 on 12, 14, 16, 18, 19, 20', () => {
    assert.equal(getNewSpellsLearnedForLevel('Чародей', undefined, 2), 1);
    assert.equal(getNewSpellsLearnedForLevel('Чародей', undefined, 11), 1);
    assert.equal(getNewSpellsLearnedForLevel('Чародей', undefined, 12), 0);
    assert.equal(getNewSpellsLearnedForLevel('Чародей', undefined, 13), 1);
    assert.equal(getNewSpellsLearnedForLevel('Чародей', undefined, 14), 0);
    assert.equal(getNewSpellsLearnedForLevel('Чародей', undefined, 17), 1);
    assert.equal(getNewSpellsLearnedForLevel('Чародей', undefined, 18), 0);
    assert.equal(getNewSpellsLearnedForLevel('Чародей', undefined, 20), 0);
  });

  await t.test('Bard: +1 spell on levels 2-9, 11, 13, 15, 17; +2 on 10, 14, 18 (Magical Secrets); 0 on 12, 16, 19, 20', () => {
    assert.equal(getNewSpellsLearnedForLevel('Бард', undefined, 2), 1);
    assert.equal(getNewSpellsLearnedForLevel('Бард', undefined, 9), 1);
    assert.equal(getNewSpellsLearnedForLevel('Бард', undefined, 10), 2); // 12 -> 14 known
    assert.equal(getNewSpellsLearnedForLevel('Бард', undefined, 11), 1);
    assert.equal(getNewSpellsLearnedForLevel('Бард', undefined, 12), 0);
    assert.equal(getNewSpellsLearnedForLevel('Бард', undefined, 14), 2); // 16 -> 18 known
    assert.equal(getNewSpellsLearnedForLevel('Бард', undefined, 16), 0);
    assert.equal(getNewSpellsLearnedForLevel('Бард', undefined, 18), 2); // 20 -> 22 known
    assert.equal(getNewSpellsLearnedForLevel('Бард', undefined, 19), 0);
    assert.equal(getNewSpellsLearnedForLevel('Бард', undefined, 20), 0);
  });

  await t.test('Ranger: +2 spells on level 2; +1 on odd levels 3, 5, 7, 9, 11, 13, 15, 17, 19; 0 on even levels', () => {
    assert.equal(getNewSpellsLearnedForLevel('Следопыт', undefined, 2), 2);
    assert.equal(getNewSpellsLearnedForLevel('Следопыт', undefined, 3), 1);
    assert.equal(getNewSpellsLearnedForLevel('Следопыт', undefined, 4), 0);
    assert.equal(getNewSpellsLearnedForLevel('Следопыт', undefined, 5), 1);
    assert.equal(getNewSpellsLearnedForLevel('Следопыт', undefined, 6), 0);
    assert.equal(getNewSpellsLearnedForLevel('Следопыт', undefined, 10), 0);
  });

  await t.test('Eldritch Knight & Arcane Trickster: +3 spells at lvl 3, +1 at 4, 7, 8, 10, 11, 13, 14, 16, 19, 20', () => {
    assert.equal(getNewSpellsLearnedForLevel('Воин', 'Мистический рыцарь', 2), 0);
    assert.equal(getNewSpellsLearnedForLevel('Воин', 'Мистический рыцарь', 3), 3);
    assert.equal(getNewSpellsLearnedForLevel('Воин', 'Мистический рыцарь', 4), 1);
    assert.equal(getNewSpellsLearnedForLevel('Воин', 'Мистический рыцарь', 5), 0);
    assert.equal(getNewSpellsLearnedForLevel('Воин', 'Мистический рыцарь', 6), 0);
    assert.equal(getNewSpellsLearnedForLevel('Воин', 'Мистический рыцарь', 7), 1);
  });

  await t.test('Prepared casters (Cleric, Druid, Paladin, Artificer) learn 0 individual spells on level-up', () => {
    for (let lvl = 2; lvl <= 20; lvl++) {
      assert.equal(getNewSpellsLearnedForLevel('Жрец', undefined, lvl), 0);
      assert.equal(getNewSpellsLearnedForLevel('Друид', undefined, lvl), 0);
      assert.equal(getNewSpellsLearnedForLevel('Паладин', undefined, lvl), 0);
      assert.equal(getNewSpellsLearnedForLevel('Изобретатель', undefined, lvl), 0);
    }
  });

  await t.test('Non-casters (Barbarian, Fighter, Rogue, Monk) learn 0 spells', () => {
    for (let lvl = 2; lvl <= 20; lvl++) {
      assert.equal(getNewSpellsLearnedForLevel('Варвар', undefined, lvl), 0);
      assert.equal(getNewSpellsLearnedForLevel('Воин', undefined, lvl), 0);
      assert.equal(getNewSpellsLearnedForLevel('Плут', undefined, lvl), 0);
      assert.equal(getNewSpellsLearnedForLevel('Монах', undefined, lvl), 0);
    }
  });
});
