export * from './compendium/items';
import { DND_COMPENDIUM_ITEMS, getWeaponItems, type CompendiumItem } from './compendium/items';

export interface DndWeapon {
  name: string;
  category: 'Простое рукопашное' | 'Простое дальнобойное' | 'Воинское рукопашное' | 'Воинское дальнобойное';
  damageDice: string;
  damageType: 'колющий' | 'рубящий' | 'дробящий' | 'особое';
  properties: string[];
  rangeNormal?: number;
  rangeLong?: number;
  finesse?: boolean;
  versatileDice?: string;
  weight?: string;
  cost?: string;
  description?: string;
}

export const DND_WEAPONS: DndWeapon[] = [
  // ── Простое рукопашное ──
  {
    name: 'Боевой посох',
    category: 'Простое рукопашное',
    cost: '2 см',
    damageDice: '1d6',
    damageType: 'дробящий',
    weight: '4 фнт.',
    properties: ['Универсальное (1к8)'],
    versatileDice: '1d8',
    description: 'Деревянный посох, пригодный для боя одной или двумя руками.'
  },
  {
    name: 'Булава',
    category: 'Простое рукопашное',
    cost: '5 зм',
    damageDice: '1d6',
    damageType: 'дробящий',
    weight: '4 фнт.',
    properties: [],
    description: 'Тяжелая булава с утолщенным набалдашником.'
  },
  {
    name: 'Дубинка',
    category: 'Простое рукопашное',
    cost: '1 см',
    damageDice: '1d4',
    damageType: 'дробящий',
    weight: '2 фнт.',
    properties: ['Лёгкое'],
    description: 'Простая деревянная дубинка.'
  },
  {
    name: 'Кинжал',
    category: 'Простое рукопашное',
    cost: '2 зм',
    damageDice: '1d4',
    damageType: 'колющий',
    weight: '1 фнт.',
    properties: ['Лёгкое', 'метательное (дис. 20/60)', 'фехтовальное'],
    finesse: true,
    rangeNormal: 20,
    rangeLong: 60,
    description: 'Короткий клинок для скрытого ношения и точных ударов.'
  },
  {
    name: 'Копьё',
    category: 'Простое рукопашное',
    cost: '1 зм',
    damageDice: '1d6',
    damageType: 'колющий',
    weight: '3 фнт.',
    properties: ['Метательное (дис. 20/60)', 'универсальное (1к8)'],
    versatileDice: '1d8',
    rangeNormal: 20,
    rangeLong: 60,
    description: 'Древковое оружие с острым наконечником.'
  },
  {
    name: 'Лёгкий молот',
    category: 'Простое рукопашное',
    cost: '2 зм',
    damageDice: '1d4',
    damageType: 'дробящий',
    weight: '2 фнт.',
    properties: ['Лёгкое', 'метательное (дис. 20/60)'],
    rangeNormal: 20,
    rangeLong: 60,
    description: 'Небольшой молот, удобный для ближнего боя и броска.'
  },
  {
    name: 'Метательное копьё',
    category: 'Простое рукопашное',
    cost: '5 см',
    damageDice: '1d6',
    damageType: 'колющий',
    weight: '2 фнт.',
    properties: ['Метательное (дис. 30/120)'],
    rangeNormal: 30,
    rangeLong: 120,
    description: 'Сбалансированное легкое копье для дальних бросков.'
  },
  {
    name: 'Палица',
    category: 'Простое рукопашное',
    cost: '2 см',
    damageDice: '1d8',
    damageType: 'дробящий',
    weight: '10 фнт.',
    properties: ['Двуручное'],
    description: 'Массивная двуручная деревянная палица.'
  },
  {
    name: 'Ручной топор',
    category: 'Простое рукопашное',
    cost: '5 зм',
    damageDice: '1d6',
    damageType: 'рубящий',
    weight: '2 фнт.',
    properties: ['Лёгкое', 'метательное (дис. 20/60)'],
    rangeNormal: 20,
    rangeLong: 60,
    description: 'Компактный топор с хорошим балансом для рубки и броска.'
  },
  {
    name: 'Серп',
    category: 'Простое рукопашное',
    cost: '1 зм',
    damageDice: '1d4',
    damageType: 'рубящий',
    weight: '2 фнт.',
    properties: ['Лёгкое'],
    description: 'Изогнутый клинок, традиционный для друидов.'
  },

  // ── Простое дальнобойное ──
  {
    name: 'Арбалет, лёгкий',
    category: 'Простое дальнобойное',
    cost: '25 зм',
    damageDice: '1d8',
    damageType: 'колющий',
    weight: '5 фнт.',
    properties: ['Боеприпас (дис. 80/320)', 'двуручное', 'перезарядка'],
    rangeNormal: 80,
    rangeLong: 320,
    description: 'Простой в обращении арбалет.'
  },
  {
    name: 'Дротик',
    category: 'Простое дальнобойное',
    cost: '5 мм',
    damageDice: '1d4',
    damageType: 'колющий',
    weight: '1/4 фнт.',
    properties: ['Метательное (дис. 20/60)', 'фехтовальное'],
    finesse: true,
    rangeNormal: 20,
    rangeLong: 60,
    description: 'Метательное короткое оперенное копьецо.'
  },
  {
    name: 'Короткий лук',
    category: 'Простое дальнобойное',
    cost: '25 зм',
    damageDice: '1d6',
    damageType: 'колющий',
    weight: '2 фнт.',
    properties: ['Боеприпас (дис. 80/320)', 'двуручное'],
    rangeNormal: 80,
    rangeLong: 320,
    description: 'Компактный простой лук.'
  },
  {
    name: 'Праща',
    category: 'Простое дальнобойное',
    cost: '1 см',
    damageDice: '1d4',
    damageType: 'дробящий',
    weight: '-',
    properties: ['Боеприпас (дис. 30/120)'],
    rangeNormal: 30,
    rangeLong: 120,
    description: 'Кожаная праща для метания круглых камней или пуль.'
  },

  // ── Воинское рукопашное ──
  {
    name: 'Алебарда',
    category: 'Воинское рукопашное',
    cost: '20 зм',
    damageDice: '1d10',
    damageType: 'рубящий',
    weight: '6 фнт.',
    properties: ['Двуручное', 'досягаемость', 'тяжёлое'],
    description: 'Длинное древковое оружие с рубящим топором.'
  },
  {
    name: 'Боевая кирка',
    category: 'Воинское рукопашное',
    cost: '5 зм',
    damageDice: '1d8',
    damageType: 'колющий',
    weight: '2 фнт.',
    properties: [],
    description: 'Заостренная кирка для пробивания лат.'
  },
  {
    name: 'Боевой молот',
    category: 'Воинское рукопашное',
    cost: '15 зм',
    damageDice: '1d8',
    damageType: 'дробящий',
    weight: '2 фнт.',
    properties: ['Универсальное (1к10)'],
    versatileDice: '1d10',
    description: 'Воинский молот с клювом на тыльной стороне.'
  },
  {
    name: 'Боевой топор',
    category: 'Воинское рукопашное',
    cost: '10 зм',
    damageDice: '1d8',
    damageType: 'рубящий',
    weight: '4 фнт.',
    properties: ['Универсальное (1к10)'],
    versatileDice: '1d10',
    description: 'Одноручный воинский топор с широким лезвием.'
  },
  {
    name: 'Глефа',
    category: 'Воинское рукопашное',
    cost: '20 зм',
    damageDice: '1d10',
    damageType: 'рубящий',
    weight: '6 фнт.',
    properties: ['Двуручное', 'досягаемость', 'тяжёлое'],
    description: 'Древковое оружие с изогнутым рубящим лезвием.'
  },
  {
    name: 'Двуручный меч',
    category: 'Воинское рукопашное',
    cost: '50 зм',
    damageDice: '2d6',
    damageType: 'рубящий',
    weight: '6 фнт.',
    properties: ['Двуручное', 'тяжёлое'],
    description: 'Большой клинок для сокрушительных ударов обеими руками.'
  },
  {
    name: 'Длинное копьё',
    category: 'Воинское рукопашное',
    cost: '10 зм',
    damageDice: '1d12',
    damageType: 'колющий',
    weight: '6 фнт.',
    properties: ['Досягаемость', 'особое'],
    description: 'Рыцарское кавалерийское копье (лэнс).'
  },
  {
    name: 'Длинный меч',
    category: 'Воинское рукопашное',
    cost: '15 зм',
    damageDice: '1d8',
    damageType: 'рубящий',
    weight: '3 фнт.',
    properties: ['Универсальное (1к10)'],
    versatileDice: '1d10',
    description: 'Классический меч, эффективный как в одной руке, так и двумя.'
  },
  {
    name: 'Кнут',
    category: 'Воинское рукопашное',
    cost: '2 зм',
    damageDice: '1d4',
    damageType: 'рубящий',
    weight: '3 фнт.',
    properties: ['Досягаемость', 'фехтовальное'],
    finesse: true,
    description: 'Гибкий плетеный кнут с увеличенной досягаемостью.'
  },
  {
    name: 'Короткий меч',
    category: 'Воинское рукопашное',
    cost: '10 зм',
    damageDice: '1d6',
    damageType: 'колющий',
    weight: '2 фнт.',
    properties: ['Лёгкое', 'фехтовальное'],
    finesse: true,
    description: 'Прямой клинок для быстрых уколов с опорой на ловкость.'
  },
  {
    name: 'Молот',
    category: 'Воинское рукопашное',
    cost: '10 зм',
    damageDice: '2d6',
    damageType: 'дробящий',
    weight: '10 фнт.',
    properties: ['Двуручное', 'тяжёлое'],
    description: 'Тяжелая двуручная боевая кувалда.'
  },
  {
    name: 'Моргенштерн',
    category: 'Воинское рукопашное',
    cost: '15 зм',
    damageDice: '1d8',
    damageType: 'колющий',
    weight: '4 фнт.',
    properties: [],
    description: 'Шипастая металлическая булава.'
  },
  {
    name: 'Пика',
    category: 'Воинское рукопашное',
    cost: '5 зм',
    damageDice: '1d10',
    damageType: 'колющий',
    weight: '18 фнт.',
    properties: ['Двуручное', 'досягаемость', 'тяжёлое'],
    description: 'Длинное пехотное колющее древковое оружие.'
  },
  {
    name: 'Рапира',
    category: 'Воинское рукопашное',
    cost: '25 зм',
    damageDice: '1d8',
    damageType: 'колющий',
    weight: '2 фнт.',
    properties: ['Фехтовальное'],
    finesse: true,
    description: 'Изящное оружие для фехтовальных выпадов.'
  },
  {
    name: 'Секира',
    category: 'Воинское рукопашное',
    cost: '30 зм',
    damageDice: '1d12',
    damageType: 'рубящий',
    weight: '7 фнт.',
    properties: ['Двуручное', 'тяжёлое'],
    description: 'Большой двуручный топор с полукруглым лезвием.'
  },
  {
    name: 'Скимитар',
    category: 'Воинское рукопашное',
    cost: '25 зм',
    damageDice: '1d6',
    damageType: 'рубящий',
    weight: '3 фнт.',
    properties: ['Лёгкое', 'фехтовальное'],
    finesse: true,
    description: 'Изогнутая сабля для быстрых рубящих взмахов.'
  },
  {
    name: 'Трезубец',
    category: 'Воинское рукопашное',
    cost: '5 зм',
    damageDice: '1d6',
    damageType: 'колющий',
    weight: '4 фнт.',
    properties: ['Метательное (дис. 20/60)', 'универсальное (1к8)'],
    versatileDice: '1d8',
    rangeNormal: 20,
    rangeLong: 60,
    description: 'Трезубец с тремя заостренными зубьями.'
  },
  {
    name: 'Цеп',
    category: 'Воинское рукопашное',
    cost: '10 зм',
    damageDice: '1d8',
    damageType: 'дробящий',
    weight: '2 фнт.',
    properties: [],
    description: 'Шипастый металлический шар на цепи.'
  },

  // ── Воинское дальнобойное ──
  {
    name: 'Арбалет, ручной',
    category: 'Воинское дальнобойное',
    cost: '75 зм',
    damageDice: '1d6',
    damageType: 'колющий',
    weight: '3 фнт.',
    properties: ['Боеприпас (дис. 30/120)', 'лёгкое', 'перезарядка'],
    rangeNormal: 30,
    rangeLong: 120,
    description: 'Компактный одноручный арбалет.'
  },
  {
    name: 'Арбалет, тяжёлый',
    category: 'Воинское дальнобойное',
    cost: '50 зм',
    damageDice: '1d10',
    damageType: 'колющий',
    weight: '18 фнт.',
    properties: ['Боеприпас (дис. 100/400)', 'двуручное', 'перезарядка', 'тяжёлое'],
    rangeNormal: 100,
    rangeLong: 400,
    description: 'Мощный арбалет с огромной пробивной силой.'
  },
  {
    name: 'Длинный лук',
    category: 'Воинское дальнобойное',
    cost: '50 зм',
    damageDice: '1d8',
    damageType: 'колющий',
    weight: '2 фнт.',
    properties: ['Боеприпас (дис. 150/600)', 'двуручное', 'тяжёлое'],
    rangeNormal: 150,
    rangeLong: 600,
    description: 'Большой дальнобойный лук.'
  },
  {
    name: 'Духовая трубка',
    category: 'Воинское дальнобойное',
    cost: '10 зм',
    damageDice: '1',
    damageType: 'колющий',
    weight: '1 фнт.',
    properties: ['Боеприпас (дис. 25/100)', 'перезарядка'],
    rangeNormal: 25,
    rangeLong: 100,
    description: 'Трубка для скрытной стрельбы дротиками.'
  },
  {
    name: 'Сеть',
    category: 'Воинское дальнобойное',
    cost: '1 зм',
    damageDice: '-',
    damageType: 'особое',
    weight: '3 фнт.',
    properties: ['Метательное (дис. 5/15)', 'особое'],
    rangeNormal: 5,
    rangeLong: 15,
    description: 'Сеть для стреноживания врагов.'
  }
];

