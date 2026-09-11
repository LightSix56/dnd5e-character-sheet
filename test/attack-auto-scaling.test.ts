import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Attack,
  AbilityName,
  resolveAttackAbility,
  recalculateSingleAttack,
  recalculateAttacksOnStatsChange,
  formatModifier
} from '../src/lib/dnd-types';

test('Attack Auto-Scaling Engine', async (t) => {
  const baseMods: Record<AbilityName, number> = {
    'СИЛ': 3,
    'ЛОВ': 2,
    'ТЕЛ': 2,
    'ИНТ': 0,
    'МДР': 1,
    'ХАР': -1
  };
  const baseProf = 2;

  await t.test('1. resolveAttackAbility correctly detects weapon ability', () => {
    // Ranged weapons use DEX
    assert.equal(resolveAttackAbility({ name: 'Длинный лук', attackBonus: '+4', damageAndType: '1d8+2 колющий' }), 'ЛОВ');
    assert.equal(resolveAttackAbility({ name: 'Короткий лук', attackBonus: '+4', damageAndType: '1d6+2 колющий' }), 'ЛОВ');
    assert.equal(resolveAttackAbility({ name: 'Тяжелый арбалет', attackBonus: '+4', damageAndType: '1d10+2 колющий' }), 'ЛОВ');

    // Melee weapons without finesse use STR
    assert.equal(resolveAttackAbility({ name: 'Длинный меч', attackBonus: '+5', damageAndType: '1d8+3 рубящий' }), 'СИЛ');
    assert.equal(resolveAttackAbility({ name: 'Двуручный меч', attackBonus: '+5', damageAndType: '2d6+3 рубящий' }), 'СИЛ');
    assert.equal(resolveAttackAbility({ name: 'Боевой молот', attackBonus: '+5', damageAndType: '1d8+3 дробящий' }), 'СИЛ');

    // Finesse weapons adapt to higher of STR / DEX
    const charHighDex = { abilityScores: { 'СИЛ': 10, 'ЛОВ': 16 } as any, abilityBonuses: {} as any, asiBonuses: {} as any, level: 1 };
    const charHighStr = { abilityScores: { 'СИЛ': 16, 'ЛОВ': 10 } as any, abilityBonuses: {} as any, asiBonuses: {} as any, level: 1 };
    assert.equal(resolveAttackAbility({ name: 'Рапира', attackBonus: '+5', damageAndType: '1d8+3 колющий' }, charHighDex), 'ЛОВ');
    assert.equal(resolveAttackAbility({ name: 'Рапира', attackBonus: '+5', damageAndType: '1d8+3 колющий' }, charHighStr), 'СИЛ');
    assert.equal(resolveAttackAbility({ name: 'Кинжал', attackBonus: '+5', damageAndType: '1d4+3 колющий' }, charHighDex), 'ЛОВ');

    // Explicit ability override
    assert.equal(resolveAttackAbility({ name: 'Клинок ведьмы', attackBonus: '+5', damageAndType: '1d8+3 силовое поле', ability: 'ХАР' }), 'ХАР');

    // Custom weapon name with keyword
    assert.equal(resolveAttackAbility({ name: 'Магический лук теней', attackBonus: '+5', damageAndType: '1d8+3 колющий' }), 'ЛОВ');
  });

  await t.test('2. Attack bonus scales with ability modifier and proficiency bonus', () => {
    const bow: Attack = { name: 'Короткий лук', attackBonus: '+4', damageAndType: '1d6+2 колющий' };

    // Case A: DEX increases from +2 to +3, Prof remains 2
    const modsDexUp = { ...baseMods, 'ЛОВ': 3 };
    const resultDexUp = recalculateSingleAttack(bow, baseMods, modsDexUp, baseProf, baseProf);
    assert.equal(resultDexUp.attackBonus, '+5', 'To-hit should increase by 1 when DEX increases by 1');

    // Case B: Level up from 4 to 5 (Prof increases from +2 to +3), DEX remains 2
    const resultProfUp = recalculateSingleAttack(bow, baseMods, baseMods, baseProf, 3);
    assert.equal(resultProfUp.attackBonus, '+5', 'To-hit should increase by 1 when BM increases by 1');

    // Case C: Both DEX and Prof increase by 1
    const resultBothUp = recalculateSingleAttack(bow, baseMods, modsDexUp, baseProf, 3);
    assert.equal(resultBothUp.attackBonus, '+6', 'To-hit should increase by 2 when both DEX and BM increase by 1');

    // Case D: STR increases from +3 to +4, bow (DEX) should NOT change
    const modsStrUp = { ...baseMods, 'СИЛ': 4 };
    const resultStrUp = recalculateSingleAttack(bow, baseMods, modsStrUp, baseProf, baseProf);
    assert.equal(resultStrUp.attackBonus, '+4', 'DEX weapon to-hit should not change when STR increases');

    // Case E: Sword (STR) increases when STR increases
    const sword: Attack = { name: 'Длинный меч', attackBonus: '+5', damageAndType: '1d8+3 рубящий' };
    const swordResult = recalculateSingleAttack(sword, baseMods, modsStrUp, baseProf, baseProf);
    assert.equal(swordResult.attackBonus, '+6', 'STR weapon to-hit should increase when STR increases');
  });

  await t.test('3. Damage bonus scales with ability modifier, but NEVER with proficiency bonus', () => {
    const bow: Attack = { name: 'Короткий лук', attackBonus: '+4', damageAndType: '1d6+2 колющий' };

    // When DEX increases +2 -> +3, damage increases +2 -> +3
    const modsDexUp = { ...baseMods, 'ЛОВ': 3 };
    const resultDexUp = recalculateSingleAttack(bow, baseMods, modsDexUp, baseProf, baseProf);
    assert.equal(resultDexUp.damageAndType, '1d6+3 колющий', 'Damage modifier must increase when DEX increases');

    // When only BM increases (+2 -> +3), damage must NOT change!
    const resultProfUp = recalculateSingleAttack(bow, baseMods, baseMods, baseProf, 3);
    assert.equal(resultProfUp.damageAndType, '1d6+2 колющий', 'D&D 5e rule: BM must NOT be added to weapon damage!');

    // Formatting checks:
    // Ability goes to 0 (modifier vanishes cleanly, e.g. 1d8 instead of 1d8+0)
    const sword: Attack = { name: 'Длинный меч', attackBonus: '+3', damageAndType: '1d8+1 рубящий' };
    const modsStrZero = { ...baseMods, 'СИЛ': 0 };
    const resultStrZero = recalculateSingleAttack(sword, { ...baseMods, 'СИЛ': 1 }, modsStrZero, baseProf, baseProf);
    assert.equal(resultStrZero.damageAndType, '1d8 рубящий', 'Modifier 0 should format cleanly without +0');

    // Ability goes negative (e.g. 1d8-1)
    const modsStrNeg = { ...baseMods, 'СИЛ': -1 };
    const resultStrNeg = recalculateSingleAttack(sword, { ...baseMods, 'СИЛ': 1 }, modsStrNeg, baseProf, baseProf);
    assert.equal(resultStrNeg.damageAndType, '1d8-1 рубящий', 'Negative modifier should format with minus sign');

    // Ability increases from 0 (e.g. 1d8 рубящий -> 1d8+1 рубящий)
    const unarmed: Attack = { name: 'Длинный меч', attackBonus: '+2', damageAndType: '1d8 рубящий' };
    const resultFromZero = recalculateSingleAttack(unarmed, modsStrZero, { ...baseMods, 'СИЛ': 1 }, baseProf, baseProf);
    assert.equal(resultFromZero.damageAndType, '1d8+1 рубящий', 'Increasing from 0 modifier should append +1');
  });

  await t.test('4. Preserves magic weapon bonuses and versatile damage notations', () => {
    // Magic +1 weapon: base attack bonus +6 (STR 3 + Prof 2 + Magic 1), damage 1d8+4 (STR 3 + Magic 1)
    const magicSword: Attack = { name: 'Длинный меч +1', attackBonus: '+6', damageAndType: '1d8+4 рубящий' };
    const modsStrUp = { ...baseMods, 'СИЛ': 4 };
    const result = recalculateSingleAttack(magicSword, baseMods, modsStrUp, baseProf, baseProf);
    assert.equal(result.attackBonus, '+7', 'Magic bonus +1 preserved in to-hit');
    assert.equal(result.damageAndType, '1d8+5 рубящий', 'Magic bonus +1 preserved in damage');

    // Versatile notation: 1d8+3 / 1d10+3 рубящий
    const versatileSword: Attack = { name: 'Длинный меч', attackBonus: '+5', damageAndType: '1d8+3 / 1d10+3 рубящий' };
    const vResult = recalculateSingleAttack(versatileSword, baseMods, modsStrUp, baseProf, baseProf);
    assert.equal(vResult.damageAndType, '1d8+4 / 1d10+4 рубящий', 'Versatile multi-damage dice both update');
  });

  await t.test('5. Batch attacks update when leveling up or changing ability scores', () => {
    const attacks: Attack[] = [
      { name: 'Двуручный меч', attackBonus: '+5', damageAndType: '2d6+3 рубящий' }, // STR
      { name: 'Длинный лук', attackBonus: '+4', damageAndType: '1d8+2 колющий' },   // DEX
      { name: 'Кинжал', attackBonus: '+4', damageAndType: '1d4+2 колющий' }        // Finesse (DEX)
    ];

    // Character levels up to level 5 (+1 BM), and took ASI in DEX (+2 -> +3)
    const oldMods = { ...baseMods };
    const newMods = { ...baseMods, 'ЛОВ': 3 }; // DEX +2 -> +3, STR remains +3
    const oldProf = 2;
    const newProf = 3;

    const updated = recalculateAttacksOnStatsChange(attacks, oldMods, newMods, oldProf, newProf);

    // Two-handed sword (STR): to-hit +5 -> +6 (from BM only), damage unchanged (2d6+3)
    assert.equal(updated[0].attackBonus, '+6');
    assert.equal(updated[0].damageAndType, '2d6+3 рубящий');

    // Longbow (DEX): to-hit +4 -> +6 (+1 DEX + 1 BM), damage +2 -> +3 (1d8+3)
    assert.equal(updated[1].attackBonus, '+6');
    assert.equal(updated[1].damageAndType, '1d8+3 колющий');

    // Dagger (DEX): to-hit +4 -> +6, damage +2 -> +3 (1d4+3)
    assert.equal(updated[2].attackBonus, '+6');
    assert.equal(updated[2].damageAndType, '1d4+3 колющий');
  });

  await t.test('6. Reversible: decreasing stats or level-rollback reduces attack values', () => {
    const attacks: Attack[] = [
      { name: 'Длинный лук', attackBonus: '+6', damageAndType: '1d8+3 колющий' }
    ];

    // Rollback level: Prof 3 -> 2, DEX 3 -> 2
    const currentMods = { ...baseMods, 'ЛОВ': 3 };
    const rolledBackMods = { ...baseMods, 'ЛОВ': 2 };

    const rolledBack = recalculateAttacksOnStatsChange(attacks, currentMods, rolledBackMods, 3, 2);
    assert.equal(rolledBack[0].attackBonus, '+4');
    assert.equal(rolledBack[0].damageAndType, '1d8+2 колющий');
  });
});
