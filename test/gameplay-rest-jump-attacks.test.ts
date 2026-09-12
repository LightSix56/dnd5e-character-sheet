import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CharacterData,
  Attack,
  AbilityName,
  createDefaultCharacter,
  getCarryingCapacity,
  getJumpDistances,
  hasPowerfulBuild,
  recalculateSingleAttack,
  setAttackProficiency,
  applyShortRest,
  applyLongRest,
} from '../src/lib/dnd-types';

test('Gameplay Engine: Jump Distances & Carrying Capacity', async (t) => {
  await t.test('Carrying capacity calculates standard STR * 15 and push/drag/lift STR * 30', () => {
    const char = createDefaultCharacter();
    char.abilityScores['СИЛ'] = 10;
    char.abilityBonuses['СИЛ'] = 0;
    char.asiBonuses['СИЛ'] = 0;

    const cap = getCarryingCapacity(char);
    assert.equal(cap.maxCarry, 150, 'STR 10 carrying capacity should be 150 lbs');
    assert.equal(cap.pushDragLift, 300, 'STR 10 push/drag/lift should be 300 lbs');
    assert.equal(cap.isPowerfulBuild, false);

    // STR 18 (e.g. 15 base + 2 racial + 1 asi)
    char.abilityScores['СИЛ'] = 15;
    char.abilityBonuses['СИЛ'] = 2;
    char.asiBonuses['СИЛ'] = 1;
    const cap18 = getCarryingCapacity(char);
    assert.equal(cap18.maxCarry, 270, 'STR 18 carrying capacity should be 270 lbs');
    assert.equal(cap18.pushDragLift, 540, 'STR 18 push/drag/lift should be 540 lbs');
  });

  await t.test('Carrying capacity doubles with Powerful Build (race Goliath / Firbolg / Orc or trait)', () => {
    const char = createDefaultCharacter();
    char.abilityScores['СИЛ'] = 16;
    char.race = 'Голиаф';

    assert.equal(hasPowerfulBuild(char), true, 'Goliath should have powerful build');
    const capGoliath = getCarryingCapacity(char);
    assert.equal(capGoliath.maxCarry, 480, '16 STR Goliath carrying capacity = 16 * 15 * 2 = 480 lbs');
    assert.equal(capGoliath.pushDragLift, 960, '16 STR Goliath push/drag/lift = 16 * 30 * 2 = 960 lbs');
    assert.equal(capGoliath.isPowerfulBuild, true);

    // Test with trait in traitsList
    const charHuman = createDefaultCharacter();
    charHuman.abilityScores['СИЛ'] = 14;
    charHuman.race = 'Человек';
    charHuman.traitsList = [{ id: 'pb1', name: 'Мощное телосложение', description: 'Вы считаетесь на один размер больше...' }];
    assert.equal(hasPowerfulBuild(charHuman), true);
    const capHuman = getCarryingCapacity(charHuman);
    assert.equal(capHuman.maxCarry, 420, '14 STR with Powerful Build trait = 14 * 15 * 2 = 420 lbs');
  });

  await t.test('Jump distances follow D&D 5e PHB p. 182 rules', () => {
    const char = createDefaultCharacter();

    // STR 10 (Mod 0)
    char.abilityScores['СИЛ'] = 10;
    const j10 = getJumpDistances(char);
    assert.equal(j10.longRun, 10, 'Long jump running = STR score (10 ft)');
    assert.equal(j10.longStanding, 5, 'Long jump standing = floor(STR / 2) = 5 ft');
    assert.equal(j10.highRun, 3, 'High jump running = 3 + STR mod (3 + 0 = 3 ft)');
    assert.equal(j10.highStanding, 1, 'High jump standing = floor((3 + 0) / 2) = 1 ft');

    // STR 16 (Mod +3)
    char.abilityScores['СИЛ'] = 16;
    const j16 = getJumpDistances(char);
    assert.equal(j16.longRun, 16);
    assert.equal(j16.longStanding, 8);
    assert.equal(j16.highRun, 6, 'High jump running = 3 + 3 = 6 ft');
    assert.equal(j16.highStanding, 3, 'High jump standing = floor(6 / 2) = 3 ft');

    // STR 8 (Mod -1)
    char.abilityScores['СИЛ'] = 8;
    const j8 = getJumpDistances(char);
    assert.equal(j8.longRun, 8);
    assert.equal(j8.longStanding, 4);
    assert.equal(j8.highRun, 2, 'High jump running = 3 + (-1) = 2 ft');
    assert.equal(j8.highStanding, 1, 'High jump standing = floor(2 / 2) = 1 ft');

    // Extreme low STR 3 (Mod -4)
    char.abilityScores['СИЛ'] = 3;
    const j3 = getJumpDistances(char);
    assert.equal(j3.longRun, 3);
    assert.equal(j3.longStanding, 1);
    assert.equal(j3.highRun, 0, 'High jump cannot be negative (max(0, 3-4))');
    assert.equal(j3.highStanding, 0);
  });
});

