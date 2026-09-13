import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter, getAC, getEffectiveSpeed, getTotalScore } from '../src/lib/dnd-types.js';
import { equipItem, unequipItem, EquippedItem, getActiveCharacterAttacks } from '../src/lib/equipment-types.js';

describe('Real-Time Equipment Effects Integration', () => {
  test('getAC incorporates equipment item ac effects', () => {
    const char = createDefaultCharacter();
    const baseAC = getAC(char);

    const ring: EquippedItem = {
      id: 'ring-1',
      name: 'Кольцо защиты +1',
      slot: 'ring1',
      effects: [{ id: 'e-1', type: 'ac', value: 1 }],
    };
    const equipped = equipItem(char, 'ring1', ring);
    assert.equal(getAC(equipped), baseAC + 1);

    const unequipped = unequipItem(equipped, 'ring1');
    assert.equal(getAC(unequipped), baseAC);
  });

  test('getEffectiveSpeed incorporates equipment speed effects', () => {
    const char = createDefaultCharacter();
    char.speed = 30;

    const boots: EquippedItem = {
      id: 'boots-1',
      name: 'Сапоги скорости',
      slot: 'boots',
      effects: [{ id: 'e-spd', type: 'speed', value: 10 }],
    };
    const equipped = equipItem(char, 'boots', boots);
    assert.equal(getEffectiveSpeed(equipped), 40);
  });

  test('getTotalScore incorporates equipment ability effects', () => {
    const char = createDefaultCharacter();
    char.abilityScores['СИЛ'] = 14;

    const gauntlets: EquippedItem = {
      id: 'g-1',
      name: 'Рукавицы силы',
      slot: 'gloves',
      effects: [{ id: 'e-str', type: 'ability', targetAbility: 'str', value: 2 }],
    };
    const equipped = equipItem(char, 'gloves', gauntlets);
    assert.equal(getTotalScore(equipped, 'str'), 16);
  });

  test('getActiveCharacterAttacks incorporates weapon attackDamage effects', () => {
    const char = createDefaultCharacter();
    char.abilityScores['СИЛ'] = 10; // mod 0, prof +2 -> +2 base
    const magicSword: EquippedItem = {
      id: 'sword-1',
      name: 'Длинный меч +1',
      slot: 'mainHand',
      effects: [{ id: 'e-atk', type: 'attackDamage', value: 1 }],
    };
    const equipped = equipItem(char, 'mainHand', magicSword);
    const attacks = getActiveCharacterAttacks(equipped);
    const swordAtk = attacks.find(a => a.weaponName === 'Длинный меч +1');
    assert.ok(swordAtk);
    assert.equal(swordAtk.attackBonus, '+3'); // 0 (str) + 2 (prof) + 1 (effect)
    assert.match(swordAtk.damageAndType, /\+1/);
  });
});
