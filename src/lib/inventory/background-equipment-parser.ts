import { GearItemModel, GearUnit } from './gear-item';
import { itemRegistry } from './item-registry';
import { EquipmentPackModel } from './equipment-pack';

/**
 * Splits an equipment string by commas or semicolons, respecting nested parentheses.
 * e.g. "трофей с павшего врага (кинжал, сломанный клинок), кошель" -> 2 items.
 */
export function splitEquipmentString(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const parts: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '(' || char === '[' || char === '{') {
      depth++;
      current += char;
    } else if (char === ')' || char === ']' || char === '}') {
      depth = Math.max(0, depth - 1);
      current += char;
    } else if ((char === ',' || char === ';') && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) parts.push(trimmed);
      current = '';
    } else {
      current += char;
    }
  }

  const lastTrimmed = current.trim();
  if (lastTrimmed) parts.push(lastTrimmed);

  return parts
    .map(p => p.replace(/\.$/, '').trim())
    .filter(p => p.length > 0);
}

/**
 * Checks if a string contains or refers to an official equipment pack.
 */
export function detectPackInText(text: string): EquipmentPackModel | undefined {
  const lower = text.toLowerCase();
  const packKeywords: Array<{ pattern: RegExp; id: string }> = [
    { pattern: /набор\s+исследователя\s+подземелий|dungeoneer/i, id: 'pack-dungeoneers' },
    { pattern: /набор\s+путешественника|explorer/i, id: 'pack-explorers' },
    { pattern: /набор\s+священника|priest/i, id: 'pack-priests' },
    { pattern: /набор\s+уч[её]ного|scholar/i, id: 'pack-scholars' },
    { pattern: /набор\s+дипломата|diplomat/i, id: 'pack-diplomats' },
    { pattern: /набор\s+артиста|entertainer/i, id: 'pack-entertainers' },
    { pattern: /набор\s+грабителя|burglar/i, id: 'pack-burglars' },
  ];

  for (const { pattern, id } of packKeywords) {
    if (pattern.test(lower)) {
      return itemRegistry.getPack(id);
    }
  }

  return undefined;
}

/**
 * Standard ID mapper for common D&D gear items.
 */
const KNOWN_GEAR_IDS: Record<string, string> = {
  'рационы': 'gear-rations',
  'рацион': 'gear-rations',
  'пеньковая верёвка': 'gear-hempen-rope',
  'верёвка': 'gear-hempen-rope',
  'веревка': 'gear-hempen-rope',
  'бурдюк': 'gear-waterskin',
  'трутница': 'gear-tinderbox',
  'факел': 'gear-torch',
  'рюкзак': 'gear-backpack',
  'спальник': 'gear-bedroll',
  'столовый набор': 'gear-mess-kit',
  'лом': 'gear-crowbar',
  'ломик': 'gear-crowbar',
  'молоток': 'gear-hammer',
  'свечи': 'gear-candles',
  'свеча': 'gear-candles',
  'палочки благовоний': 'gear-incense-block',
  'палочка благовоний': 'gear-incense-block',
  'бутылочка чернил': 'gear-ink-bottle',
  'писчее перо': 'gear-ink-pen',
  'поясной кошель': 'gear-pouch',
  'кошель': 'gear-pouch',
  'кошелёк': 'gear-pouch',
  'священный символ': 'gear-holy-symbol',
  'облачение': 'gear-vestments',
  'кадило': 'gear-censer',
  'комплект обычной одежды': 'gear-common-clothes',
  'обычная одежда': 'gear-common-clothes',
  'комплект дорожной одежды': 'gear-travelers-clothes',
  'дорожная одежда': 'gear-travelers-clothes',
  'комплект превосходной одежды': 'gear-fine-clothes',
  'превосходная одежда': 'gear-fine-clothes',
  'маленький ножик': 'gear-small-knife',
  'нож': 'gear-small-knife',
};

