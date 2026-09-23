import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createDefaultCharacter,
  type CharacterData,
  type PotionItem,
  type GearItem,
} from '../src/lib/dnd-types';
import {
  itemRegistry,
  mergeGearItems,
  GearItemModel,
  HealingPotion,
  BuffPotion,
  UtilityPotion,
  PotionItemModel,
} from '../src/lib/inventory';
import '../src/data/compendium/potions-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper pure functions representing the Inventory Manager engine logic
export function handlePotionQuantityChange(
  potions: PotionItem[],
  potionId: string,
  delta: number
): PotionItem[] {
  return potions
    .map(p => {
      if (p.id !== potionId) return p;
      return { ...p, quantity: p.quantity + delta };
    })
    .filter(p => p.quantity > 0);
}

export function handleDrinkPotionAction(
  char: CharacterData,
  potionId: string
): {
  updatedPotions: PotionItem[];
  hpCurrent: number;
  hpTemp: number;
  message: string;
} {
  const currentPotions = char.potions || [];
  const targetPotion = currentPotions.find(p => p.id === potionId);
  if (!targetPotion || targetPotion.quantity <= 0) {
    return {
      updatedPotions: currentPotions,
      hpCurrent: char.hpCurrent,
      hpTemp: char.hpTemp,
      message: 'Зелье не найдено.',
    };
  }

  // Deduct quantity (remove if 0)
  const updatedPotions = currentPotions
    .map(p => (p.id === potionId ? { ...p, quantity: p.quantity - 1 } : p))
    .filter(p => p.quantity > 0);

  // Polymorphic use
  const registered = itemRegistry.getPotion(potionId);
  let useResult;
  if (registered) {
    useResult = registered.use(char);
  } else if (targetPotion.type === 'heal' || targetPotion.formula) {
    const healModel = new HealingPotion({
      id: targetPotion.id,
      name: targetPotion.name,
      nameEn: targetPotion.nameEn,
      formula: targetPotion.formula,
      effectSummary: targetPotion.effectSummary,
    });
    useResult = healModel.use(char);
  } else if (targetPotion.type === 'buff') {
    const buffModel = new BuffPotion({
      id: targetPotion.id,
      name: targetPotion.name,
      nameEn: targetPotion.nameEn,
      buffApplied: targetPotion.effectSummary,
      effectSummary: targetPotion.effectSummary,
    });
    useResult = buffModel.use(char);
  } else {
    const utilModel = new UtilityPotion({
      id: targetPotion.id,
      name: targetPotion.name,
      nameEn: targetPotion.nameEn,
      utilityEffect: targetPotion.effectSummary,
      effectSummary: targetPotion.effectSummary,
    });
    useResult = utilModel.use(char);
  }

  let hpCurrent = char.hpCurrent;
  if (useResult.hpHealed && useResult.hpHealed > 0) {
    const maxHp = char.hpMax ?? 999;
    hpCurrent = Math.min(maxHp, char.hpCurrent + useResult.hpHealed);
  }

  let hpTemp = char.hpTemp;
  if (useResult.tempHp && useResult.tempHp > 0) {
    hpTemp = Math.max(char.hpTemp, useResult.tempHp);
  }

  return {
    updatedPotions,
    hpCurrent,
    hpTemp,
    message: useResult.message,
  };
}

export function handleAddPotionAction(
  potions: PotionItem[],
  newPotion: PotionItem
): PotionItem[] {
  const existing = potions.find(p => p.id === newPotion.id || p.name.toLowerCase() === newPotion.name.toLowerCase());
  if (existing) {
    return potions.map(p =>
      p === existing ? { ...p, quantity: p.quantity + (newPotion.quantity || 1) } : p
    );
  }
  return [...potions, { ...newPotion, quantity: newPotion.quantity || 1 }];
}

export function handleUnpackPackAction(
  currentGear: GearItem[],
  packId: string
): { updatedGear: GearItem[]; packName: string; addedCount: number } {
  const pack = itemRegistry.getPack(packId);
  if (!pack) {
    throw new Error(`Pack not found: ${packId}`);
  }

  const existingModels = currentGear.map(
    g => new GearItemModel({ id: g.id, name: g.name, quantity: g.quantity, unit: g.unit })
  );
  const unpacked = pack.unpack();
  const merged = mergeGearItems(existingModels, unpacked);

  return {
    updatedGear: merged.map(m => m.toJSON()),
    packName: pack.name,
    addedCount: unpacked.length,
  };
}