export function findWeaponByName(name: string): DndWeapon | undefined {
  if (!name) return undefined;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/^(два|две|четыре|три|\d+)\s+/i, '')
      .trim();

  const clean = norm(name);

  // 1. Direct exact match
  let found = DND_WEAPONS.find(w => norm(w.name) === clean);
  if (found) return found;

  // 2. Words subset match (e.g. "легкий арбалет" <-> "арбалет, легкий")
  const words = clean.split(/[\s,]+/).filter(w => w.length > 2);
  if (words.length > 0) {
    found = DND_WEAPONS.find(w => {
      const wNorm = norm(w.name);
      return words.every(word => wNorm.includes(word));
    });
    if (found) return found;

    // 3. Stems match (e.g. "ручных топора" -> stems "ручн", "топор")
    const stems = words.map(w => (w.length > 4 ? w.slice(0, 4) : w));
    found = DND_WEAPONS.find(w => {
      const wNorm = norm(w.name);
      return stems.every(stem => wNorm.includes(stem));
    });
    if (found) return found;
  }

  // 4. Substring match
  return DND_WEAPONS.find(w => {
    const wNorm = norm(w.name);
    return clean.includes(wNorm) || wNorm.includes(clean);
  });
}

export interface WeaponCategoryPlaceholder {
  needed: boolean;
  category?: 'Простое рукопашное' | 'Простое дальнобойное' | 'Воинское рукопашное' | 'Воинское дальнобойное' | 'Простое' | 'Воинское' | 'Любое';
  hasShield?: boolean;
  count: number;
}

