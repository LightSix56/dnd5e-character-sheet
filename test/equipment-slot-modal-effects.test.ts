import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter } from '../src/lib/dnd-types.js';
import { equipItem, unequipItem, deleteCustomItem, EquippedItem, ItemEffect } from '../src/lib/equipment-types.js';

describe('Equipment Slot Modal Effects and Storage Contract', () => {
  test('creates custom item with dynamic effects array and equips to slot', () => {
    const char = createDefaultCharacter();

    const effects: ItemEffect[] = [
      { id: 'eff-1', type: 'ac', value: 1, description: '+1 к КД' },
      { id: 'eff-2', type: 'ability', targetAbility: 'int', value: 2, description: '+2 к Интеллекту' },
      { id: 'eff-3', type: 'customTrait', value: 'Телепатия', description: 'Связь на 30 фт.' },
    ];

    const helm: EquippedItem = {
      id: 'custom-helm-123',
      name: 'Шлем архимага',
      slot: 'head',
      rarity: 'Очень редкий',
      weight: 3,
      effects,
    };

    const equipped = equipItem(char, 'head', helm);
    assert.equal(equipped.equippedSlots?.head?.name, 'Шлем архимага');
    assert.equal(equipped.equippedSlots?.head?.effects?.length, 3);
    assert.ok(equipped.customItems?.some(i => i.id === 'custom-helm-123'));
  });

  test('saved custom items filter correctly per slot and survive unequipping', () => {
    const char = createDefaultCharacter();

    const cloak: EquippedItem = {
      id: 'custom-cloak-1',
      name: 'Эльфийский плащ',
      slot: 'cloak',
      effects: [{ id: 'e-1', type: 'ac', value: 1 }],
    };

    const ring: EquippedItem = {
      id: 'custom-ring-1',
      name: 'Кольцо регенерации',
      slot: 'ring1',
      effects: [{ id: 'e-2', type: 'hpMax', value: 10 }],
    };

    let updated = equipItem(char, 'cloak', cloak);
    updated = equipItem(updated, 'ring1', ring);

    assert.equal(updated.customItems?.length, 2);

    // Unequip cloak
    updated = unequipItem(updated, 'cloak');
    assert.equal(updated.equippedSlots?.cloak, undefined);

    // Saved cloak should still be in customItems with slot 'cloak'
    const cloakInStash = updated.customItems?.find(i => i.id === 'custom-cloak-1');
    assert.ok(cloakInStash);
    assert.equal(cloakInStash.slot, 'cloak');

    // Filter by slot
    const cloakCandidates = (updated.customItems || []).filter(i => i.slot === 'cloak');
    assert.equal(cloakCandidates.length, 1);
    assert.equal(cloakCandidates[0].name, 'Эльфийский плащ');

    // Delete custom ring
    updated = deleteCustomItem(updated, 'custom-ring-1');
    assert.equal(updated.customItems?.some(i => i.id === 'custom-ring-1'), false);
    assert.equal(updated.equippedSlots?.ring1, undefined);
  });
});
