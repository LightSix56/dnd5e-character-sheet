import type { CharacterData, AbilityName } from './dnd-types';
import { calcModifier, calcProficiencyBonus, formatModifier, getTotalScore } from './dnd-types';
import { findWeaponByName, DND_WEAPONS, type DndWeapon } from '../data/dnd-weapons';

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

export interface ActiveAttackOption {
  source: 'mainHand' | 'offHand' | 'dual' | 'thrown' | 'unarmed';
  weaponName: string;
  attackBonus: string;
  damageAndType: string;
  actionType: 'action' | 'bonus' | 'dualAction';
  dualDetails?: {
    mainWeapon?: string;
    offWeapon?: string;
    mainAtkBonus?: string;
    offAtkBonus?: string;
    mainDmg: string;
    offDmg: string;
  };
  weaponDef?: DndWeapon;
  notes?: string;
}

export function hasTwoWeaponFightingStyle(char: CharacterData): boolean {
  const queryRu = 'сражение двумя оружиями';
  const queryEn = 'two-weapon fighting';
  const queryDual = 'парным оружием';

  if (char.featuresTraits) {
    const lower = char.featuresTraits.toLowerCase();
    if (lower.includes(queryRu) || lower.includes(queryEn) || lower.includes(queryDual)) {
      return true;
    }
  }

  if (char.traitsList) {
    for (const t of char.traitsList) {
      const tName = (t.name || '').toLowerCase();
      const tDesc = (t.description || '').toLowerCase();
      const tSumm = (t.summary || '').toLowerCase();
      if (
        tName.includes(queryRu) || tName.includes(queryEn) || tName.includes(queryDual) ||
        tDesc.includes(queryRu) || tDesc.includes(queryEn) || tDesc.includes(queryDual) ||
        tSumm.includes(queryRu) || tSumm.includes(queryEn) || tSumm.includes(queryDual)
      ) {
        return true;
      }
    }
  }

  if (char.levelHistory) {
    for (const h of char.levelHistory) {
      if (
        h.selectedFightingStyle &&
        (h.selectedFightingStyle.toLowerCase().includes('two_weapon') ||
          h.selectedFightingStyle.toLowerCase().includes('двумя'))
      ) {
        return true;
      }
    }
  }

  return false;
}

function getWeaponStats(
  char: CharacterData,
  weaponDef: DndWeapon | undefined,
  itemBonusAtk = 0,
  itemBonusDmg = 0
) {
  const strScore = getTotalScore(char, 'СИЛ');
  const dexScore = getTotalScore(char, 'ЛОВ');
  const strMod = calcModifier(strScore);
  const dexMod = calcModifier(dexScore);

  let usedMod = strMod;
  if (weaponDef) {
    const isRanged = weaponDef.category.includes('дальнобойное');
    if (isRanged && !weaponDef.finesse) {
      usedMod = dexMod;
    } else if (weaponDef.finesse) {
      usedMod = Math.max(strMod, dexMod);
    }
  }

  const profBonus = calcProficiencyBonus(char.level || 1);
  const atkBonusNum = profBonus + usedMod + itemBonusAtk;
  const atkBonusStr = formatModifier(atkBonusNum);

  const dice = weaponDef?.damageDice || '1d6';
  const type = weaponDef?.damageType || 'дробящий';

  // Full damage with ability modifier
  const fullDmgMod = usedMod + itemBonusDmg;
  let fullDmgStr = '';
  if (fullDmgMod > 0) {
    fullDmgStr = `${dice}+${fullDmgMod} ${type}`;
  } else if (fullDmgMod < 0) {
    fullDmgStr = `${dice}${fullDmgMod} ${type}`;
  } else {
    fullDmgStr = `${dice} ${type}`;
  }

  // Off-hand damage: negative ability modifier is subtracted, but positive is excluded unless fighting style applies
  const offDmgMod = (usedMod < 0 ? usedMod : 0) + itemBonusDmg;
  let offDmgStr = '';
  if (offDmgMod > 0) {
    offDmgStr = `${dice}+${offDmgMod} ${type}`;
  } else if (offDmgMod < 0) {
    offDmgStr = `${dice}${offDmgMod} ${type}`;
  } else {
    offDmgStr = `${dice} ${type}`;
  }

  return {
    usedMod,
    atkBonusStr,
    fullDmgStr,
    offDmgStr,
    dice,
    type,
  };
}

const KNOWN_THROWN_CONFIGS = [
  { name: 'Метательное копьё', test: (s: string) => /метательн.*копь|копь.*метательн/i.test(s) },
  { name: 'Лёгкий молот', test: (s: string) => /л[её]гк.*молот|молот.*л[её]гк/i.test(s) },
  { name: 'Ручной топор', test: (s: string) => /ручн.*топор|топор.*ручн/i.test(s) },
  { name: 'Кинжал', test: (s: string) => /кинжал/i.test(s) },
  { name: 'Дротик', test: (s: string) => /дротик/i.test(s) },
  { name: 'Копьё', test: (s: string) => /(^|[^\wа-яё])копь[её]/i.test(s) },
  { name: 'Трезубец', test: (s: string) => /трезубец/i.test(s) },
  { name: 'Сеть', test: (s: string) => /(^|[^\wа-яё])сеть([^\wа-яё]|$)/i.test(s) },
];