export function handleAddGearItemAction(
  currentGear: GearItem[],
  item: { name: string; quantity: number; unit: 'шт.' | 'фт.' | 'дн.' | 'фнт.' }
): GearItem[] {
  const trimmedName = item.name.trim();
  const existing = currentGear.find(
    g => g.name.toLowerCase() === trimmedName.toLowerCase() && g.unit === item.unit
  );

  if (existing) {
    return currentGear.map(g =>
      g === existing ? { ...g, quantity: g.quantity + item.quantity } : g
    );
  }

  const newItem: GearItem = {
    id: `gear-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmedName,
    quantity: item.quantity,
    unit: item.unit,
  };
  return [...currentGear, newItem];
}

export function handleUpdateGearQuantityAction(
  currentGear: GearItem[],
  itemId: string,
  delta: number
): GearItem[] {
  return currentGear
    .map(g => (g.id === itemId ? { ...g, quantity: g.quantity + delta } : g))
    .filter(g => g.quantity > 0);
}

export function handleRemoveGearItemAction(
  currentGear: GearItem[],
  itemId: string
): GearItem[] {
  return currentGear.filter(g => g.id !== itemId);
}

describe('InventoryManager & Interactive Inventory UI (TDD)', () => {
  describe('1. Potion Quantity Management (+/-)', () => {
    it('increases potion quantity when delta is +1', () => {
      const initialPotions: PotionItem[] = [
        {
          id: 'potion-healing',
          name: 'Зелье лечения',
          type: 'heal',
          rarity: 'обычное',
          quantity: 2,
          formula: '2d4+2',
          effectSummary: 'Восстанавливает 2d4+2 хитов',
          description: 'Лечебное зелье',
          actionCost: 'bonus_action',
        },
      ];

      const updated = handlePotionQuantityChange(initialPotions, 'potion-healing', 1);
      assert.equal(updated.length, 1);
      assert.equal(updated[0].quantity, 3);
    });

    it('decreases potion quantity when delta is -1 and quantity > 1', () => {
      const initialPotions: PotionItem[] = [
        {
          id: 'potion-healing',
          name: 'Зелье лечения',
          type: 'heal',
          rarity: 'обычное',
          quantity: 2,
          formula: '2d4+2',
          effectSummary: 'Восстанавливает 2d4+2 хитов',
          description: 'Лечебное зелье',
          actionCost: 'bonus_action',
        },
      ];

      const updated = handlePotionQuantityChange(initialPotions, 'potion-healing', -1);
      assert.equal(updated.length, 1);
      assert.equal(updated[0].quantity, 1);
    });

    it('removes potion from list when quantity reaches 0', () => {
      const initialPotions: PotionItem[] = [
        {
          id: 'potion-healing',
          name: 'Зелье лечения',
          type: 'heal',
          rarity: 'обычное',
          quantity: 1,
          formula: '2d4+2',
          effectSummary: 'Восстанавливает 2d4+2 хитов',
          description: 'Лечебное зелье',
          actionCost: 'bonus_action',
        },
      ];

      const updated = handlePotionQuantityChange(initialPotions, 'potion-healing', -1);
      assert.equal(updated.length, 0);
    });
  });

  describe('2. Drinking Potions Logic & HP Updates', () => {
    it('drinks healing potion: decrements quantity, heals HP up to hpMax', () => {
      const char = createDefaultCharacter();
      char.hpMax = 20;
      char.hpCurrent = 10;
      char.potions = [
        {
          id: 'potion-healing',
          name: 'Зелье лечения',
          type: 'heal',
          rarity: 'обычное',
          quantity: 2,
          formula: '2d4+2',
          effectSummary: 'Восстанавливает 2d4+2 хитов',
          description: 'Лечебное зелье',
          actionCost: 'bonus_action',
        },
      ];

      const { updatedPotions, hpCurrent, message } = handleDrinkPotionAction(char, 'potion-healing');

      assert.equal(updatedPotions.length, 1);
      assert.equal(updatedPotions[0].quantity, 1);
      // 2d4+2 yields between 4 and 10 HP
      assert.ok(hpCurrent >= 14 && hpCurrent <= 20, `HP should be between 14 and 20, got: ${hpCurrent}`);
      assert.ok(message.includes('хитов'), `Message should mention healed hit points: ${message}`);
    });

    it('caps healing at hpMax when healed amount exceeds maximum hit points', () => {
      const char = createDefaultCharacter();
      char.hpMax = 20;
      char.hpCurrent = 19;
      char.potions = [
        {
          id: 'potion-healing',
          name: 'Зелье лечения',
          type: 'heal',
          rarity: 'обычное',
          quantity: 1,
          formula: '2d4+2',
          effectSummary: 'Восстанавливает 2d4+2 хитов',
          description: 'Лечебное зелье',
          actionCost: 'bonus_action',
        },
      ];

      const { updatedPotions, hpCurrent } = handleDrinkPotionAction(char, 'potion-healing');

      assert.equal(updatedPotions.length, 0, 'Last potion should be removed on consumption');
      assert.equal(hpCurrent, 20, 'HP must be capped strictly at hpMax (20)');
    });

    it('handles buff potion with temporary HP', () => {
      const char = createDefaultCharacter();
      char.hpCurrent = 15;
      char.hpMax = 20;
      char.hpTemp = 0;
      char.potions = [
        {
          id: 'potion-heroism',
          name: 'Зелье героизма',
          type: 'buff',
          rarity: 'редкое',
          quantity: 1,
          effectSummary: 'Дает 10 временных хитов и эффект заклинания Благословение на 1 час',
          description: 'Зелье героизма',
          actionCost: 'bonus_action',
        },
      ];

      const { updatedPotions, hpTemp, message } = handleDrinkPotionAction(char, 'potion-heroism');

      assert.equal(updatedPotions.length, 0);
      assert.equal(hpTemp, 10, 'Should gain 10 temp HP from registered Potion of Heroism');
      assert.ok(message.includes('временных хитов'), 'Message should mention temp HP');
    });
  });

  describe('3. Adding Potions from Compendium & Custom', () => {
    it('adds new potion from compendium if not present', () => {
      const initialPotions: PotionItem[] = [];
      const potionToAdd: PotionItem = {
        id: 'potion-speed',
        name: 'Зелье скорости',
        nameEn: 'Potion of Speed',
        type: 'buff',
        rarity: 'очень редкое',
        quantity: 1,
        effectSummary: 'Эффект заклинания Ускорение на 1 мин.',
        description: 'Жёлтая жидкость с прожинками',
        actionCost: 'bonus_action',
      };

      const updated = handleAddPotionAction(initialPotions, potionToAdd);
      assert.equal(updated.length, 1);
      assert.equal(updated[0].name, 'Зелье скорости');
      assert.equal(updated[0].quantity, 1);
    });

    it('stacks quantity when adding a potion already present in inventory', () => {
      const initialPotions: PotionItem[] = [
        {
          id: 'potion-speed',
          name: 'Зелье скорости',
          nameEn: 'Potion of Speed',
          type: 'buff',
          rarity: 'очень редкое',
          quantity: 1,
          effectSummary: 'Эффект заклинания Ускорение на 1 мин.',
          description: 'Жёлтая жидкость с прожинками',
          actionCost: 'bonus_action',
        },
      ];

      const potionToAdd: PotionItem = {
        id: 'potion-speed',
        name: 'Зелье скорости',
        type: 'buff',
        rarity: 'очень редкое',
        quantity: 2,
        effectSummary: 'Эффект заклинания Ускорение на 1 мин.',
        description: 'Жёлтая жидкость с прожинками',
        actionCost: 'bonus_action',
      };

      const updated = handleAddPotionAction(initialPotions, potionToAdd);
      assert.equal(updated.length, 1);
      assert.equal(updated[0].quantity, 3);
    });
  });

  describe('4. Unpacking Official Equipment Packs', () => {
    it('unpacks explorers pack into gear items correctly', () => {
      const initialGear: GearItem[] = [];
      const { updatedGear, packName, addedCount } = handleUnpackPackAction(initialGear, 'pack-explorers');

      assert.equal(packName, 'Набор путешественника');
      assert.ok(addedCount >= 7, 'Explorers pack should contain at least 7 items');
      const rations = updatedGear.find(g => g.name.toLowerCase().includes('рацион'));
      assert.ok(rations, 'Should contain rations');
      assert.equal(rations?.quantity, 10);
      assert.equal(rations?.unit, 'дн.');
    });

    it('merges quantities when pack items already exist in gear', () => {
      const initialGear: GearItem[] = [
        {
          id: 'existing-rations',
          name: 'Рационы',
          quantity: 5,
          unit: 'дн.',
        },
      ];

      const { updatedGear } = handleUnpackPackAction(initialGear, 'pack-explorers');
      const rations = updatedGear.find(g => g.name.toLowerCase() === 'рационы');
      assert.ok(rations);
      // 5 existing + 10 from pack = 15
      assert.equal(rations?.quantity, 15);
    });

    it('supports all 7 official packs in ItemRegistry', () => {
      const packIds = [
        'pack-explorers',
        'pack-dungeoneers',
        'pack-priests',
        'pack-scholars',
        'pack-diplomats',
        'pack-entertainers',
        'pack-burglars',
      ];

      for (const id of packIds) {
        const { updatedGear, packName } = handleUnpackPackAction([], id);
        assert.ok(packName.length > 0, `Pack ${id} must have a valid name`);
        assert.ok(updatedGear.length > 0, `Pack ${id} must unpack items`);
      }
    });
  });

  describe('5. Adding and Removing Gear Items', () => {
    it('adds a new custom gear item', () => {
      const initialGear: GearItem[] = [];
      const updated = handleAddGearItemAction(initialGear, {
        name: 'Трутница',
        quantity: 1,
        unit: 'шт.',
      });

      assert.equal(updated.length, 1);
      assert.equal(updated[0].name, 'Трутница');
      assert.equal(updated[0].quantity, 1);
      assert.equal(updated[0].unit, 'шт.');
    });

    it('stacks quantity when adding gear with same name and unit', () => {
      const initialGear: GearItem[] = [
        { id: 'g1', name: 'Факел', quantity: 3, unit: 'шт.' },
      ];
      const updated = handleAddGearItemAction(initialGear, {
        name: 'Факел',
        quantity: 5,
        unit: 'шт.',
      });

      assert.equal(updated.length, 1);
      assert.equal(updated[0].quantity, 8);
    });

    it('updates gear quantity (+1/-1) and removes on zero', () => {
      let gear: GearItem[] = [{ id: 'g1', name: 'Свечи', quantity: 2, unit: 'шт.' }];

      gear = handleUpdateGearQuantityAction(gear, 'g1', 1);
      assert.equal(gear[0].quantity, 3);

      gear = handleUpdateGearQuantityAction(gear, 'g1', -1);
      assert.equal(gear[0].quantity, 2);

      gear = handleUpdateGearQuantityAction(gear, 'g1', -2);
      assert.equal(gear.length, 0);
    });

    it('removes gear item by id', () => {
      const gear: GearItem[] = [
        { id: 'g1', name: 'Лом', quantity: 1, unit: 'шт.' },
        { id: 'g2', name: 'Молоток', quantity: 1, unit: 'шт.' },
      ];

      const updated = handleRemoveGearItemAction(gear, 'g1');
      assert.equal(updated.length, 1);
      assert.equal(updated[0].id, 'g2');
    });
  });

  describe('6. Codebase Architecture & File Verification', () => {
    it('verifies InventoryManager.tsx exists and adheres to parchment design system', () => {
      const compPath = path.resolve(rootDir, 'src/components/sheet/InventoryManager.tsx');
      assert.ok(fs.existsSync(compPath), 'src/components/sheet/InventoryManager.tsx must exist');

      const code = fs.readFileSync(compPath, 'utf8');
      assert.match(code, /export\s+(function|const)\s+InventoryManager/, 'Must export InventoryManager');
      assert.match(code, /parchment-btn/, 'Must use parchment-btn');
      assert.match(code, /parchment-remove-btn/, 'Must use parchment-remove-btn');
      assert.match(code, /itemRegistry/, 'Must use itemRegistry');
      assert.match(code, /mergeGearItems/, 'Must use mergeGearItems');
    });

    it('verifies MainSheetPage.tsx integrates InventoryManager in tour-equipment', () => {
      const mainSheetPath = path.resolve(rootDir, 'src/components/sheet/pages/MainSheetPage.tsx');
      assert.ok(fs.existsSync(mainSheetPath), 'MainSheetPage.tsx must exist');

      const code = fs.readFileSync(mainSheetPath, 'utf8');
      assert.match(code, /<InventoryManager\s+char=\{char\}\s+update=\{update\}\s*\/>/, 'MainSheetPage must render InventoryManager with char and update');
      assert.match(code, /setShowEquipmentModal\(true\)/, 'MainSheetPage must retain interactive paper doll button');
    });
  });
});
