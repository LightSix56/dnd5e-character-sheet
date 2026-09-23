import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultCharacter,
  normalizeCharacterData,
  type CharacterData,
} from '../src/lib/dnd-types';
import {
  BaseItem,
  GearItemModel,
  PotionItemModel,
  HealingPotion,
  BuffPotion,
  UtilityPotion,
  EquipmentPackModel,
  createExplorersPack,
  createDungeoneersPack,
  createPriestsPack,
  createScholarsPack,
  createDiplomatsPack,
  createEntertainersPack,
  createBurglarsPack,
  OFFICIAL_EQUIPMENT_PACKS,
  itemRegistry,
} from '../src/lib/inventory';
import '../src/data/compendium/potions-data';

test('Inventory OOP: Inheritance hierarchy and instanceof checks', () => {
  const potion = new HealingPotion({
    id: 'test-heal',
    name: 'Тестовое зелье лечения',
    formula: '2d4+2',
    effectSummary: 'Восстанавливает 2d4+2 хитов',
  });

  assert.ok(potion instanceof BaseItem, 'HealingPotion should be an instance of BaseItem');
  assert.ok(potion instanceof PotionItemModel, 'HealingPotion should be an instance of PotionItemModel');
  assert.ok(potion instanceof HealingPotion, 'HealingPotion should be an instance of HealingPotion');

  const buff = new BuffPotion({
    id: 'test-buff',
    name: 'Тестовое зелье усиления',
    effectSummary: 'Усиливает характеристики',
  });
  assert.ok(buff instanceof BaseItem);
  assert.ok(buff instanceof PotionItemModel);
  assert.ok(buff instanceof BuffPotion);

  const utility = new UtilityPotion({
    id: 'test-utility',
    name: 'Тестовое утилитарное зелье',
    effectSummary: 'Полезный эффект',
  });
  assert.ok(utility instanceof BaseItem);
  assert.ok(utility instanceof PotionItemModel);
  assert.ok(utility instanceof UtilityPotion);

  const gear = new GearItemModel({
    id: 'test-gear',
    name: 'Тестовый предмет',
    quantity: 5,
    unit: 'шт.',
  });
  assert.ok(gear instanceof BaseItem);
  assert.ok(gear instanceof GearItemModel);
  assert.equal(gear.quantity, 5);
  assert.equal(gear.unit, 'шт.');

  const pack = createExplorersPack();
  assert.ok(pack instanceof BaseItem);
  assert.ok(pack instanceof EquipmentPackModel);
});

test('Inventory OOP: HealingPotion rolls dice within exact mathematical bounds', () => {
  const char = createDefaultCharacter();

  const standardHealing = new HealingPotion({
    id: 'potion-healing',
    name: 'Зелье лечения',
    formula: '2d4+2',
    effectSummary: 'Восстанавливает 2d4+2 хитов',
  });

  for (let i = 0; i < 50; i++) {
    const res = standardHealing.use(char);
    assert.equal(res.success, true);
    assert.equal(res.potionName, 'Зелье лечения');
    assert.equal(res.actionCost, 'bonus_action');
    assert.ok(res.hpHealed !== undefined, 'hpHealed should be defined');
    assert.ok(res.hpHealed >= 4 && res.hpHealed <= 10, `2d4+2 must be between 4 and 10, got ${res.hpHealed}`);
    assert.match(res.message, /восстанавливаете \d+ хитов/);
  }

  // Greater Healing: 4d4+4 -> 8..20
  const greaterHealing = new HealingPotion({
    id: 'potion-greater-healing',
    name: 'Зелье большего лечения',
    formula: '4d4+4',
    effectSummary: 'Восстанавливает 4d4+4 хитов',
  });
  for (let i = 0; i < 20; i++) {
    const res = greaterHealing.use(char);
    assert.ok(res.hpHealed !== undefined);
    assert.ok(res.hpHealed >= 8 && res.hpHealed <= 20, `4d4+4 must be between 8 and 20, got ${res.hpHealed}`);
  }

  // Superior Healing: 8d4+8 -> 16..40
  const superiorHealing = new HealingPotion({
    id: 'potion-superior-healing',
    name: 'Зелье отличного лечения',
    formula: '8d4+8',
    effectSummary: 'Восстанавливает 8d4+8 хитов',
  });
  for (let i = 0; i < 20; i++) {
    const res = superiorHealing.use(char);
    assert.ok(res.hpHealed !== undefined);
    assert.ok(res.hpHealed >= 16 && res.hpHealed <= 40, `8d4+8 must be between 16 and 40, got ${res.hpHealed}`);
  }

  // Supreme Healing: 10d4+20 -> 30..60
  const supremeHealing = new HealingPotion({
    id: 'potion-supreme-healing',
    name: 'Зелье превосходного лечения',
    formula: '10d4+20',
    effectSummary: 'Восстанавливает 10d4+20 хитов',
  });
  for (let i = 0; i < 20; i++) {
    const res = supremeHealing.use(char);
    assert.ok(res.hpHealed !== undefined);
    assert.ok(res.hpHealed >= 30 && res.hpHealed <= 60, `10d4+20 must be between 30 and 60, got ${res.hpHealed}`);
  }
});

