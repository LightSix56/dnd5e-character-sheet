import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseBackgroundEquipment,
  mergeGearItems,
  GearItemModel,
  itemRegistry,
  createExplorersPack,
  createDungeoneersPack,
} from '../src/lib/inventory';
import { DND_COMPENDIUM_BACKGROUNDS } from '../src/data/compendium/backgrounds';
import { findClassById } from '../src/data/compendium/classes';

test('Background Equipment Parser: typical background equipment strings', () => {
  // 1. Аколит
  const acolyteBg = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'acolyte');
  assert.ok(acolyteBg);
  const acolyteItems = parseBackgroundEquipment(acolyteBg.equipment);
  assert.ok(acolyteItems.length >= 5, `Acolyte should have at least 5 items, got ${acolyteItems.length}`);

  const incense = acolyteItems.find(i => i.name.toLowerCase().includes('благовоний'));
  assert.ok(incense, 'Incense should be present');
  assert.equal(incense.quantity, 5, 'Incense quantity should be 5');
  assert.equal(incense.unit, 'шт.');

  const symbol = acolyteItems.find(i => i.name.toLowerCase().includes('священный символ'));
  assert.ok(symbol, 'Holy symbol should be present');
  assert.equal(symbol.quantity, 1);
  assert.equal(symbol.unit, 'шт.');

  // 2. Солдат (parentheses with commas inside must not be broken)
  const soldierBg = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'soldier');
  assert.ok(soldierBg);
  const soldierItems = parseBackgroundEquipment(soldierBg.equipment);
  assert.ok(soldierItems.length >= 4, `Soldier should have at least 4 items, got ${soldierItems.length}`);
  const trophy = soldierItems.find(i => i.name.toLowerCase().includes('трофей'));
  assert.ok(trophy, 'Trophy item should be preserved as a single item');
  assert.ok(trophy.name.includes('кинжал, сломанный клинок или кусок знамени'));

  // 3. Мудрец
  const sageBg = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'sage');
  assert.ok(sageBg);
  const sageItems = parseBackgroundEquipment(sageBg.equipment);
  assert.ok(sageItems.some(i => i.name.toLowerCase().includes('чернил')));
  assert.ok(sageItems.some(i => i.name.toLowerCase().includes('перо')));

  // 4. Бродяга (Urchin)
  const urchinBg = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'urchin');
  assert.ok(urchinBg);
  const urchinItems = parseBackgroundEquipment(urchinBg.equipment);
  assert.ok(urchinItems.some(i => i.name.toLowerCase().includes('ножик')));
  assert.ok(urchinItems.some(i => i.name.toLowerCase().includes('мышка')));
});

test('Background Equipment Parser: units and quantity extraction', () => {
  // 5 палочек благовоний -> quantity: 5, unit: 'шт.'
  const parsed1 = parseBackgroundEquipment('5 палочек благовоний');
  assert.equal(parsed1.length, 1);
  assert.equal(parsed1[0].name, 'Палочки благовоний');
  assert.equal(parsed1[0].quantity, 5);
  assert.equal(parsed1[0].unit, 'шт.');

  // рационы (10 дн.) -> quantity: 10, unit: 'дн.'
  const parsed2 = parseBackgroundEquipment('рационы (10 дн.)');
  assert.equal(parsed2.length, 1);
  assert.equal(parsed2[0].name, 'Рационы');
  assert.equal(parsed2[0].quantity, 10);
  assert.equal(parsed2[0].unit, 'дн.');

  // 10 дней рационов -> quantity: 10, unit: 'дн.'
  const parsed3 = parseBackgroundEquipment('10 дней рационов');
  assert.equal(parsed3.length, 1);
  assert.equal(parsed3[0].name, 'Рационы');
  assert.equal(parsed3[0].quantity, 10);
  assert.equal(parsed3[0].unit, 'дн.');

  // верёвка (50 фт.) -> name: 'Пеньковая верёвка', quantity: 50, unit: 'фт.'
  const parsed4 = parseBackgroundEquipment('верёвка (50 фт.)');
  assert.equal(parsed4.length, 1);
  assert.equal(parsed4[0].name, 'Пеньковая верёвка');
  assert.equal(parsed4[0].quantity, 50);
  assert.equal(parsed4[0].unit, 'фт.');

  // 50 футов пеньковой верёвки -> quantity: 50, unit: 'фт.'
  const parsed4b = parseBackgroundEquipment('50 футов пеньковой верёвки');
  assert.equal(parsed4b.length, 1);
  assert.equal(parsed4b[0].name, 'Пеньковая верёвка');
  assert.equal(parsed4b[0].quantity, 50);
  assert.equal(parsed4b[0].unit, 'фт.');

  // мешочек с 10 фнт. песка -> quantity: 10, unit: 'фнт.'
  const parsed5 = parseBackgroundEquipment('мешочек с 10 фнт. песка');
  assert.equal(parsed5.length, 1);
  assert.equal(parsed5[0].quantity, 10);
  assert.equal(parsed5[0].unit, 'фнт.');
  assert.ok(parsed5[0].name.toLowerCase().includes('песк') || parsed5[0].name.toLowerCase().includes('мешочек'));

  // Default item: 1 шт.
  const parsed6 = parseBackgroundEquipment('поясной кошель');
  assert.equal(parsed6.length, 1);
  assert.equal(parsed6[0].name, 'Поясной кошель');
  assert.equal(parsed6[0].quantity, 1);
  assert.equal(parsed6[0].unit, 'шт.');
});

