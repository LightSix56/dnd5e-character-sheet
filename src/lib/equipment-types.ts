import type { CharacterData } from './dnd-types';

export type EquipmentSlotId =
  | 'head'
  | 'neck'
  | 'armor'
  | 'mainHand'
  | 'offHand'
  | 'belt'
  | 'ring1'
  | 'cloak'
  | 'quiver'
  | 'gloves'
  | 'ring2'
  | 'pouch'
  | 'boots';

export interface EquipmentSlotConfig {
  id: EquipmentSlotId;
  name: string;
  description: string;
  category: 'head' | 'neck' | 'armor' | 'hand' | 'belt' | 'ring' | 'cloak' | 'quiver' | 'gloves' | 'pouch' | 'boots';
  icon: string;
}

export const EQUIPMENT_SLOTS: EquipmentSlotConfig[] = [
  { id: 'head', name: 'Голова', description: 'Шлем, обруч, капюшон, шляпа', category: 'head', icon: '🪖' },
  { id: 'neck', name: 'Шея / Амулет', description: 'Медальон, ожерелье, талисман', category: 'neck', icon: '📿' },
  { id: 'armor', name: 'Доспех / Тело', description: 'Броня, кольчуга, роба, мантия', category: 'armor', icon: '🛡️' },
  { id: 'mainHand', name: 'Основная рука', description: '1-ручное или 2-ручное оружие / фокус', category: 'hand', icon: '⚔️' },
  { id: 'offHand', name: 'Вторая рука', description: 'Щит (+2 КД), 2-е оружие, факел', category: 'hand', icon: '🛡️' },
  { id: 'belt', name: 'Пояс', description: 'Ремень, кушак, перевязь', category: 'belt', icon: '🥋' },
  { id: 'ring1', name: 'Кольцо 1', description: 'Палец левой руки', category: 'ring', icon: '💍' },
  { id: 'cloak', name: 'Плечи / Плащ', description: 'Плащ, накидка, мантия защиты', category: 'cloak', icon: '🧥' },
  { id: 'quiver', name: 'Колчан / Спина', description: 'Колчан со стрелами / болтами', category: 'quiver', icon: '🏹' },
  { id: 'gloves', name: 'Руки / Перчатки', description: 'Перчатки, рукавицы огра, наручи', category: 'gloves', icon: '🧤' },
  { id: 'ring2', name: 'Кольцо 2', description: 'Палец правой руки', category: 'ring', icon: '💍' },
  { id: 'pouch', name: 'Поясной карман', description: 'Флаконы зелий, свитки, кошель', category: 'pouch', icon: '🧪' },
  { id: 'boots', name: 'Ноги / Сапоги', description: 'Сапоги скороходов, обувь', category: 'boots', icon: '🥾' },
];

export interface EquippedItem {
  id: string;
  name: string;
  slot: EquipmentSlotId;
  bonusAC?: number;
  bonusSpeed?: number;
  bonusAttack?: number;
  bonusDamage?: number;
  twoHanded?: boolean;
  isShield?: boolean;
  weight?: number;
  description?: string;
  rarity?: string;
}

export function isOffHandBlocked(char: CharacterData): boolean {
  const mainHand = char.equippedSlots?.mainHand;
  if (!mainHand) return false;
  return !!mainHand.twoHanded;
}

export function getOffHandBlockedReason(char: CharacterData): string | null {
  if (isOffHandBlocked(char)) {
    return 'Занято двуручным хватом';
  }
  return null;
}

export function equipItem(
  char: CharacterData,
  slot: EquipmentSlotId,
  item: EquippedItem
): CharacterData {
  const updatedSlots: Partial<Record<EquipmentSlotId, EquippedItem>> = {
    ...(char.equippedSlots || {}),
  };

  // If equipping a two-handed weapon in mainHand, offHand is automatically cleared
  if (slot === 'mainHand' && item.twoHanded) {
    delete updatedSlots.offHand;
  }

  // If equipping into offHand, check if mainHand was two-handed; if so, clear mainHand
  if (slot === 'offHand') {
    if (updatedSlots.mainHand?.twoHanded) {
      delete updatedSlots.mainHand;
    }
  }

  updatedSlots[slot] = item;

  const updated: CharacterData = {
    ...char,
    equippedSlots: updatedSlots,
  };

  // Synchronize legacy/sheet armor and shield fields
  if (slot === 'armor') {
    updated.equippedArmor = item.name;
    updated.armorClass = null; // Clear manual override so live AC calculation recalculates
  }
  if (slot === 'offHand') {
    updated.equippedShield = !!item.isShield;
    updated.armorClass = null;
  }

  // Ensure shield is disabled if off-hand is empty
  if (!updatedSlots.offHand) {
    updated.equippedShield = false;
  }

  return updated;
}

export function unequipItem(
  char: CharacterData,
  slot: EquipmentSlotId
): CharacterData {
  const updatedSlots: Partial<Record<EquipmentSlotId, EquippedItem>> = {
    ...(char.equippedSlots || {}),
  };
  delete updatedSlots[slot];

  const updated: CharacterData = {
    ...char,
    equippedSlots: updatedSlots,
  };

  if (slot === 'armor') {
    updated.equippedArmor = '';
    updated.armorClass = null;
  }
  if (slot === 'offHand') {
    updated.equippedShield = false;
    updated.armorClass = null;
  }

  return updated;
}

export function calculateEquipmentBonuses(char: CharacterData): { acBonus: number; speedBonus: number } {
  let acBonus = 0;
  let speedBonus = 0;

  if (!char.equippedSlots) return { acBonus, speedBonus };

  for (const [slotId, item] of Object.entries(char.equippedSlots)) {
    if (!item) continue;
    // Magic accessory bonus AC (rings, cloaks, bracers)
    if (slotId !== 'armor' && slotId !== 'offHand') {
      if (typeof item.bonusAC === 'number') {
        acBonus += item.bonusAC;
      }
    }
    if (typeof item.bonusSpeed === 'number') {
      speedBonus += item.bonusSpeed;
    }
  }

  return { acBonus, speedBonus };
}
