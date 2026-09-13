import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter } from '../src/lib/dnd-types.js';
import {
  EquippedItem,
  calculateEquipmentBonuses,
  equipItem,
  unequipItem,
  deleteCustomItem,
} from '../src/lib/equipment-types.js';

describe('Custom Items and Dynamic Effects Engine', () => {
  test('calculates multiple positive and negative effects on equipped items', () => {
    const char = createDefaultCharacter();
    const cursedHelm: EquippedItem = {
      id: 'helm-1',
      name: 'Проклятый шлем мудрости',
      slot: 'head',
      effects: [
        { id: 'e-1', type: 'ac', value: 1, description: '+1 к КД' },
        { id: 'e-2', type: 'speed', value: -5, description: '-5 фт. к скорости' },
        { id: 'e-3', type: 'hpMax', value: 10, description: '+10 макс. ХП' },
        { id: 'e-4', type: 'ability', targetAbility: 'wis', value: 2, description: '+2 к Мудрости' },
        { id: 'e-5', type: 'customTrait', value: 'Шёпот духов', description: 'Слышит мысли нежити' },
      ],
    };

    const equippedChar = equipItem(char, 'head', cursedHelm);
    const bonuses = calculateEquipmentBonuses(equippedChar);

    assert.equal(bonuses.acBonus, 1);
    assert.equal(bonuses.speedBonus, -5);
    assert.equal(bonuses.hpMaxBonus, 10);
    assert.equal(bonuses.abilityBonuses.wis, 2);
    assert.equal(bonuses.abilityBonuses.str, 0);
    assert.equal(bonuses.itemTraits.length, 1);
    assert.equal(bonuses.itemTraits[0].name, 'Шёпот духов');
    assert.match(bonuses.itemTraits[0].source || '', /Проклятый шлем мудрости/);
  });

  test('preserves custom item in char.customItems when unequipped', () => {
    const char = createDefaultCharacter();
    const ring: EquippedItem = {
      id: 'ring-shield-1',
      name: 'Кольцо защиты',
      slot: 'ring1',
      effects: [{ id: 'e-ring-1', type: 'ac', value: 1 }],
    };

    const equippedChar = equipItem(char, 'ring1', ring);
    assert.ok(equippedChar.equippedSlots?.ring1);
    assert.ok(equippedChar.customItems?.some(i => i.id === 'ring-shield-1'));

    const unequippedChar = unequipItem(equippedChar, 'ring1');
    assert.equal(unequippedChar.equippedSlots?.ring1, undefined);
    assert.ok(unequippedChar.customItems?.some(i => i.id === 'ring-shield-1'), 'item must stay in customItems');

    const bonuses = calculateEquipmentBonuses(unequippedChar);
    assert.equal(bonuses.acBonus, 0);
  });

  test('deleting a custom item removes it from customItems and equippedSlots if worn', () => {
    const char = createDefaultCharacter();
    const boots: EquippedItem = {
      id: 'boots-speed-1',
      name: 'Сапоги скороходы',
      slot: 'boots',
      effects: [{ id: 'e-boots-1', type: 'speed', value: 10 }],
    };

    const equippedChar = equipItem(char, 'boots', boots);
    const cleanedChar = deleteCustomItem(equippedChar, 'boots-speed-1');

    assert.equal(cleanedChar.customItems?.some(i => i.id === 'boots-speed-1'), false);
    assert.equal(cleanedChar.equippedSlots?.boots, undefined);
    const bonuses = calculateEquipmentBonuses(cleanedChar);
    assert.equal(bonuses.speedBonus, 0);
  });

  test('backward compatibility with legacy bonusAC and bonusSpeed on compendium items', () => {
    const char = createDefaultCharacter();
    const cloak: EquippedItem = {
      id: 'cloak-elven',
      name: 'Плащ защиты',
      slot: 'cloak',
      bonusAC: 1,
      bonusSpeed: 5,
    };
    const equippedChar = equipItem(char, 'cloak', cloak);
    const bonuses = calculateEquipmentBonuses(equippedChar);
    assert.equal(bonuses.acBonus, 1);
    assert.equal(bonuses.speedBonus, 5);
  });
});