export function getActiveCharacterAttacks(char: CharacterData): ActiveAttackOption[] {
  const attacks: ActiveAttackOption[] = [];
  const equipped = char.equippedSlots || {};

  const mainHandItem = equipped.mainHand;
  const offHandItem = equipped.offHand;

  const isDualWield = Boolean(mainHandItem && offHandItem && !offHandItem.isShield);

  if (isDualWield && mainHandItem && offHandItem) {
    const mainDef = findWeaponByName(mainHandItem.name);
    const offDef = findWeaponByName(offHandItem.name);

    const mainStats = getWeaponStats(char, mainDef, mainHandItem.bonusAttack, mainHandItem.bonusDamage);
    const offStats = getWeaponStats(char, offDef, offHandItem.bonusAttack, offHandItem.bonusDamage);

    const hasStyle = hasTwoWeaponFightingStyle(char);

    // 1. Main Hand Attack (Action)
    const mainAtk: ActiveAttackOption = {
      source: 'mainHand',
      weaponName: mainHandItem.name,
      attackBonus: mainStats.atkBonusStr,
      damageAndType: mainStats.fullDmgStr,
      actionType: 'action',
      weaponDef: mainDef,
    };
    attacks.push(mainAtk);

    // 2. Off-Hand Attack (Bonus Action)
    const offAtk: ActiveAttackOption = {
      source: 'offHand',
      weaponName: offHandItem.name,
      attackBonus: offStats.atkBonusStr,
      damageAndType: hasStyle ? offStats.fullDmgStr : offStats.offDmgStr,
      actionType: 'bonus',
      weaponDef: offDef,
    };
    attacks.push(offAtk);

    // 3. Dual Strike (Combined Action + Bonus Action)
    const dualAtk: ActiveAttackOption = {
      source: 'dual',
      weaponName: `${mainHandItem.name} + ${offHandItem.name} (Парная атака)`,
      attackBonus: `${mainStats.atkBonusStr} / ${offStats.atkBonusStr}`,
      damageAndType: `${mainAtk.damageAndType} + ${offAtk.damageAndType}`,
      actionType: 'dualAction',
      dualDetails: {
        mainWeapon: mainHandItem.name,
        offWeapon: offHandItem.name,
        mainAtkBonus: mainStats.atkBonusStr,
        offAtkBonus: offStats.atkBonusStr,
        mainDmg: mainAtk.damageAndType,
        offDmg: offAtk.damageAndType,
      },
    };
    attacks.push(dualAtk);
  } else {
    // Single weapon or 2-handed weapon in main hand
    if (mainHandItem) {
      const mainDef = findWeaponByName(mainHandItem.name);
      const mainStats = getWeaponStats(char, mainDef, mainHandItem.bonusAttack, mainHandItem.bonusDamage);

      attacks.push({
        source: 'mainHand',
        weaponName: mainHandItem.name,
        attackBonus: mainStats.atkBonusStr,
        damageAndType: mainStats.fullDmgStr,
        actionType: 'action',
        weaponDef: mainDef,
      });
    }

    // Only offHand equipped (e.g. single dagger in off-hand)
    if (offHandItem && !offHandItem.isShield && !mainHandItem) {
      const offDef = findWeaponByName(offHandItem.name);
      const offStats = getWeaponStats(char, offDef, offHandItem.bonusAttack, offHandItem.bonusDamage);

      attacks.push({
        source: 'offHand',
        weaponName: offHandItem.name,
        attackBonus: offStats.atkBonusStr,
        damageAndType: offStats.fullDmgStr,
        actionType: 'action',
        weaponDef: offDef,
      });
    }
  }

  // 4. Thrown weapons from equipment text or belt/pouch
  const inventorySources: string[] = [];
  if (char.equipment) {
    inventorySources.push(char.equipment);
  }
  if (equipped.belt?.name) inventorySources.push(equipped.belt.name);
  if (equipped.pouch?.name) inventorySources.push(equipped.pouch.name);

  const inventoryCombined = inventorySources.join(' \n ');
  const alreadyEquippedNames = new Set(
    [mainHandItem?.name, offHandItem?.name].filter(Boolean).map(n => n!.toLowerCase().trim())
  );

  for (const tw of KNOWN_THROWN_CONFIGS) {
    if (tw.test(inventoryCombined)) {
      // If not already the active main-hand or off-hand item
      const isAlreadyInHand = Array.from(alreadyEquippedNames).some(n => tw.test(n));
      if (!isAlreadyInHand) {
        const weaponDef = findWeaponByName(tw.name);
        if (weaponDef) {
          const stats = getWeaponStats(char, weaponDef);
          attacks.push({
            source: 'thrown',
            weaponName: weaponDef.name,
            attackBonus: stats.atkBonusStr,
            damageAndType: stats.fullDmgStr,
            actionType: 'action',
            weaponDef,
            notes: 'Метательное из снаряжения / пояса',
          });
        }
      }
    }
  }

  // 5. Unarmed Strike (always available per PHB)
  const strScore = getTotalScore(char, 'СИЛ');
  const strMod = calcModifier(strScore);
  const profBonus = calcProficiencyBonus(char.level || 1);
  const unarmedAtkBonus = formatModifier(profBonus + strMod);
  const unarmedDmgVal = Math.max(1, 1 + strMod);

  attacks.push({
    source: 'unarmed',
    weaponName: 'Безоружный удар',
    attackBonus: unarmedAtkBonus,
    damageAndType: `${unarmedDmgVal} дроб.`,
    actionType: 'action',
    notes: '1 + мод. СИЛ урона',
  });

  return attacks;
}