test('Gameplay Engine: Attack Proficiency Toggle & Recalculation', async (t) => {
  const baseMods: Record<AbilityName, number> = {
    'СИЛ': 3,
    'ЛОВ': 2,
    'ТЕЛ': 2,
    'ИНТ': 0,
    'МДР': 1,
    'ХАР': -1
  };
  const baseProf = 2;

  await t.test('Proficient attack scales with proficiency bonus; non-proficient does not', () => {
    const profSword: Attack = { name: 'Длинный меч', attackBonus: '+5', damageAndType: '1d8+3 рубящий', proficient: true };
    const nonProfSword: Attack = { name: 'Длинный меч', attackBonus: '+3', damageAndType: '1d8+3 рубящий', proficient: false };

    // Level up from Prof 2 to Prof 3
    const resProf = recalculateSingleAttack(profSword, baseMods, baseMods, baseProf, 3);
    assert.equal(resProf.attackBonus, '+6', 'Proficient attack should gain +1 from PB increase');

    const resNonProf = recalculateSingleAttack(nonProfSword, baseMods, baseMods, baseProf, 3);
    assert.equal(resNonProf.attackBonus, '+3', 'Non-proficient attack should NOT gain bonus from PB increase');
  });

  await t.test('setAttackProficiency toggles attack bonus correctly', () => {
    const atk: Attack = { name: 'Импровизированная булава', attackBonus: '+5', damageAndType: '1d6+3 дробящий', proficient: true };
    const pb = 3;

    // Toggle off proficiency (e.g. character loses or never had weapon proficiency)
    const toggledOff = setAttackProficiency(atk, false, pb);
    assert.equal(toggledOff.proficient, false);
    assert.equal(toggledOff.attackBonus, '+2', '+5 - 3 = +2');

    // Toggle back on
    const toggledOn = setAttackProficiency(toggledOff, true, pb);
    assert.equal(toggledOn.proficient, true);
    assert.equal(toggledOn.attackBonus, '+5', '+2 + 3 = +5');
  });
});

test('Gameplay Engine: Short and Long Rest Mechanics', async (t) => {
  await t.test('Short Rest: recovers HP up to hpMax and increments hitDiceSpent', () => {
    const char = createDefaultCharacter();
    char.level = 4;
    char.hpMax = 30;
    char.hpCurrent = 12;
    char.hitDiceSpent = 1;

    // Roll 1 hit die healing 8 HP
    const rested = applyShortRest(char, { diceSpent: 1, hpHealed: 8 });
    assert.equal(rested.hpCurrent, 20);
    assert.equal(rested.hitDiceSpent, 2);

    // Over-healing is capped at hpMax
    const overHealed = applyShortRest(rested, { diceSpent: 1, hpHealed: 25 });
    assert.equal(overHealed.hpCurrent, 30, 'HP cannot exceed hpMax');
    assert.equal(overHealed.hitDiceSpent, 3);
  });

  await t.test('Short Rest: resets Warlock spell slots when requested', () => {
    const warlock = createDefaultCharacter();
    warlock.className = 'Колдун';
    warlock.level = 3;
    warlock.spellSlots = {
      2: { totalSlots: 2, expendedSlots: 2 }
    };

    const rested = applyShortRest(warlock, { diceSpent: 0, hpHealed: 0, resetWarlockSlots: true });
    assert.equal(rested.spellSlots[2].expendedSlots, 0, 'Warlock pact slots should reset to 0 expended');
  });

  await t.test('Long Rest: resets HP to max, hpTemp to 0, clears death saves, resets spell slots, recovers hit dice', () => {
    const char = createDefaultCharacter();
    char.level = 6;
    char.hpMax = 48;
    char.hpCurrent = 10;
    char.hpTemp = 8;
    char.deathSaveSuccesses = 2;
    char.deathSaveFailures = 1;
    char.hitDiceSpent = 5;
    char.spellSlots = {
      1: { totalSlots: 4, expendedSlots: 3 },
      2: { totalSlots: 3, expendedSlots: 2 },
      3: { totalSlots: 2, expendedSlots: 1 },
    };

    const longRested = applyLongRest(char);

    assert.equal(longRested.hpCurrent, 48, 'HP should be restored to hpMax');
    assert.equal(longRested.hpTemp, 0, 'Temporary HP should be reset to 0');
    assert.equal(longRested.deathSaveSuccesses, 0, 'Death save successes should reset to 0');
    assert.equal(longRested.deathSaveFailures, 0, 'Death save failures should reset to 0');

    // Hit dice recovery: recovers max(1, floor(level / 2)) = floor(6 / 2) = 3 dice
    // Spent was 5 -> 5 - 3 = 2
    assert.equal(longRested.hitDiceSpent, 2, 'Should recover 3 hit dice, leaving 2 spent');

    // All spell slots expendedSlots reset to 0
    assert.equal(longRested.spellSlots[1].expendedSlots, 0);
    assert.equal(longRested.spellSlots[2].expendedSlots, 0);
    assert.equal(longRested.spellSlots[3].expendedSlots, 0);
  });
});
