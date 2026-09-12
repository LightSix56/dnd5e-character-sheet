import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { checkFeatPrerequisites, CharacterPrereqContext } from '../src/data/compendium/feat-prerequisites';
import { findFeatByName } from '../src/data/compendium/feats';

describe('Feat Prerequisites Engine: Adversarial Verification', () => {
  it('feats without prerequisites are always satisfied', () => {
    const alertFeat = findFeatByName('Alert');
    assert.ok(alertFeat, 'Alert feat must exist');

    const emptyContext: CharacterPrereqContext = {
      stats: { СИЛ: 10, ЛОВ: 10, ТЕЛ: 10, ИНТ: 10, МДР: 10, ХАР: 10 },
      level: 1,
    };

    const res = checkFeatPrerequisites(alertFeat!, emptyContext);
    assert.strictEqual(res.satisfied, true);
    assert.strictEqual(res.unmetReason, undefined);
  });

  it('validates ability score prerequisites (STR, DEX, CHA, INT/WIS >= 13)', () => {
    // 1. STR 13+ (Grappler)
    const grappler = findFeatByName('Grappler');
    assert.ok(grappler);
    const lowStr: CharacterPrereqContext = {
      stats: { СИЛ: 11, ЛОВ: 10, ТЕЛ: 10, ИНТ: 10, МДР: 10, ХАР: 10 },
    };
    const highStr: CharacterPrereqContext = {
      stats: { СИЛ: 14, ЛОВ: 10, ТЕЛ: 10, ИНТ: 10, МДР: 10, ХАР: 10 },
    };
    assert.strictEqual(checkFeatPrerequisites(grappler!, lowStr).satisfied, false);
    assert.match(checkFeatPrerequisites(grappler!, lowStr).unmetReason || '', /Сила 13\+/);
    assert.strictEqual(checkFeatPrerequisites(grappler!, highStr).satisfied, true);

    // 2. DEX 13+ (Defensive Duelist)
    const defensiveDuelist = findFeatByName('Defensive Duelist');
    assert.ok(defensiveDuelist);
    const lowDex: CharacterPrereqContext = {
      stats: { СИЛ: 10, ЛОВ: 12, ТЕЛ: 10, ИНТ: 10, МДР: 10, ХАР: 10 },
    };
    const highDex: CharacterPrereqContext = {
      stats: { СИЛ: 10, ЛОВ: 14, ТЕЛ: 10, ИНТ: 10, МДР: 10, ХАР: 10 },
    };
    assert.strictEqual(checkFeatPrerequisites(defensiveDuelist!, lowDex).satisfied, false);
    assert.match(checkFeatPrerequisites(defensiveDuelist!, lowDex).unmetReason || '', /Ловкость 13\+/);
    assert.strictEqual(checkFeatPrerequisites(defensiveDuelist!, highDex).satisfied, true);

    // 3. CHA 13+ (Inspiring Leader)
    const leader = findFeatByName('Inspiring Leader');
    assert.ok(leader);
    const lowCha: CharacterPrereqContext = {
      stats: { СИЛ: 10, ЛОВ: 10, ТЕЛ: 10, ИНТ: 10, МДР: 10, ХАР: 11 },
    };
    const highCha: CharacterPrereqContext = {
      stats: { СИЛ: 10, ЛОВ: 10, ТЕЛ: 10, ИНТ: 10, МДР: 10, ХАР: 13 },
    };
    assert.strictEqual(checkFeatPrerequisites(leader!, lowCha).satisfied, false);
    assert.match(checkFeatPrerequisites(leader!, lowCha).unmetReason || '', /Харизма 13\+/);
    assert.strictEqual(checkFeatPrerequisites(leader!, highCha).satisfied, true);

    // 4. INT or WIS 13+ (Ritual Caster)
    const ritualCaster = findFeatByName('Ritual Caster');
    assert.ok(ritualCaster);
    const lowIntWis: CharacterPrereqContext = {
      stats: { СИЛ: 10, ЛОВ: 10, ТЕЛ: 10, ИНТ: 12, МДР: 10, ХАР: 10 },
    };
    const highInt: CharacterPrereqContext = {
      stats: { СИЛ: 10, ЛОВ: 10, ТЕЛ: 10, ИНТ: 14, МДР: 8, ХАР: 10 },
    };
    const highWis: CharacterPrereqContext = {
      stats: { СИЛ: 10, ЛОВ: 10, ТЕЛ: 10, ИНТ: 9, МДР: 13, ХАР: 10 },
    };
    assert.strictEqual(checkFeatPrerequisites(ritualCaster!, lowIntWis).satisfied, false);
    assert.match(checkFeatPrerequisites(ritualCaster!, lowIntWis).unmetReason || '', /Интеллект или Мудрость 13\+/);
    assert.strictEqual(checkFeatPrerequisites(ritualCaster!, highInt).satisfied, true);
    assert.strictEqual(checkFeatPrerequisites(ritualCaster!, highWis).satisfied, true);
  });

  it('validates level requirements (e.g. Level 4+ feats)', () => {
    const agentOfOrder = findFeatByName('Agent of Order'); // 4 level req
    assert.ok(agentOfOrder);

    const level1: CharacterPrereqContext = {
      stats: { СИЛ: 14, ЛОВ: 14, ТЕЛ: 14, ИНТ: 14, МДР: 14, ХАР: 14 },
      level: 1,
    };
    const level4: CharacterPrereqContext = {
      stats: { СИЛ: 14, ЛОВ: 14, ТЕЛ: 14, ИНТ: 14, МДР: 14, ХАР: 14 },
      level: 4,
      existingFeatNames: ['Наследник внешних планов (законный внешний план)'],
    };

    const res1 = checkFeatPrerequisites(agentOfOrder!, level1);
    assert.strictEqual(res1.satisfied, false);
    assert.match(res1.unmetReason || '', /4.*уровень/i);

    const res4 = checkFeatPrerequisites(agentOfOrder!, level4);
    assert.strictEqual(res4.satisfied, true);
  });

  it('validates racial restrictions (e.g. Elven Accuracy, Dwarven Fortitude)', () => {
    const elvenAccuracy = findFeatByName('Elven Accuracy');
    assert.ok(elvenAccuracy);

    const humanContext: CharacterPrereqContext = {
      stats: { СИЛ: 10, ЛОВ: 16, ТЕЛ: 10, ИНТ: 10, МДР: 10, ХАР: 10 },
      race: 'Человек',
    };
    const elfContext: CharacterPrereqContext = {
      stats: { СИЛ: 10, ЛОВ: 16, ТЕЛ: 10, ИНТ: 10, МДР: 10, ХАР: 10 },
      race: 'Эльф',
    };
    const halfElfContext: CharacterPrereqContext = {
      stats: { СИЛ: 10, ЛОВ: 16, ТЕЛ: 10, ИНТ: 10, МДР: 10, ХАР: 10 },
      race: 'Полуэльф',
    };

    assert.strictEqual(checkFeatPrerequisites(elvenAccuracy!, humanContext).satisfied, false);
    assert.match(checkFeatPrerequisites(elvenAccuracy!, humanContext).unmetReason || '', /Эльф/);
    assert.strictEqual(checkFeatPrerequisites(elvenAccuracy!, elfContext).satisfied, true);
    assert.strictEqual(checkFeatPrerequisites(elvenAccuracy!, halfElfContext).satisfied, true);

    const dwarvenFortitude = findFeatByName('Дварфийская стойкость');
    if (dwarvenFortitude) {
      assert.strictEqual(checkFeatPrerequisites(dwarvenFortitude, humanContext).satisfied, false);
      const dwarfContext: CharacterPrereqContext = {
        stats: { СИЛ: 10, ЛОВ: 10, ТЕЛ: 16, ИНТ: 10, МДР: 10, ХАР: 10 },
        race: 'Дварф',
      };
      assert.strictEqual(checkFeatPrerequisites(dwarvenFortitude, dwarfContext).satisfied, true);
    }
  });

  it('validates spellcasting ability requirement (War Caster, Metamagic Adept)', () => {
    const warCaster = findFeatByName('War Caster');
    assert.ok(warCaster);

    const nonCaster: CharacterPrereqContext = {
      stats: { СИЛ: 16, ЛОВ: 12, ТЕЛ: 14, ИНТ: 8, МДР: 10, ХАР: 10 },
      className: 'Воин',
      canCastSpells: false,
    };
    const wizardCaster: CharacterPrereqContext = {
      stats: { СИЛ: 8, ЛОВ: 14, ТЕЛ: 14, ИНТ: 16, МДР: 12, ХАР: 10 },
      className: 'Волшебник',
      canCastSpells: true,
    };

    assert.strictEqual(checkFeatPrerequisites(warCaster!, nonCaster).satisfied, false);
    assert.match(checkFeatPrerequisites(warCaster!, nonCaster).unmetReason || '', /заклинани/i);
    assert.strictEqual(checkFeatPrerequisites(warCaster!, wizardCaster).satisfied, true);
  });

  it('validates armor proficiencies (Heavy Armor Master, Moderately Armored)', () => {
    const heavyArmorMaster = findFeatByName('Heavy Armor Master');
    assert.ok(heavyArmorMaster);

    const unarmored: CharacterPrereqContext = {
      stats: { СИЛ: 16, ЛОВ: 10, ТЕЛ: 14, ИНТ: 10, МДР: 10, ХАР: 10 },
      armorProficiencies: ['Лёгкие доспехи'],
    };
    const heavyArmored: CharacterPrereqContext = {
      stats: { СИЛ: 16, ЛОВ: 10, ТЕЛ: 14, ИНТ: 10, МДР: 10, ХАР: 10 },
      armorProficiencies: ['Лёгкие доспехи', 'Средние доспехи', 'Тяжёлые доспехи'],
    };

    assert.strictEqual(checkFeatPrerequisites(heavyArmorMaster!, unarmored).satisfied, false);
    assert.match(checkFeatPrerequisites(heavyArmorMaster!, unarmored).unmetReason || '', /тяж[её]л/i);
    assert.strictEqual(checkFeatPrerequisites(heavyArmorMaster!, heavyArmored).satisfied, true);
  });
});