test('Inventory OOP: BuffPotion provides tempHp and buff effects', () => {
  const char = createDefaultCharacter();

  const heroismPotion = itemRegistry.getPotion('potion-heroism');
  assert.ok(heroismPotion, 'potion-heroism should be registered in itemRegistry');
  assert.ok(heroismPotion instanceof BuffPotion, 'Heroism potion should be BuffPotion');

  const res = heroismPotion.use(char);
  assert.equal(res.success, true);
  assert.equal(res.tempHp, 10, 'Potion of Heroism must grant 10 temporary HP');
  assert.ok(res.buffApplied?.includes('Героизм') || res.buffApplied?.includes('Благословение'));
  assert.match(res.message, /10 временных хитов/);
  assert.equal(res.actionCost, 'bonus_action');
});

test('Inventory OOP: Unpacking all 7 equipment packs returns valid cloned gear items', () => {
  const packs = [
    { factory: createExplorersPack, id: 'pack-explorers', count: 8 },
    { factory: createDungeoneersPack, id: 'pack-dungeoneers', count: 9 },
    { factory: createPriestsPack, id: 'pack-priests', count: 10 },
    { factory: createScholarsPack, id: 'pack-scholars', count: 7 },
    { factory: createDiplomatsPack, id: 'pack-diplomats', count: 11 },
    { factory: createEntertainersPack, id: 'pack-entertainers', count: 7 },
    { factory: createBurglarsPack, id: 'pack-burglars', count: 13 },
  ];

  for (const { factory, id, count } of packs) {
    const pack = factory();
    assert.equal(pack.id, id);
    assert.equal(pack.items.length, count, `Pack ${id} should contain ${count} items`);

    const unpacked = pack.unpack();
    assert.equal(unpacked.length, count);
    for (const item of unpacked) {
      assert.ok(item instanceof GearItemModel);
      assert.ok(item.quantity > 0, `Item ${item.name} quantity must be > 0`);
      assert.ok(['шт.', 'фт.', 'дн.', 'фнт.'].includes(item.unit), `Valid unit for ${item.name}`);
      assert.ok(item.name.length > 0);
    }

    // Verify unpacking creates independent clones
    unpacked[0].quantity += 99;
    assert.notEqual(unpacked[0].quantity, pack.items[0].quantity, 'Unpacked items must be decoupled clones');
  }

  // Check specific pack contents:
  const burglars = createBurglarsPack().unpack();
  const ballBearings = burglars.find(i => i.name.includes('шариками'));
  assert.ok(ballBearings);
  assert.equal(ballBearings.quantity, 1000);
  assert.equal(ballBearings.unit, 'шт.');

  const rope = burglars.find(i => i.name.includes('верёвка'));
  assert.ok(rope);
  assert.equal(rope.quantity, 50);
  assert.equal(rope.unit, 'фт.');

  const rations = burglars.find(i => i.name.includes('Рационы'));
  assert.ok(rations);
  assert.equal(rations.quantity, 5);
  assert.equal(rations.unit, 'дн.');
});

