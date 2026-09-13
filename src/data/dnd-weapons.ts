export interface DndWeapon {
  name: string;
  nameEn?: string;
  aliases?: string[];
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
  specialGrip?: 'lance';
}

export const DND_WEAPONS: DndWeapon[] = [
  // ── Простое рукопашное ──
  {
    name: 'Боевой посох',
    nameEn: 'Quarterstaff',
    aliases: ['Посох', 'Деревянный посох'],
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
    nameEn: 'Mace',
    aliases: ['Буздыхан', 'Шестопёр', 'Шестопер'],
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
    nameEn: 'Club',
    aliases: ['Дубина'],
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
    nameEn: 'Dagger',
    aliases: ['Нож', 'Стилет', 'Кортик'],
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
    nameEn: 'Spear',
    aliases: ['Копье'],
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
    nameEn: 'Light Hammer',
    aliases: ['Легкий молот', 'Молоток'],
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
    nameEn: 'Javelin',
    aliases: ['Метательное копье', 'Джавелин', 'Сулица'],
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
    nameEn: 'Greatclub',
    aliases: ['Большая палица', 'Двуручная дубина'],
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
    nameEn: 'Handaxe',
    aliases: ['Топорик', 'Томагавк'],
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
    nameEn: 'Sickle',
    aliases: ['Жатвенный серп'],
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
    nameEn: 'Light Crossbow',
    aliases: ['Легкий арбалет', 'Лёгкий арбалет', 'Арбалет легкий'],
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
    nameEn: 'Dart',
    aliases: ['Дартс'],
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
    nameEn: 'Shortbow',
    aliases: ['Лук короткий'],
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
    nameEn: 'Sling',
    aliases: ['Кожаная праща'],
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
    nameEn: 'Halberd',
    aliases: ['Бердыш', 'Полэкс'],
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
    nameEn: 'War pick',
    aliases: ['Кирка', 'Клевец', 'Боевой клевец', 'Чеккан', 'Чекан', 'Warpick'],
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
    nameEn: 'Warhammer',
    aliases: ['Чекан-молот', 'Клевец-молот'],
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
    nameEn: 'Battleaxe',
    aliases: ['Секирка', 'Боевая секира'],
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
    nameEn: 'Glaive',
    aliases: ['Глевия', 'Нагината', 'Совня'],
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
    nameEn: 'Greatsword',
    aliases: ['Цвайхендер', 'Клеймор', 'Эспадон'],
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
    nameEn: 'Lance',
    aliases: ['Длинное копье', 'Лэнс', 'Рыцарское копье', 'Кавалерийское копье'],
    category: 'Воинское рукопашное',
    cost: '10 зм',
    damageDice: '1d12',
    damageType: 'колющий',
    weight: '6 фнт.',
    properties: ['Досягаемость', 'особое'],
    specialGrip: 'lance',
    description: 'Рыцарское кавалерийское копье (лэнс). Вы совершаете с помехой броски атаки по целям в пределах 5 фт. Для использования требуется две руки, если вы не на верховом животном.'
  },
  {
    name: 'Длинный меч',
    nameEn: 'Longsword',
    aliases: ['Меч', 'Рыцарский меч', 'Полуторный меч'],
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
    nameEn: 'Whip',
    aliases: ['Хлыст', 'Плеть'],
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
    nameEn: 'Shortsword',
    aliases: ['Гладиус', 'Меч короткий', 'Акинак'],
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
    nameEn: 'Maul',
    aliases: ['Кувалда', 'Молот (Кувалда)', 'Двуручный молот', 'Боевая кувалда'],
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
    nameEn: 'Morningstar',
    aliases: ['Утренняя звезда', 'Шипастая булава'],
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
    nameEn: 'Pike',
    aliases: ['Пехотная пика', 'Сарисса'],
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
    nameEn: 'Rapier',
    aliases: ['Шпага', 'Эсток'],
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
    nameEn: 'Greataxe',
    aliases: ['Двуручный топор', 'Большой топор', 'Боевая секира'],
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
    nameEn: 'Scimitar',
    aliases: ['Сабля', 'Ятаган', 'Шамшир'],
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
    nameEn: 'Trident',
    aliases: ['Тройзуб', 'Острога'],
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
    nameEn: 'Flail',
    aliases: ['Боевой цеп', 'Моргенштерн на цепи', 'Кистень'],
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
    nameEn: 'Hand Crossbow',
    aliases: ['Ручной арбалет', 'Одноручный арбалет', 'Арбалет ручной'],
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
    nameEn: 'Heavy Crossbow',
    aliases: ['Тяжелый арбалет', 'Тяжёлый арбалет', 'Арбалет тяжелый', 'Арбалест'],
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
    nameEn: 'Longbow',
    aliases: ['Большой лук', 'Английский лук', 'Лук длинный'],
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
    nameEn: 'Blowgun',
    aliases: ['Духовое ружье', 'Сарбакан', 'Фукибара'],
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
    nameEn: 'Net',
    aliases: ['Боевая сеть', 'Ловчая сеть'],
    category: 'Воинское дальнобойное',
    cost: '1 зм',
    damageDice: '-',
    damageType: 'особое',
    weight: '3 фнт.',
    properties: ['Метательное (дис. 5/15)', 'особое'],
    rangeNormal: 5,
    rangeLong: 15,
    description: 'Сеть для стреноживания врагов. Существо Большого или меньшего размера становится опутанным, пока не высвободится.'
  }
];

