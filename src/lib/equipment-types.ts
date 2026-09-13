import type { CharacterData, AbilityName, TraitItem } from './dnd-types';
import { calcModifier, calcProficiencyBonus, formatModifier, getTotalScore, normalizeAbilityName } from './dnd-types';
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

export type ItemEffectType =
  | 'ac'             // Класс Доспеха (+1, +2, -1)
  | 'speed'          // Скорость в футах (+10, -5)
  | 'hpMax'          // Максимальные хиты (+10, -5)
  | 'attack'         // Бонус к попаданию оружием (+1, +2)
  | 'weaponAttack'   // Синоним бонуса к попаданию оружием
  | 'damage'         // Бонусный урон оружия (+1, +2, -1)
  | 'weaponDamage'   // Синоним бонусного урона оружия
  | 'spellDC'        // Сложность спасбросков заклинаний (Сл) (+1, +2)
  | 'spellAttack'    // Шанс попадания / бонус к атаке заклинаниями (+1, +2)
  | 'spellDamage'    // Бонусный урон заклинаний (+1, +2, -1)
  | 'ability'        // Бонус к характеристике (+2 к Силе, -1 к Ловкости)
  | 'savingThrows'   // Бонус ко всем спасброскам (+1)
  | 'customTrait'    // Произвольное свойство от Мастера (текст + описание)
  | 'attackDamage';  // Обратная совместимость: бонус к атаке И урону

export type ItemAbilityKey = AbilityName | 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface ItemEffect {
  id: string;
  type: ItemEffectType;
  targetAbility?: ItemAbilityKey;
  value: number | string;
  description?: string;
  customName?: string;
}

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
  effects?: ItemEffect[];
}

export interface EquipmentBonusesSummary {
  acBonus: number;
  speedBonus: number;
  hpMaxBonus: number;
  abilityBonuses: Record<AbilityName, number> & Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>;
  attackBonus: number;
  damageBonus: number;
  spellDCBonus: number;
  spellAttackBonus: number;
  spellDamageBonus: number;
  savingThrowsBonus: number;
  itemTraits: TraitItem[];
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