test('Inventory OOP: ItemRegistry singleton contains all compendium potions and packs', () => {
  const allPotions = itemRegistry.getAllPotions();
  assert.ok(allPotions.length >= 30, `Compendium must contain >= 30 potions, found ${allPotions.length}`);

  const allPacks = itemRegistry.getAllPacks();
  assert.equal(allPacks.length, 7, 'ItemRegistry must contain 7 standard packs');

  // Verify can instantiate clones with custom quantity
  const healingClone = itemRegistry.createPotionInstance('potion-healing', 3);
  assert.ok(healingClone);
  assert.equal(healingClone.quantity, 3);
  assert.equal(itemRegistry.getPotion('potion-healing')?.quantity, 1, 'Registry template must not be mutated');

  // Verify 1-line registration of new items without hardcode
  const customPotion = new BuffPotion({
    id: 'potion-custom-alchemical',
    name: 'Алхимический эликсир ярости',
    effectSummary: 'Дает ярость на 1 минуту',
    buffApplied: 'Ярость',
  });
  itemRegistry.registerPotion(customPotion);
  assert.equal(itemRegistry.getPotion('potion-custom-alchemical')?.name, 'Алхимический эликсир ярости');
});

test('Inventory OOP: Polymorphic execution of all registered potions', () => {
  const char = createDefaultCharacter();
  const allPotions = itemRegistry.getAllPotions();

  for (const potion of allPotions) {
    const result = potion.use(char);
    assert.equal(result.success, true);
    assert.equal(result.potionName, potion.name);
    assert.equal(result.actionCost, 'bonus_action');
    assert.ok(typeof result.message === 'string' && result.message.length > 0);

    const json = potion.toJSON();
    assert.equal(json.id, potion.id);
    assert.equal(json.name, potion.name);
    assert.equal(json.type, potion.potionType);
  }
});

test('CharacterData & normalizeCharacterData: supports potions and inventoryGear', () => {
  const defaultChar = createDefaultCharacter();
  assert.deepEqual(defaultChar.potions, []);
  assert.deepEqual(defaultChar.inventoryGear, []);

  // Normalizing empty object should populate potions and inventoryGear as empty arrays
  const normalizedEmpty = normalizeCharacterData({});
  assert.deepEqual(normalizedEmpty.potions, []);
  assert.deepEqual(normalizedEmpty.inventoryGear, []);

  // Normalizing object with existing potions and gear preserves them
  const rawWithItems: Partial<CharacterData> = {
    name: 'Гэндальф',
    potions: [
      {
        id: 'potion-healing',
        name: 'Зелье лечения',
        type: 'heal',
        rarity: 'обычное',
        quantity: 2,
        formula: '2d4+2',
        effectSummary: 'Восстанавливает 2d4+2',
        description: 'Лечебное зелье',
        actionCost: 'bonus_action',
      },
    ],
    inventoryGear: [
      {
        id: 'gear-torch',
        name: 'Факел',
        quantity: 10,
        unit: 'шт.',
      },
    ],
  };

  const normalized = normalizeCharacterData(rawWithItems);
  assert.equal(normalized.name, 'Гэндальф');
  assert.equal(normalized.potions?.length, 1);
  assert.equal(normalized.potions?.[0].quantity, 2);
  assert.equal(normalized.inventoryGear?.length, 1);
  assert.equal(normalized.inventoryGear?.[0].quantity, 10);
});