export function weaponToCompendiumItem(w: DndWeapon) {
  return {
    name: w.name,
    nameEn: w.nameEn,
    category: 'Оружие' as const,
    subcategory: w.category,
    cost: w.cost,
    weight: w.weight,
    description: w.description || `${w.name} (${w.category}). Урон: ${w.damageDice} ${w.damageType}.${w.properties.length ? ' Свойства: ' + w.properties.join(', ') : ''}`,
    weapon: {
      category: w.category,
      damageDice: w.damageDice,
      damageType: w.damageType,
      properties: w.properties,
      finesse: w.finesse,
      versatileDice: w.versatileDice,
      rangeNormal: w.rangeNormal,
      rangeLong: w.rangeLong,
    },
  };
}

export function findWeaponByName(name: string): DndWeapon | undefined {
  if (!name) return undefined;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/^(два|две|четыре|три|\d+)\s+/i, '')
      .trim();

  const clean = norm(name);

  // 1. Direct exact match on name
  let found = DND_WEAPONS.find(w => norm(w.name) === clean);
  if (found) return found;

  // 1.1 Match nameEn or aliases
  found = DND_WEAPONS.find(w =>
    (w.nameEn && norm(w.nameEn) === clean) ||
    (w.aliases && w.aliases.some(a => norm(a) === clean))
  );
  if (found) return found;

  // 2. Words subset match (e.g. "легкий арбалет" <-> "арбалет, легкий")
  const words = clean.split(/[\s,]+/).filter(w => w.length > 2);
  if (words.length > 0) {
    found = DND_WEAPONS.find(w => {
      const candidates = [norm(w.name), ...(w.aliases ? w.aliases.map(norm) : []), ...(w.nameEn ? [norm(w.nameEn)] : [])];
      return candidates.some(c => words.every(word => c.includes(word)));
    });
    if (found) return found;

    // 3. Stems match (e.g. "ручных топора" -> stems "ручн", "топор")
    const stems = words.map(w => (w.length > 4 ? w.slice(0, 4) : w));
    found = DND_WEAPONS.find(w => {
      const candidates = [norm(w.name), ...(w.aliases ? w.aliases.map(norm) : [])];
      return candidates.some(c => stems.every(stem => c.includes(stem)));
    });
    if (found) return found;
  }

  // 4. Substring match
  return DND_WEAPONS.find(w => {
    const candidates = [norm(w.name), ...(w.aliases ? w.aliases.map(norm) : []), ...(w.nameEn ? [norm(w.nameEn)] : [])];
    return candidates.some(c => clean.includes(c) || c.includes(clean));
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

/**
 * Checks whether a weapon supports toggling between 1-handed (1H) and 2-handed (2H) grips.
 * Data-driven: returns true for versatile weapons and special weapons (e.g. Lance).
 * Strictly two-handed weapons or strictly one-handed non-versatile weapons return false.
 */
export function canToggleWeaponGrip(weaponDef?: DndWeapon): boolean {
  if (!weaponDef) return false;
  // Strictly two-handed weapons cannot be toggled
  if ((weaponDef.properties || []).some(p => /двуручное|two-handed/i.test(p))) {
    return false;
  }
  // Versatile weapons can be toggled
  if (weaponDef.versatileDice || (weaponDef.properties || []).some(p => /универсальное|versatile/i.test(p))) {
    return true;
  }
  // Special grip weapons: Lance (2H on foot, 1H mounted)
  if (weaponDef.specialGrip === 'lance' || (weaponDef.properties || []).some(p => /особое/i.test(p) && /верховом|mounted/i.test(weaponDef.description || ''))) {
    return true;
  }
  return false;
}

/**
 * Returns damage dice based on weapon definition and current grip (1H vs 2H).
 * Versatile weapons return versatileDice when twoHandGrip is true.
 */
export function getWeaponDamageDiceForGrip(weaponDef?: DndWeapon, twoHandGrip?: boolean): string {
  if (!weaponDef) return '1d6';
  if (twoHandGrip && weaponDef.versatileDice) {
    return weaponDef.versatileDice;
  }
  return weaponDef.damageDice || '1d6';
}