test('Background Equipment Parser: pack detection and auto-unpacking', () => {
  // If string contains "набор путешественника"
  const items = parseBackgroundEquipment('набор путешественника, маленький нож');
  assert.ok(items.length >= 8, `Should contain at least 8 items from explorer pack + knife, got ${items.length}`);

  const backpack = items.find(i => i.name === 'Рюкзак');
  assert.ok(backpack, 'Backpack from explorer pack should be present');

  const bedroll = items.find(i => i.name === 'Спальник');
  assert.ok(bedroll, 'Bedroll should be present');

  const knife = items.find(i => i.name.toLowerCase().includes('нож'));
  assert.ok(knife, 'Additional knife should be present');
});

test('mergeGearItems: correctly aggregates duplicate items', () => {
  const existing = [
    new GearItemModel({ id: 'gear-rations', name: 'Рационы', quantity: 10, unit: 'дн.' }),
    new GearItemModel({ id: 'gear-torch', name: 'Факел', quantity: 10, unit: 'шт.' }),
  ];

  const incoming = [
    new GearItemModel({ id: 'gear-rations-2', name: 'рационы', quantity: 5, unit: 'дн.' }),
    new GearItemModel({ id: 'gear-rope', name: 'Пеньковая верёвка', quantity: 50, unit: 'фт.' }),
  ];

  const merged = mergeGearItems(existing, incoming);
  assert.equal(merged.length, 3, 'Should have 3 distinct item types');

  const rations = merged.find(i => i.name.toLowerCase() === 'рационы');
  assert.ok(rations);
  assert.equal(rations.quantity, 15, '10 + 5 rations = 15 rations');
  assert.equal(rations.unit, 'дн.');

  const torches = merged.find(i => i.name.toLowerCase() === 'факел');
  assert.ok(torches);
  assert.equal(torches.quantity, 10);

  const rope = merged.find(i => i.name.toLowerCase().includes('верёвка'));
  assert.ok(rope);
  assert.equal(rope.quantity, 50);

  // Items with different units should not merge even if name matches
  const sandPiece = new GearItemModel({ id: 'sand-1', name: 'Песок', quantity: 1, unit: 'шт.' });
  const sandPounds = new GearItemModel({ id: 'sand-2', name: 'Песок', quantity: 10, unit: 'фнт.' });
  const mergedSand = mergeGearItems([sandPiece], [sandPounds]);
  assert.equal(mergedSand.length, 2, 'Different units must not be merged');
});

test('ItemRegistry: supports both pack-xxx and xxx-pack IDs', () => {
  const byDashPack = itemRegistry.getPack('explorers-pack');
  const byPrefixPack = itemRegistry.getPack('pack-explorers');
  assert.ok(byDashPack, 'Should resolve by explorers-pack');
  assert.ok(byPrefixPack, 'Should resolve by pack-explorers');
  assert.equal(byDashPack.name, byPrefixPack.name);

  const dungeoneer = itemRegistry.getPack('dungeoneers-pack');
  assert.ok(dungeoneer);
  assert.equal(dungeoneer.name, 'Набор исследователя подземелий');

  const priest = itemRegistry.getPack('priests-pack');
  assert.ok(priest);
  assert.equal(priest.name, 'Набор священника');
});

test('Background Equipment: all compendium backgrounds produce non-empty inventoryGear', () => {
  for (const bg of DND_COMPENDIUM_BACKGROUNDS) {
    if (!bg.equipment) continue;
    const items = parseBackgroundEquipment(bg.equipment);
    assert.ok(
      items.length > 0,
      `Background "${bg.name}" (${bg.id}) equipment should produce at least 1 item, got 0`
    );
    for (const item of items) {
      assert.ok(item instanceof GearItemModel);
      assert.ok(item.name.length > 0, `Item name in background "${bg.name}" should not be empty`);
      assert.ok(item.quantity > 0, `Item "${item.name}" quantity should be > 0`);
      assert.ok(['шт.', 'фт.', 'дн.', 'фнт.'].includes(item.unit), `Valid unit for item "${item.name}"`);
    }
  }
});

test('Character Creation Equipment: combining class pack and background produces non-empty inventoryGear', () => {
  // Simulate Fighter with dungeoneers-pack and Soldier background
  const fighterClass = findClassById('fighter');
  assert.ok(fighterClass);
  const soldierBg = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'soldier');
  assert.ok(soldierBg);

  // Fighter picks dungeoneer pack
  const dungeoneersPack = itemRegistry.getPack('dungeoneers-pack');
  assert.ok(dungeoneersPack);
  const classGear = dungeoneersPack.unpack();

  // Background gear
  const bgGear = parseBackgroundEquipment(soldierBg.equipment);

  // Merged gear
  const mergedGear = mergeGearItems(classGear, bgGear);
  const inventoryGear = mergedGear.map(g => g.toJSON());

  assert.ok(inventoryGear.length > 0, 'Character inventoryGear must not be empty');
  assert.ok(inventoryGear.some(i => i.name.toLowerCase().includes('лом') || i.name.toLowerCase().includes('рюкзак')));
  assert.ok(inventoryGear.some(i => i.name.toLowerCase().includes('знак отличия')));

  for (const item of inventoryGear) {
    assert.ok(item.id, 'Every inventory gear item must have an id');
    assert.ok(item.name, 'Every inventory gear item must have a name');
    assert.ok(item.quantity > 0, 'Every inventory gear item quantity must be > 0');
    assert.ok(['шт.', 'фт.', 'дн.', 'фнт.'].includes(item.unit), `Valid unit for ${item.name}`);
  }
});

