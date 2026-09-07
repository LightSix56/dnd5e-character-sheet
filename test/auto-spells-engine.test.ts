import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { CharacterData } from '../src/lib/dnd-types';
import { DND_COMPENDIUM_SPELLS, findSpellByName } from '../src/data/compendium/spells';
import { getAutoGrantedSpellsForLevel } from '../src/data/compendium/auto-spells-engine';

describe('Auto-Spells Progression Engine & Smite Spells Compendium', () => {
  it('1. Paladin 2 gains Божественная кара', () => {
    const paladinRu = {
      name: 'Утер',
      className: 'Паладин',
      level: 1,
    } as CharacterData;

    const spellsAtLvl2 = getAutoGrantedSpellsForLevel(paladinRu, 2);
    const divineSmite = spellsAtLvl2.find(s => s.name === 'Божественная кара');

    assert.ok(divineSmite, 'Paladin must gain Божественная кара at level 2');
    assert.strictEqual(divineSmite.level, 1);
    assert.strictEqual(divineSmite.prepared, true);
    assert.strictEqual(divineSmite.source, 'Паладин: Божественная кара');

    // English casing check
    const paladinEn = {
      name: 'Arthur',
      className: 'paladin',
      level: 1,
    } as CharacterData;
    const spellsEn = getAutoGrantedSpellsForLevel(paladinEn, 2);
    assert.ok(spellsEn.some(s => s.name === 'Божественная кара'));

    // Should NOT gain at level 1 or 3
    const spellsAtLvl1 = getAutoGrantedSpellsForLevel(paladinRu, 1);
    assert.ok(!spellsAtLvl1.some(s => s.name === 'Божественная кара'));

    const spellsAtLvl3 = getAutoGrantedSpellsForLevel(paladinRu, 3);
    assert.ok(!spellsAtLvl3.some(s => s.name === 'Божественная кара'));
  });

  it('2. Paladin 3 with Клятва преданности gains Oath spells for level 3', () => {
    const oathPaladin = {
      name: 'Тирион',
      className: 'Паладин',
      subclass: 'Клятва преданности',
      level: 2,
    } as CharacterData;

    const spellsAtLvl3 = getAutoGrantedSpellsForLevel(oathPaladin, 3);
    assert.strictEqual(spellsAtLvl3.length, 2, 'Paladin oath at level 3 must yield 2 spells');

    const protectionSpell = spellsAtLvl3.find(s =>
      s.name === 'Защита от Зла и Добра' || s.name === 'Защита от добра и зла'
    );
    const sanctuarySpell = spellsAtLvl3.find(s => s.name === 'Убежище');

    assert.ok(protectionSpell, 'Must include Protection from Evil and Good');
    assert.ok(sanctuarySpell, 'Must include Sanctuary (Убежище)');
    assert.strictEqual(protectionSpell.level, 1);
    assert.strictEqual(sanctuarySpell.level, 1);
    assert.strictEqual(protectionSpell.prepared, true);
    assert.strictEqual(sanctuarySpell.prepared, true);
    assert.strictEqual(protectionSpell.source, 'Архетип: Клятва преданности');
    assert.strictEqual(sanctuarySpell.source, 'Архетип: Клятва преданности');

    // Test with subclassOverride
    const paladinNoSubclass = {
      name: 'Новобранец',
      className: 'Паладин',
      level: 2,
    } as CharacterData;
    const spellsOverride = getAutoGrantedSpellsForLevel(paladinNoSubclass, 3, 'Клятва преданности');
    assert.strictEqual(spellsOverride.length, 2);
    assert.ok(spellsOverride.some(s => s.name === 'Убежище'));

    // Paladin Level 5 gains 2nd circle oath spells
    const spellsAtLvl5 = getAutoGrantedSpellsForLevel(oathPaladin, 5);
    assert.strictEqual(spellsAtLvl5.length, 2);
    assert.ok(spellsAtLvl5.some(s => s.name === 'Малое восстановление'));
    assert.ok(spellsAtLvl5.some(s => s.name === 'Зона правды'));
    for (const s of spellsAtLvl5) {
      assert.strictEqual(s.level, 2);
      assert.strictEqual(s.prepared, true);
    }
  });

  it('3. Cleric 3 with Домен жизни gains Domain spells for level 3 (Духовное оружие, Малое восстановление)', () => {
    const lifeCleric = {
      name: 'Элиса',
      className: 'Жрец',
      subclass: 'Домен жизни',
      level: 2,
    } as CharacterData;

    const spellsAtLvl3 = getAutoGrantedSpellsForLevel(lifeCleric, 3);
    assert.strictEqual(spellsAtLvl3.length, 2, 'Cleric domain at level 3 must yield 2 spells');

    const spiritualWeapon = spellsAtLvl3.find(s => s.name === 'Духовное оружие');
    const lesserRestoration = spellsAtLvl3.find(s => s.name === 'Малое восстановление');

    assert.ok(spiritualWeapon, 'Must gain Spiritual Weapon');
    assert.ok(lesserRestoration, 'Must gain Lesser Restoration');
    assert.strictEqual(spiritualWeapon.level, 2);
    assert.strictEqual(lesserRestoration.level, 2);
    assert.strictEqual(spiritualWeapon.prepared, true);
    assert.strictEqual(lesserRestoration.prepared, true);
    assert.strictEqual(spiritualWeapon.source, 'Архетип: Домен жизни');
    assert.strictEqual(lesserRestoration.source, 'Архетип: Домен жизни');

    // Level 1 Cleric domain spells
    const spellsAtLvl1 = getAutoGrantedSpellsForLevel(lifeCleric, 1);
    assert.strictEqual(spellsAtLvl1.length, 2);
    assert.ok(spellsAtLvl1.some(s => s.name === 'Благословение'));
    assert.ok(spellsAtLvl1.some(s => s.name === 'Лечащее слово'));

    // Level 5 Cleric domain spells
    const spellsAtLvl5 = getAutoGrantedSpellsForLevel(lifeCleric, 5);
    assert.strictEqual(spellsAtLvl5.length, 2);
    assert.ok(spellsAtLvl5.some(s => s.name === 'Возрождение'));
    assert.ok(spellsAtLvl5.some(s => s.name === 'Маяк надежды'));
  });

  it('4. Tiefling Fighter at level 3 gains Адское возмездие (racial)', () => {
    const tieflingFighter = {
      name: 'Варис',
      race: 'Тифлинг',
      className: 'Воин',
      level: 2,
    } as CharacterData;

    const spellsAtLvl3 = getAutoGrantedSpellsForLevel(tieflingFighter, 3);
    assert.strictEqual(spellsAtLvl3.length, 1, 'Tiefling Fighter must receive exactly 1 racial spell at level 3');

    const hellishRebuke = spellsAtLvl3[0];
    assert.strictEqual(hellishRebuke.name, 'Адское возмездие');
    assert.strictEqual(hellishRebuke.level, 2);
    assert.strictEqual(hellishRebuke.prepared, true);
    assert.strictEqual(hellishRebuke.isRacial, true);
    assert.strictEqual(hellishRebuke.source, 'Раса: Адское возмездие (Адское наследие)');

    // Level 5 Tiefling gains Darkness
    const spellsAtLvl5 = getAutoGrantedSpellsForLevel(tieflingFighter, 5);
    const darkness = spellsAtLvl5.find(s => s.name === 'Тьма');
    assert.ok(darkness);
    assert.strictEqual(darkness.isRacial, true);
  });

  it('5. Drow Rogue at level 3 gains Огонь фей (racial)', () => {
    const drowRogue = {
      name: 'Дзирт',
      race: 'Эльф',
      subrace: 'Дроу',
      className: 'Плут',
      level: 2,
    } as CharacterData;

    const spellsAtLvl3 = getAutoGrantedSpellsForLevel(drowRogue, 3);
    assert.strictEqual(spellsAtLvl3.length, 1, 'Drow Rogue must receive exactly 1 racial spell at level 3');

    const faerieFire = spellsAtLvl3[0];
    assert.strictEqual(faerieFire.name, 'Огонь фей');
    assert.strictEqual(faerieFire.level, 1);
    assert.strictEqual(faerieFire.prepared, true);
    assert.strictEqual(faerieFire.isRacial, true);
    assert.strictEqual(faerieFire.source, 'Раса: Огонь фей (Магия дроу)');

    // Level 5 Drow gains Darkness
    const spellsAtLvl5 = getAutoGrantedSpellsForLevel(drowRogue, 5);
    const darkness = spellsAtLvl5.find(s => s.name === 'Тьма');
    assert.ok(darkness);
    assert.strictEqual(darkness.isRacial, true);
  });

  it('6. All 7 smite spells exist in DND_COMPENDIUM_SPELLS', () => {
    const smites = [
      {
        name: 'Божественная кара',
        nameEn: 'Divine Smite',
        level: 1,
        school: 'Воплощение',
        castingTime: '1 попадание',
        range: 'На себя',
        damage: '2d8',
        damageType: 'излучение',
      },
      {
        name: 'Громовая кара',
        nameEn: 'Thunderous Smite',
        level: 1,
        school: 'Воплощение',
        castingTime: '1 бонусное действие',
        range: 'На себя',
        damage: '2d6',
        damageType: 'звук',
        save: 'Сила',
      },
      {
        name: 'Гневная кара',
        nameEn: 'Wrathful Smite',
        level: 1,
        school: 'Воплощение',
        castingTime: '1 бонусное действие',
        range: 'На себя',
        damage: '1d6',
        damageType: 'психическая энергия',
        save: 'Мудрость',
      },
      {
        name: 'Обжигающая кара',
        nameEn: 'Searing Smite',
        level: 1,
        school: 'Воплощение',
        castingTime: '1 бонусное действие',
        range: 'На себя',
        damage: '1d6',
        damageType: 'огонь',
        save: 'Телосложение',
      },
      {
        name: 'Ослепляющая кара',
        nameEn: 'Blinding Smite',
        level: 3,
        school: 'Воплощение',
        castingTime: '1 бонусное действие',
        range: 'На себя',
        damage: '3d8',
        damageType: 'излучение',
        save: 'Телосложение',
      },
      {
        name: 'Ошеломляющая кара',
        nameEn: 'Staggering Smite',
        level: 4,
        school: 'Очарование',
        castingTime: '1 бонусное действие',
        range: 'На себя',
        damage: '4d6',
        damageType: 'психическая энергия',
        save: 'Мудрость',
      },
      {
        name: 'Изгоняющая кара',
        nameEn: 'Banishing Smite',
        level: 5,
        school: 'Ограждение',
        castingTime: '1 бонусное действие',
        range: 'На себя',
        damage: '5d10',
        damageType: 'силовое поле',
      },
    ];

    for (const expected of smites) {
      const spell = findSpellByName(expected.name);
      assert.ok(spell, `Spell "${expected.name}" must be found by findSpellByName`);
      assert.strictEqual(spell.name, expected.name);
      assert.strictEqual(spell.nameEn, expected.nameEn);
      assert.strictEqual(spell.level, expected.level);
      assert.strictEqual(spell.school, expected.school);
      assert.strictEqual(spell.castingTime, expected.castingTime);
      assert.strictEqual(spell.range, expected.range);
      assert.strictEqual(spell.damage, expected.damage);
      assert.strictEqual(spell.damageType, expected.damageType);
      if (expected.save) {
        assert.strictEqual(spell.save, expected.save);
      }
      assert.ok(spell.classes?.includes('Паладин'), `Spell "${expected.name}" must include Paladin in classes`);
      assert.ok(spell.description.length > 20, `Spell "${expected.name}" must have a detailed description`);

      // English name lookup check
      const spellByEn = findSpellByName(expected.nameEn);
      assert.ok(spellByEn, `Spell "${expected.nameEn}" must be found by English name`);
      assert.strictEqual(spellByEn.name, expected.name);

      // Direct compendium presence check
      const inCompendium = DND_COMPENDIUM_SPELLS.find(s => s.name === expected.name);
      assert.ok(inCompendium, `Spell "${expected.name}" must be in DND_COMPENDIUM_SPELLS array`);
    }
  });

  it('7. Ranger archetype, Artificer specialization, Druid circles', () => {
    // Ranger: Сумрачный охотник gains 1 spell at level 3
    const ranger = {
      className: 'Следопыт',
      subclass: 'Сумрачный охотник',
      level: 2,
    } as CharacterData;
    const rangerSpellsLvl3 = getAutoGrantedSpellsForLevel(ranger, 3);
    assert.strictEqual(rangerSpellsLvl3.length, 1);
    assert.strictEqual(rangerSpellsLvl3[0].name, 'Маскировка');
    assert.strictEqual(rangerSpellsLvl3[0].level, 1);

    // Artificer: Боевой кузнец gains 2 spells at level 3
    const artificer = {
      className: 'Изобретатель',
      subclass: 'Боевой кузнец',
      level: 2,
    } as CharacterData;
    const artSpellsLvl3 = getAutoGrantedSpellsForLevel(artificer, 3);
    assert.strictEqual(artSpellsLvl3.length, 2);
    assert.ok(artSpellsLvl3.some(s => s.name === 'Героизм'));
    assert.ok(artSpellsLvl3.some(s => s.name === 'Щит'));

    // Druid: Круг земли gains 2 circle 2 spells at level 3
    const druid = {
      className: 'Друид',
      subclass: 'Круг земли',
      level: 2,
    } as CharacterData;
    const druidSpellsLvl3 = getAutoGrantedSpellsForLevel(druid, 3);
    assert.strictEqual(druidSpellsLvl3.length, 2);
    assert.ok(druidSpellsLvl3.some(s => s.name === 'Паутина'));
    assert.ok(druidSpellsLvl3.some(s => s.name === 'Зеркальное отражение'));
  });

  it('8. Non-caster characters at non-milestone levels return empty array', () => {
    const fighter = {
      className: 'Воин',
      level: 3,
    } as CharacterData;
    const emptySpells = getAutoGrantedSpellsForLevel(fighter, 4);
    assert.deepStrictEqual(emptySpells, []);
  });
});
