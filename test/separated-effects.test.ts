import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultCharacter,
  getSpellSaveDC,
  getSpellAttackBonus,
  getSpellDamageBonus,
} from '../src/lib/dnd-types.js';
import {
  EquippedItem,
  calculateEquipmentBonuses,
  equipItem,
  getActiveCharacterAttacks,
} from '../src/lib/equipment-types.js';

describe('Separated Weapon & Spell Effects Engine', () => {
  test('weapon attack bonus increases only attack roll, not damage', () => {
    const char = createDefaultCharacter();
    char.abilityScores['СИЛ'] = 10; // mod 0, level 1 => prof +2 -> base attack +2
    const preciseSword: EquippedItem = {
      id: 'sword-acc',
      name: 'Длинный меч точности',
      slot: 'mainHand',
      effects: [{ id: 'e-acc', type: 'attack', value: 2 }],
    };
    const equipped = equipItem(char, 'mainHand', preciseSword);
    const attacks = getActiveCharacterAttacks(equipped);
    const swordAtk = attacks.find(a => a.weaponName === 'Длинный меч точности');

    assert.ok(swordAtk);
    assert.equal(swordAtk.attackBonus, '+4'); // 0 (str) + 2 (prof) + 2 (item atk)
    assert.doesNotMatch(swordAtk.damageAndType, /\+2/); // no damage bonus!
  });

  test('weapon damage bonus increases only damage, not attack roll', () => {
    const char = createDefaultCharacter();
    char.abilityScores['СИЛ'] = 10; // mod 0, level 1 => prof +2 -> base attack +2
    const brutalSword: EquippedItem = {
      id: 'sword-dmg',
      name: 'Длинный меч свирепости',
      slot: 'mainHand',
      effects: [{ id: 'e-dmg', type: 'damage', value: 3 }],
    };
    const equipped = equipItem(char, 'mainHand', brutalSword);
    const attacks = getActiveCharacterAttacks(equipped);
    const swordAtk = attacks.find(a => a.weaponName === 'Длинный меч свирепости');

    assert.ok(swordAtk);
    assert.equal(swordAtk.attackBonus, '+2'); // 0 (str) + 2 (prof) + 0 (no atk bonus)
    assert.match(swordAtk.damageAndType, /\+3/); // damage bonus is +3
  });

  test('spell DC bonus increases only save DC, not spell attack bonus', () => {
    const char = createDefaultCharacter();
    char.level = 1; // prof +2
    char.spellcastingAbility = 'ИНТ';
    char.abilityScores['ИНТ'] = 16; // mod +3
    // base spell DC = 8 + 2 + 3 = 13
    // base spell attack = 2 + 3 = 5

    const wandOfDC: EquippedItem = {
      id: 'wand-dc',
      name: 'Жезл владыки тайн',
      slot: 'mainHand',
      effects: [{ id: 'e-dc', type: 'spellDC', value: 2 }],
    };
    const equipped = equipItem(char, 'mainHand', wandOfDC);

    assert.equal(getSpellSaveDC(equipped), 15); // 13 + 2
    assert.equal(getSpellAttackBonus(equipped), 5); // remains 5!
  });

  test('spell attack bonus increases only spell attack, not spell DC', () => {
    const char = createDefaultCharacter();
    char.level = 1; // prof +2
    char.spellcastingAbility = 'ИНТ';
    char.abilityScores['ИНТ'] = 16; // mod +3
    // base spell DC = 13
    // base spell attack = 5

    const orbOfAccuracy: EquippedItem = {
      id: 'orb-acc',
      name: 'Сфера меткости мага',
      slot: 'offHand',
      effects: [{ id: 'e-atk', type: 'spellAttack', value: 2 }],
    };
    const equipped = equipItem(char, 'offHand', orbOfAccuracy);

    assert.equal(getSpellSaveDC(equipped), 13); // remains 13!
    assert.equal(getSpellAttackBonus(equipped), 7); // 5 + 2
  });

  test('spell damage bonus calculates correctly in getSpellDamageBonus and bonuses summary', () => {
    const char = createDefaultCharacter();
    const ringOfFire: EquippedItem = {
      id: 'ring-fire',
      name: 'Кольцо пылающей магии',
      slot: 'ring1',
      effects: [{ id: 'e-fire', type: 'spellDamage', value: 3 }],
    };
    const equipped = equipItem(char, 'ring1', ringOfFire);

    assert.equal(getSpellDamageBonus(equipped), 3);
    const summary = calculateEquipmentBonuses(equipped);
    assert.equal(summary.spellDamageBonus, 3);
  });

  test('legacy attackDamage effect still boosts both weapon attack and damage', () => {
    const char = createDefaultCharacter();
    char.abilityScores['СИЛ'] = 10;
    const legacyItem: EquippedItem = {
      id: 'leg-1',
      name: 'Старый меч +1',
      slot: 'mainHand',
      effects: [{ id: 'e-leg', type: 'attackDamage', value: 1 }],
    };
    const equipped = equipItem(char, 'mainHand', legacyItem);
    const attacks = getActiveCharacterAttacks(equipped);
    const swordAtk = attacks.find(a => a.weaponName === 'Старый меч +1');

    assert.ok(swordAtk);
    assert.equal(swordAtk.attackBonus, '+3');
    assert.match(swordAtk.damageAndType, /\+1/);
  });
});