function generateItemId(name: string): string {
  const lower = name.toLowerCase().trim();
  if (KNOWN_GEAR_IDS[lower]) {
    return KNOWN_GEAR_IDS[lower];
  }
  for (const [k, id] of Object.entries(KNOWN_GEAR_IDS)) {
    if (lower.startsWith(k)) return id;
  }
  // Transliterate/clean to slug
  const clean = lower
    .replace(/[^a-z0-9а-яё]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `gear-${clean.slice(0, 30)}`;
}

function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Parses an individual gear item entry string into a GearItemModel.
 */
function parseSingleGearItem(entry: string): GearItemModel {
  let raw = entry.trim().replace(/\.$/, '');
  let quantity = 1;
  let unit: GearUnit = 'шт.';
  let name = raw;

  // 1. Check parenthesized units e.g. "рационы (10 дн.)", "верёвка (50 фт.)", "песок (10 фнт.)"
  const parenUnitMatch = raw.match(/^(.*?)\s*\(\s*(\d+)\s*(дн\.?|дней|дня|день|фт\.?|футов|фута|фнт\.?|фунтов|фунта|шт\.?)\s*\)$/i);
  if (parenUnitMatch) {
    name = parenUnitMatch[1].trim();
    quantity = parseInt(parenUnitMatch[2], 10) || 1;
    const rawUnit = parenUnitMatch[3].toLowerCase();
    if (rawUnit.startsWith('дн') || rawUnit.startsWith('дней') || rawUnit.startsWith('дня') || rawUnit.startsWith('день')) {
      unit = 'дн.';
    } else if (rawUnit.startsWith('фт') || rawUnit.startsWith('фут')) {
      unit = 'фт.';
    } else if (rawUnit.startsWith('фнт') || rawUnit.startsWith('фунт')) {
      unit = 'фнт.';
    } else {
      unit = 'шт.';
    }
  } else {
    // 2. Check "10 дней рационов", "10 дн. рационов"
    const prefixDaysMatch = raw.match(/^(\d+)\s*(?:дней|дня|день|дн\.?)\s+(?:рационов|еды|пайков)?(.*)$/i);
    if (prefixDaysMatch) {
      quantity = parseInt(prefixDaysMatch[1], 10) || 1;
      unit = 'дн.';
      name = 'Рационы';
    } else {
      // 3. Check "50 футов пеньковой верёвки", "50 фт. верёвки"
      const prefixFeetMatch = raw.match(/^(\d+)\s*(?:футов|фута|фт\.?)\s+(?:пеньковой\s+верёвки|верёвки|веревки|.*)$/i);
      if (prefixFeetMatch) {
        quantity = parseInt(prefixFeetMatch[1], 10) || 1;
        unit = 'фт.';
        name = 'Пеньковая верёвка';
      } else {
        // 4. Check "мешочек с 10 фнт. песка", "мешочек с 10 фунтами песка"
        const pouchPoundsMatch = raw.match(/мешочек\s+с\s+(\d+)\s*(?:фнт\.?|фунтов|фунтами|фунта)\s*песка/i);
        if (pouchPoundsMatch) {
          quantity = parseInt(pouchPoundsMatch[1], 10) || 1;
          unit = 'фнт.';
          name = 'Мешочек с песком';
        } else {
          // 5. Generic leading quantity, e.g. "5 палочек благовоний", "10 свечей", "2 костюма"
          const leadingNumMatch = raw.match(/^(\d+)\s+(.+)$/);
          if (leadingNumMatch) {
            quantity = parseInt(leadingNumMatch[1], 10) || 1;
            name = leadingNumMatch[2].trim();
            unit = 'шт.';
          }
        }
      }
    }
  }

  // Normalization for specific items
  const lowerName = name.toLowerCase();
  if (lowerName === 'палочек благовоний' || lowerName === 'палочка благовоний') {
    name = 'Палочки благовоний';
  } else if (lowerName === 'верёвка' || lowerName === 'веревка') {
    name = 'Пеньковая верёвка';
  } else if (lowerName === 'рацион') {
    name = 'Рационы';
  } else if (lowerName === 'свеча') {
    name = 'Свечи';
  }

  name = capitalizeFirst(name);

  return new GearItemModel({
    id: generateItemId(name),
    name,
    quantity,
    unit,
  });
}

/**
 * Parses a background's equipment text into an array of GearItemModel instances.
 * Automatically unpacks any official equipment packs mentioned in the text.
 */
export function parseBackgroundEquipment(equipmentText: string): GearItemModel[] {
  if (!equipmentText || typeof equipmentText !== 'string') return [];

  const rawEntries = splitEquipmentString(equipmentText);
  let result: GearItemModel[] = [];

  for (const entry of rawEntries) {
    // Check if this entry refers to an official pack
    const pack = detectPackInText(entry);
    if (pack) {
      const unpacked = pack.unpack();
      result = mergeGearItems(result, unpacked);
    } else {
      const item = parseSingleGearItem(entry);
      result = mergeGearItems(result, [item]);
    }
  }

  return result;
}

/**
 * Merges two GearItemModel arrays, summing quantities when names (case-insensitive)
 * and units match.
 */
export function mergeGearItems(existing: GearItemModel[], incoming: GearItemModel[]): GearItemModel[] {
  const result = existing.map(item => item.clone());

  for (const item of incoming) {
    const normName = item.name.trim().toLowerCase();
    const match = result.find(
      r => r.name.trim().toLowerCase() === normName && r.unit === item.unit
    );

    if (match) {
      match.quantity += item.quantity;
    } else {
      result.push(item.clone());
    }
  }

  return result;
}
