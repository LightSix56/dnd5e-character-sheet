export interface DndWeapon {
  name: string;
  category: 'Простое рукопашное' | 'Простое дальнобойное' | 'Воинское рукопашное' | 'Воинское дальнобойное';
  damageDice: string;
  damageType: 'колющий' | 'рубящий' | 'дробящий';
  properties: string[];
  rangeNormal?: number;
  rangeLong?: number;
  finesse?: boolean;
  versatileDice?: string;
  weight?: string;
  cost?: string;
  description: string;
}

export const DND_WEAPONS: DndWeapon[] = [
  // ── Простое рукопашное оружие ──
  {
    name: 'Боевой посох',
    category: 'Простое рукопашное',
    damageDice: '1d6',
    damageType: 'дробящий',
    properties: ['Универсальное (1d8)'],
    versatileDice: '1d8',
    weight: '4 фнт.',
    cost: '2 см',
    description: 'Деревянный посох длиной около 1,8 метра. Может использоваться как магическая фокусировка или оружие ближнего боя.'
  },
  {
    name: 'Булава',
    category: 'Простое рукопашное',
    damageDice: '1d6',
    damageType: 'дробящий',
    properties: [],
    weight: '4 фнт.',
    cost: '5 зм',
    description: 'Тяжелое ударное оружие с металлическим или каменным навершием, способное пробивать доспехи.'
  },
  {
    name: 'Дубинка',
    category: 'Простое рукопашное',
    damageDice: '1d4',
    damageType: 'дробящий',
    properties: ['Легкое'],
    weight: '2 фнт.',
    cost: '1 см',
    description: 'Простая деревянная дубинка, удобная для скрытого ношения или боя двумя оружиями.'
  },
  {
    name: 'Кинжал',
    category: 'Простое рукопашное',
    damageDice: '1d4',
    damageType: 'колющий',
    properties: ['Фехтовальное', 'Легкое', 'Метательное (дист. 20/60)'],
    finesse: true,
    rangeNormal: 20,
    rangeLong: 60,
    weight: '1 фнт.',
    cost: '2 зм',
    description: 'Острое короткое лезвие. Позволяет использовать Ловкость вместо Силы и бросать во врага на дистанцию до 60 футов.'
  },
  {
    name: 'Копье',
    category: 'Простое рукопашное',
    damageDice: '1d6',
    damageType: 'колющий',
    properties: ['Метательное (дист. 20/60)', 'Универсальное (1d8)'],
    versatileDice: '1d8',
    rangeNormal: 20,
    rangeLong: 60,
    weight: '3 фнт.',
    cost: '1 зм',
    description: 'Длинное древковое оружие с острым наконечником. Можно метать или держать двумя руками для усиления урона.'
  },
  {
    name: 'Легкий молот',
    category: 'Простое рукопашное',
    damageDice: '1d4',
    damageType: 'дробящий',
    properties: ['Легкое', 'Метательное (дист. 20/60)'],
    rangeNormal: 20,
    rangeLong: 60,
    weight: '2 фнт.',
    cost: '2 зм',
    description: 'Компактный молот, пригодный для метания и боя в обеих руках.'
  },
  {
    name: 'Палица',
    category: 'Простое рукопашное',
    damageDice: '1d8',
    damageType: 'дробящий',
    properties: ['Двуручное'],
    weight: '10 фнт.',
    cost: '2 см',
    description: 'Массивная двуручная деревянная дубина, усиленная железными шипами или кольцами.'
  },
  {
    name: 'Ручной топор',
    category: 'Простое рукопашное',
    damageDice: '1d6',
    damageType: 'рубящий',
    properties: ['Легкое', 'Метательное (дист. 20/60)'],
    rangeNormal: 20,
    rangeLong: 60,
    weight: '2 фнт.',
    cost: '5 зм',
    description: 'Универсальный топор, пригодный для рубки в ближнем бою и метания.'
  },
  {
    name: 'Серп',
    category: 'Простое рукопашное',
    damageDice: '1d4',
    damageType: 'рубящий',
    properties: ['Легкое'],
    weight: '2 фнт.',
    cost: '1 зм',
    description: 'Изогнутое сельскохозяйственное лезвие, традиционное оружие друидов.'
  },
  {
    name: 'Дротик',
    category: 'Простое дальнобойное',
    damageDice: '1d4',
    damageType: 'колющий',
    properties: ['Фехтовальное', 'Метательное (дист. 20/60)'],
    finesse: true,
    rangeNormal: 20,
    rangeLong: 60,
    weight: '0.25 фнт.',
    cost: '5 мм',
    description: 'Небольшой метательный снаряд, стабилизируемый оперением.'
  },
  {
    name: 'Короткий лук',
    category: 'Простое дальнобойное',
    damageDice: '1d6',
    damageType: 'колющий',
    properties: ['Боеприпас (дист. 80/320)', 'Двуручное'],
    rangeNormal: 80,
    rangeLong: 320,
    weight: '2 фнт.',
    cost: '25 зм',
    description: 'Компактный лук для охоты и стрельбы на средние дистанции.'
  },
  {
    name: 'Легкий арбалет',
    category: 'Простое дальнобойное',
    damageDice: '1d8',
    damageType: 'колющий',
    properties: ['Боеприпас (дист. 80/320)', 'Зарядка', 'Двуручное'],
    rangeNormal: 80,
    rangeLong: 320,
    weight: '5 фнт.',
    cost: '25 зм',
    description: 'Механический арбалет, стреляющий болтами. Требует перезарядки после каждого выстрела.'
  },
  {
    name: 'Праща',
    category: 'Простое дальнобойное',
    damageDice: '1d4',
    damageType: 'дробящий',
    properties: ['Боеприпас (дист. 30/120)'],
    rangeNormal: 30,
    rangeLong: 120,
    weight: '0 фнт.',
    cost: '1 см',
    description: 'Кожаная праща, метающая свинцовые пули или гладкие камни.'
  },

  // ── Воинское рукопашное оружие ──
  {
    name: 'Алебарда',
    category: 'Воинское рукопашное',
    damageDice: '1d10',
    damageType: 'рубящий',
    properties: ['Тяжелое', 'Досягаемость (10 фт.)', 'Двуручное'],
    weight: '6 фнт.',
    cost: '20 зм',
    description: 'Тяжелое древковое оружие с топором и острием. Позволяет атаковать врагов на расстоянии 10 футов.'
  },
  {
    name: 'Боевой молот',
    category: 'Воинское рукопашное',
    damageDice: '1d8',
    damageType: 'дробящий',
    properties: ['Универсальное (1d10)'],
    versatileDice: '1d10',
    weight: '2 фнт.',
    cost: '15 зм',
    description: 'Кованый молот рыцарей. При удержании двумя руками наносит 1d10 дробящего урона.'
  },
  {
    name: 'Боевой топор',
    category: 'Воинское рукопашное',
    damageDice: '1d8',
    damageType: 'рубящий',
    properties: ['Универсальное (1d10)'],
    versatileDice: '1d10',
    weight: '4 фнт.',
    cost: '10 зм',
    description: 'Широкий одноручный топор, способный рубить щиты и доспехи. В двух руках наносит 1d10 урона.'
  },
  {
    name: 'Глефа',
    category: 'Воинское рукопашное',
    damageDice: '1d10',
    damageType: 'рубящий',
    properties: ['Тяжелое', 'Досягаемость (10 фт.)', 'Двуручное'],
    weight: '6 фнт.',
    cost: '20 зм',
    description: 'Древковое оружие с изогнутым длинным клинком. Обладает досягаемостью 10 футов.'
  },
  {
    name: 'Двуручный меч',
    category: 'Воинское рукопашное',
    damageDice: '2d6',
    damageType: 'рубящий',
    properties: ['Тяжелое', 'Двуручное'],
    weight: '6 фнт.',
    cost: '50 зм',
    description: 'Громадный клинок, требующий обеих рук. Наносит сокрушительные 2d6 рубящего урона.'
  },
  {
    name: 'Двуручный топор',
    category: 'Воинское рукопашное',
    damageDice: '1d12',
    damageType: 'рубящий',
    properties: ['Тяжелое', 'Двуручное'],
    weight: '7 фнт.',
    cost: '30 зм',
    description: 'Массивный топор с огромным лезвием. Любимое оружие варваров для сокрушительных критических ударов.'
  },
  {
    name: 'Длинный меч',
    category: 'Воинское рукопашное',
    damageDice: '1d8',
    damageType: 'рубящий',
    properties: ['Универсальное (1d10)'],
    versatileDice: '1d10',
    weight: '3 фнт.',
    cost: '15 зм',
    description: 'Классический рыцарский меч. Наносит 1d8 в одной руке или 1d10 при хвате двумя руками.'
  },
  {
    name: 'Кнут',
    category: 'Воинское рукопашное',
    damageDice: '1d4',
    damageType: 'рубящий',
    properties: ['Фехтовальное', 'Досягаемость (10 фт.)'],
    finesse: true,
    weight: '3 фнт.',
    cost: '2 зм',
    description: 'Гибкий плетеный кнут. Позволяет использовать Ловкость и наносить удары на расстоянии 10 футов.'
  },
  {
    name: 'Короткий меч',
    category: 'Воинское рукопашное',
    damageDice: '1d6',
    damageType: 'колющий',
    properties: ['Фехтовальное', 'Легкое'],
    finesse: true,
    weight: '2 фнт.',
    cost: '10 зм',
    description: 'Прямой обоюдоострый клинок. Идеален для плутов и фехтовальщиков с двумя клинками.'
  },
  {
    name: 'Молот (Мул)',
    category: 'Воинское рукопашное',
    damageDice: '2d6',
    damageType: 'дробящий',
    properties: ['Тяжелое', 'Двуручное'],
    weight: '10 фнт.',
    cost: '10 зм',
    description: 'Огромный двуручный боевой молот. Наносит сокрушительные 2d6 дробящего урона.'
  },
  {
    name: 'Моргенштерн',
    category: 'Воинское рукопашное',
    damageDice: '1d8',
    damageType: 'колющий',
    properties: [],
    weight: '4 фнт.',
    cost: '15 зм',
    description: 'Тяжелая булава с шипастым железным шаром на конце рукояти.'
  },
  {
    name: 'Пика',
    category: 'Воинское рукопашное',
    damageDice: '1d10',
    damageType: 'колющий',
    properties: ['Тяжелое', 'Досягаемость (10 фт.)', 'Двуручное'],
    weight: '18 фнт.',
    cost: '5 зм',
    description: 'Длинное пехотное копье длиной более 3 метров с досягаемостью 10 футов.'
  },
  {
    name: 'Рапира',
    category: 'Воинское рукопашное',
    damageDice: '1d8',
    damageType: 'колющий',
    properties: ['Фехтовальное'],
    finesse: true,
    weight: '2 фнт.',
    cost: '25 зм',
    description: 'Длинный гибкий колющий клинок. Позволяет наносить 1d8 урона, используя Ловкость.'
  },
  {
    name: 'Скимитар',
    category: 'Воинское рукопашное',
    damageDice: '1d6',
    damageType: 'рубящий',
    properties: ['Фехтовальное', 'Легкое'],
    finesse: true,
    weight: '3 фнт.',
    cost: '25 зм',
    description: 'Изогнутая сабля восточного типа. Отлично подходит для стиля с двумя клинками.'
  },
  {
    name: 'Трезубец',
    category: 'Воинское рукопашное',
    damageDice: '1d6',
    damageType: 'колющий',
    properties: ['Метательное (дист. 20/60)', 'Универсальное (1d8)'],
    versatileDice: '1d8',
    rangeNormal: 20,
    rangeLong: 60,
    weight: '4 фнт.',
    cost: '5 зм',
    description: 'Трезубое копье гладиаторов и морских воинов.'
  },
  {
    name: 'Цеп',
    category: 'Воинское рукопашное',
    damageDice: '1d8',
    damageType: 'дробящий',
    properties: [],
    weight: '2 фнт.',
    cost: '10 зм',
    description: 'Шипастый шар, соединенный с рукоятью цепью. Позволяет огибать щиты противника.'
  },

  // ── Воинское дальнобойное оружие ──
  {
    name: 'Длинный лук',
    category: 'Воинское дальнобойное',
    damageDice: '1d8',
    damageType: 'колющий',
    properties: ['Боеприпас (дист. 150/600)', 'Тяжелое', 'Двуручное'],
    rangeNormal: 150,
    rangeLong: 600,
    weight: '2 фнт.',
    cost: '50 зм',
    description: 'Большой лук из тиса или ясеня. Позволяет вести прицельную стрельбу на расстояние до 600 футов.'
  },
  {
    name: 'Тяжелый арбалет',
    category: 'Воинское дальнобойное',
    damageDice: '1d10',
    damageType: 'колющий',
    properties: ['Боеприпас (дист. 100/400)', 'Тяжелое', 'Зарядка', 'Двуручное'],
    rangeNormal: 100,
    rangeLong: 400,
    weight: '18 фнт.',
    cost: '50 зм',
    description: 'Мощный арбалет с воротом. Наносит колоссальный 1d10 колющий урон, но требует зарядки.'
  },
  {
    name: 'Ручной арбалет',
    category: 'Воинское дальнобойное',
    damageDice: '1d6',
    damageType: 'колющий',
    properties: ['Боеприпас (дист. 30/120)', 'Легкое', 'Зарядка'],
    rangeNormal: 30,
    rangeLong: 120,
    weight: '3 фнт.',
    cost: '75 зм',
    description: 'Миниатюрный одноручный арбалет. Популярен среди плутов и охотников с чертой «Меткий стрелок».'
  },
  {
    name: 'Духовая трубка',
    category: 'Воинское дальнобойное',
    damageDice: '1',
    damageType: 'колющий',
    properties: ['Боеприпас (дист. 25/100)', 'Зарядка'],
    rangeNormal: 25,
    rangeLong: 100,
    weight: '1 фнт.',
    cost: '10 зм',
    description: 'Трубка для бесшумного выдувания отравленных игл.'
  },
  {
    name: 'Сеть',
    category: 'Воинское дальнобойное',
    damageDice: '0',
    damageType: 'дробящий',
    properties: ['Метательное (дист. 5/15)', 'Особое'],
    rangeNormal: 5,
    rangeLong: 15,
    weight: '3 фнт.',
    cost: '1 зм',
    description: 'Особое оружие: при попадании опутывает существо Большого или меньшего размера (состояние Опутан).'
  },
  {
    name: 'Безоружный удар',
    category: 'Простое рукопашное',
    damageDice: '1',
    damageType: 'дробящий',
    properties: [],
    weight: '0 фнт.',
    cost: '0 зм',
    description: 'Удар кулаком, ногой или головой (1 + мод. Силы). Монахи используют кость боевых искусств (1d4–1d10).'
  }
];

export function findWeaponByName(name: string): DndWeapon | undefined {
  if (!name) return undefined;
  const clean = name.trim().toLowerCase();
  return DND_WEAPONS.find(w => w.name.toLowerCase() === clean || clean.startsWith(w.name.toLowerCase()) || w.name.toLowerCase().startsWith(clean));
}
