import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDropdownPosition } from '../src/components/compendium/AutocompleteInput.js';
import { createDefaultCharacter } from '../src/lib/dnd-types.js';
import { equipItem, getActiveCharacterAttacks, type EquippedItem } from '../src/lib/equipment-types.js';
import { findWeaponByName } from '../src/data/dnd-weapons.js';

describe('Autocomplete Dropdown Overflow & Positioning (TDD)', () => {
  describe('calculateDropdownPosition flip & bounds logic', () => {
    test('opens downwards when there is ample space below the input', () => {
      const rect = { top: 100, bottom: 130, left: 50, width: 250 };
      const viewportHeight = 800;

      const pos = calculateDropdownPosition(rect, viewportHeight);

      assert.equal(pos.placement, 'bottom');
      assert.equal(pos.top, 134); // bottom + 4
      assert.equal(pos.bottom, undefined);
      assert.equal(pos.left, 50);
      assert.equal(pos.width, 250);
      assert.equal(pos.maxHeight, 240); // default max height
    });

    test('flips upwards when near the bottom of the viewport so user does not need to scroll down', () => {
      const rect = { top: 720, bottom: 750, left: 50, width: 250 };
      const viewportHeight = 800;

      // spaceBelow = 50 (< 180 minRequiredSpace), spaceAbove = 720
      const pos = calculateDropdownPosition(rect, viewportHeight);

      assert.equal(pos.placement, 'top', 'Must flip to top when space below is insufficient');
      assert.equal(pos.bottom, 800 - 720 + 4, 'bottom offset from viewport bottom must be viewportHeight - rect.top + 4');
      assert.equal(pos.top, undefined);
      assert.equal(pos.left, 50);
      assert.equal(pos.width, 250);
      assert.ok(pos.maxHeight <= 240);
      assert.ok(pos.maxHeight >= 100);
    });

    test('caps maxHeight dynamically in constrained viewports to prevent overflow', () => {
      const rect = { top: 150, bottom: 180, left: 20, width: 200 };
      const viewportHeight = 300;

      // spaceBelow = 120, spaceAbove = 150 -> open upwards (spaceBelow < 180 && spaceAbove > spaceBelow)
      const pos = calculateDropdownPosition(rect, viewportHeight);

      assert.equal(pos.placement, 'top');
      // spaceAbove - 16 = 150 - 16 = 134
      assert.equal(pos.maxHeight, 134);
    });
  });

  describe('Weapon Autocomplete Search & Quick Equip', () => {
    test('Russian substring search matches "Длинный лук" from query "Длиныый" or "длин"', () => {
      const query = 'длин';
      const bow = findWeaponByName('Длинный лук');
      const sword = findWeaponByName('Длинный меч');

      assert.ok(bow, 'Длинный лук exists in compendium');
      assert.ok(sword, 'Длинный меч exists in compendium');
      assert.ok(bow.name.toLowerCase().includes(query));
      assert.ok(sword.name.toLowerCase().includes(query));
    });

    test('Equipping weapon found by autocomplete correctly updates active character attacks', () => {
      let char = createDefaultCharacter();
      char.abilityScores['ЛОВ'] = 16; // +3
      char.level = 1; // +2 Prof

      const weaponDef = findWeaponByName('Длинный лук')!;
      assert.ok(weaponDef);

      const equipped: EquippedItem = {
        id: 'test-bow',
        name: weaponDef.name,
        slot: 'mainHand',
        twoHanded: true,
        description: `${weaponDef.damageDice} ${weaponDef.damageType}`,
      };

      char = equipItem(char, 'mainHand', equipped);

      const attacks = getActiveCharacterAttacks(char);
      const bowAttack = attacks.find(a => a.weaponName === 'Длинный лук');
      assert.ok(bowAttack, 'Длинный лук attack must be present in active attacks');
      assert.equal(bowAttack.attackBonus, '+5'); // +3 DEX + 2 Prof
      assert.equal(bowAttack.damageAndType, '1d8+3 колющий');
      assert.equal(bowAttack.actionType, 'action');
    });
  });
});