export function detectWeaponCategoryPlaceholder(text: string): WeaponCategoryPlaceholder {
  const clean = text.toLowerCase().trim();
  const hasShield = clean.includes('щит');
  const isTwo = clean.includes('два') || clean.includes('двух') || clean.includes('две');
  const count = isTwo ? 2 : 1;

  if (clean.includes('воинск') && clean.includes('рукопашн')) {
    return { needed: true, category: 'Воинское рукопашное', hasShield, count };
  }
  if (clean.includes('прост') && clean.includes('рукопашн')) {
    return { needed: true, category: 'Простое рукопашное', hasShield, count };
  }
  if (clean.includes('воинск') && clean.includes('дальнобойн')) {
    return { needed: true, category: 'Воинское дальнобойное', hasShield, count };
  }
  if (clean.includes('прост') && clean.includes('дальнобойн')) {
    return { needed: true, category: 'Простое дальнобойное', hasShield, count };
  }
  if (clean.includes('воинск') && (clean.includes('оружи') || clean.includes('любое'))) {
    return { needed: true, category: 'Воинское', hasShield, count };
  }
  if (clean.includes('прост') && (clean.includes('оружи') || clean.includes('любое') || clean.includes('одно'))) {
    return { needed: true, category: 'Простое', hasShield, count };
  }

  return { needed: false, count: 0 };
}

export function getDefaultWeaponForCategory(category?: string, slotIndex = 0): string {
  if (category === 'Воинское рукопашное') {
    return slotIndex === 1 ? 'Короткий меч' : 'Длинный меч';
  }
  if (category === 'Воинское дальнобойное') {
    return 'Длинный лук';
  }
  if (category === 'Воинское') {
    return slotIndex === 1 ? 'Короткий меч' : 'Длинный меч';
  }
  if (category === 'Простое рукопашное') {
    return slotIndex === 1 ? 'Ручной топор' : 'Копьё';
  }
  if (category === 'Простое дальнобойное') {
    return 'Короткий лук';
  }
  if (category === 'Простое') {
    return slotIndex === 1 ? 'Ручной топор' : 'Кинжал';
  }
  return 'Кинжал';
}

export function getWeaponsByCategory(category?: string): DndWeapon[] {
  if (!category || category === 'Любое') return DND_WEAPONS;
  if (category === 'Воинское') {
    return DND_WEAPONS.filter(w => w.category.startsWith('Воинское'));
  }
  if (category === 'Простое') {
    return DND_WEAPONS.filter(w => w.category.startsWith('Простое'));
  }
  return DND_WEAPONS.filter(w => w.category === category);
}