  // Save custom items into char.customItems so they persist when unequipped
  const updatedCustomItems = char.customItems ? [...char.customItems] : [];
  if (item.effects && item.effects.length > 0) {
    const existingIndex = updatedCustomItems.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      updatedCustomItems[existingIndex] = item;
    } else {
      updatedCustomItems.push(item);
    }
  }

  const updated: CharacterData = {
    ...char,
    equippedSlots: updatedSlots,
    customItems: updatedCustomItems,
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
    customItems: char.customItems ? [...char.customItems] : [],
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

export function deleteCustomItem(
  char: CharacterData,
  itemId: string
): CharacterData {
  let updated: CharacterData = {
    ...char,
    customItems: (char.customItems || []).filter(i => i.id !== itemId),
  };

  // If it is currently equipped in any slot, unequip it
  if (updated.equippedSlots) {
    for (const [slotId, item] of Object.entries(updated.equippedSlots)) {
      if (item && item.id === itemId) {
        updated = unequipItem(updated, slotId as EquipmentSlotId);
      }
    }
  }

  return updated;
}

export function calculateEquipmentBonuses(char: CharacterData): EquipmentBonusesSummary {
  let acBonus = 0;
  let speedBonus = 0;
  let hpMaxBonus = 0;
  let attackBonus = 0;
  let damageBonus = 0;
  let spellDCBonus = 0;
  let spellAttackBonus = 0;
  let spellDamageBonus = 0;
  let savingThrowsBonus = 0;
  const abilityBonuses: Record<AbilityName, number> & Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number> = {
    'СИЛ': 0,
    'ЛОВ': 0,
    'ТЕЛ': 0,
    'ИНТ': 0,
    'МДР': 0,
    'ХАР': 0,
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
  };
  const itemTraits: TraitItem[] = [];

  if (!char.equippedSlots) {
    return {
      acBonus,
      speedBonus,
      hpMaxBonus,
      abilityBonuses,
      attackBonus,
      damageBonus,
      spellDCBonus,
      spellAttackBonus,
      spellDamageBonus,
      savingThrowsBonus,
      itemTraits,
    };
  }

  for (const [slotId, item] of Object.entries(char.equippedSlots)) {
    if (!item) continue;

    // 1. Dynamic effects
    if (item.effects && Array.isArray(item.effects)) {
      for (const effect of item.effects) {
        if (!effect) continue;
        const numVal = Number(effect.value) || 0;
        switch (effect.type) {
          case 'ac':
            acBonus += numVal;
            break;
          case 'speed':
            speedBonus += numVal;
            break;
          case 'hpMax':
            hpMaxBonus += numVal;
            break;
          case 'attack':
          case 'weaponAttack':
            attackBonus += numVal;
            break;
          case 'damage':
          case 'weaponDamage':
            damageBonus += numVal;
            break;
          case 'attackDamage':
            attackBonus += numVal;
            damageBonus += numVal;
            break;
          case 'spellDC':
            spellDCBonus += numVal;
            break;
          case 'spellAttack':
            spellAttackBonus += numVal;
            break;
          case 'spellDamage':
            spellDamageBonus += numVal;
            break;
          case 'savingThrows':
            savingThrowsBonus += numVal;
            break;
          case 'ability':
            if (effect.targetAbility) {
              const norm = normalizeAbilityName(effect.targetAbility);
              const engMap: Record<AbilityName, 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'> = {
                'СИЛ': 'str',
                'ЛОВ': 'dex',
                'ТЕЛ': 'con',
                'ИНТ': 'int',
                'МДР': 'wis',
                'ХАР': 'cha',
              };
              abilityBonuses[norm] += numVal;
              abilityBonuses[engMap[norm]] += numVal;
            }
            break;
          case 'customTrait':
            itemTraits.push({
              id: `trait-${item.id}-${effect.id}`,
              name: String(effect.customName || effect.value || item.name),
              source: `🎒 Экипировка: ${item.name}`,
              summary: effect.description || `Магическое свойство предмета «${item.name}»`,
              description: effect.description || '',
            });
            break;
        }
      }
    }

    // 2. Legacy / compendium fields
    if (slotId !== 'armor' && slotId !== 'offHand') {
      if (typeof item.bonusAC === 'number') {
        acBonus += item.bonusAC;
      }
    }
    if (typeof item.bonusSpeed === 'number') {
      speedBonus += item.bonusSpeed;
    }
    if (typeof item.bonusAttack === 'number') {
      attackBonus += item.bonusAttack;
    }
    if (typeof item.bonusDamage === 'number') {
      damageBonus += item.bonusDamage;
    }
  }

  return {
    acBonus,
    speedBonus,
    hpMaxBonus,
    abilityBonuses,
    attackBonus,
    damageBonus,
    spellDCBonus,
    spellAttackBonus,
    spellDamageBonus,
    savingThrowsBonus,
    itemTraits,
  };
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

function getItemAttackDamageBonuses(item?: EquippedItem): { atkBonus: number; dmgBonus: number } {
  if (!item) return { atkBonus: 0, dmgBonus: 0 };
  let atkBonus = typeof item.bonusAttack === 'number' ? item.bonusAttack : 0;
  let dmgBonus = typeof item.bonusDamage === 'number' ? item.bonusDamage : 0;
  if (item.effects && Array.isArray(item.effects)) {
    for (const eff of item.effects) {
      if (!eff) continue;
      const num = Number(eff.value) || 0;
      if (eff.type === 'attackDamage') {
        atkBonus += num;
        dmgBonus += num;
      } else if (eff.type === 'attack' || eff.type === 'weaponAttack') {
        atkBonus += num;
      } else if (eff.type === 'damage' || eff.type === 'weaponDamage') {
        dmgBonus += num;
      }
    }
  }
  return { atkBonus, dmgBonus };
}

function getAccessoryAttackDamageBonuses(char: CharacterData): { atkBonus: number; dmgBonus: number } {
  let atkBonus = 0;
  let dmgBonus = 0;
  if (!char.equippedSlots) return { atkBonus, dmgBonus };
  for (const [slotId, item] of Object.entries(char.equippedSlots)) {
    if (!item) continue;
    if (slotId === 'mainHand' || slotId === 'offHand') continue;
    if (typeof item.bonusAttack === 'number') {
      atkBonus += item.bonusAttack;
    }
    if (typeof item.bonusDamage === 'number') {
      dmgBonus += item.bonusDamage;
    }
    if (item.effects && Array.isArray(item.effects)) {
      for (const eff of item.effects) {
        if (!eff) continue;
        const num = Number(eff.value) || 0;
        if (eff.type === 'attackDamage') {
          atkBonus += num;
          dmgBonus += num;
        } else if (eff.type === 'attack' || eff.type === 'weaponAttack') {
          atkBonus += num;
        } else if (eff.type === 'damage' || eff.type === 'weaponDamage') {
          dmgBonus += num;
        }
      }
    }
  }
  return { atkBonus, dmgBonus };
}

export function getActiveCharacterAttacks(char: CharacterData): ActiveAttackOption[] {
  const attacks: ActiveAttackOption[] = [];
  const equipped = char.equippedSlots || {};
  const accBonus = getAccessoryAttackDamageBonuses(char);

  const mainHandItem = equipped.mainHand;
  const offHandItem = equipped.offHand;

  const isDualWield = Boolean(mainHandItem && offHandItem && !offHandItem.isShield);

  if (isDualWield && mainHandItem && offHandItem) {
    const mainDef = findWeaponByName(mainHandItem.name);
    const offDef = findWeaponByName(offHandItem.name);

    const mainBonus = getItemAttackDamageBonuses(mainHandItem);
    const offBonus = getItemAttackDamageBonuses(offHandItem);

    const mainStats = getWeaponStats(char, mainDef, mainBonus.atkBonus + accBonus.atkBonus, mainBonus.dmgBonus + accBonus.dmgBonus);
    const offStats = getWeaponStats(char, offDef, offBonus.atkBonus + accBonus.atkBonus, offBonus.dmgBonus + accBonus.dmgBonus);

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
      const mainBonus = getItemAttackDamageBonuses(mainHandItem);
      const mainStats = getWeaponStats(char, mainDef, mainBonus.atkBonus + accBonus.atkBonus, mainBonus.dmgBonus + accBonus.dmgBonus);

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
      const offBonus = getItemAttackDamageBonuses(offHandItem);
      const offStats = getWeaponStats(char, offDef, offBonus.atkBonus + accBonus.atkBonus, offBonus.dmgBonus + accBonus.dmgBonus);

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
