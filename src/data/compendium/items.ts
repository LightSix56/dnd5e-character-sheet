// D&D 5e Items, Armors and Weapons Compendium

export interface CompendiumItem {
  name: string;
  nameEn?: string;
  category: 'Оружие' | 'Доспех' | 'Щит' | 'Снаряжение' | 'Зелье' | 'Магический предмет' | 'Инструмент';
  subcategory?: string;
  cost?: string;
  weight?: string;
  description: string;
  weapon?: {
    category: 'Простое рукопашное' | 'Простое дальнобойное' | 'Воинское рукопашное' | 'Воинское дальнобойное';
    damageDice: string;
    damageType: 'колющий' | 'рубящий' | 'дробящий';
    properties: string[];
    finesse?: boolean;
    versatileDice?: string;
    rangeNormal?: number;
    rangeLong?: number;
  };
  armor?: {
    category: 'Лёгкий доспех' | 'Средний доспех' | 'Тяжёлый доспех' | 'Щит';
    baseAC: number;
    dexBonus: boolean;
    maxDexBonus?: number;
    strMinimum?: number;
    stealthDisadvantage?: boolean;
  };
}

export const DND_COMPENDIUM_ITEMS: CompendiumItem[] = [
  {
    "name": "Стеганый доспех",
    "nameEn": "Padded Armor",
    "category": "Доспех",
    "subcategory": "Лёгкий доспех",
    "cost": "5 зм",
    "weight": "8 фнт.",
    "description": "Стеганый доспех состоит из слоев простеганной ткани и ватина. Создает помеху при проверках Скрытности.",
    "armor": {
      "category": "Лёгкий доспех",
      "baseAC": 11,
      "dexBonus": true,
      "stealthDisadvantage": true,
      "strMinimum": 0
    }
  },
  {
    "name": "Кожаный доспех",
    "nameEn": "Leather Armor",
    "category": "Доспех",
    "subcategory": "Лёгкий доспех",
    "cost": "10 зм",
    "weight": "10 фнт.",
    "description": "Нагрудник и плечи этого доспеха изготовлены из кожи, вываренной в масле. Остальная часть доспеха сделана из более мягких и гибких материалов.",
    "armor": {
      "category": "Лёгкий доспех",
      "baseAC": 11,
      "dexBonus": true,
      "stealthDisadvantage": false,
      "strMinimum": 0
    }
  },
  {
    "name": "Проклепанный кожаный доспех",
    "nameEn": "Studded Leather Armor",
    "category": "Доспех",
    "subcategory": "Лёгкий доспех",
    "cost": "45 зм",
    "weight": "13 фнт.",
    "description": "Сделанный из прочной, но гибкой кожи, этот доспех усилен клепками или заклепками из металла.",
    "armor": {
      "category": "Лёгкий доспех",
      "baseAC": 12,
      "dexBonus": true,
      "stealthDisadvantage": false,
      "strMinimum": 0
    }
  },
  {
    "name": "Шкурный доспех",
    "nameEn": "Hide Armor",
    "category": "Доспех",
    "subcategory": "Средний доспех",
    "cost": "10 зм",
    "weight": "12 фнт.",
    "description": "Грубый доспех из толстых звериных шкур. Часто используется варварами и друидами.",
    "armor": {
      "category": "Средний доспех",
      "baseAC": 12,
      "dexBonus": true,
      "maxDexBonus": 2,
      "stealthDisadvantage": false,
      "strMinimum": 0
    }
  },
  {
    "name": "Кольчужная рубаха",
    "nameEn": "Chain Shirt",
    "category": "Доспех",
    "subcategory": "Средний доспех",
    "cost": "50 зм",
    "weight": "20 фнт.",
    "description": "Сделана из переплетенных металлических колец. Надевается между слоями одежды или ткани.",
    "armor": {
      "category": "Средний доспех",
      "baseAC": 13,
      "dexBonus": true,
      "maxDexBonus": 2,
      "stealthDisadvantage": false,
      "strMinimum": 0
    }
  },
  {
    "name": "Чешуйчатый доспех",
    "nameEn": "Scale Mail",
    "category": "Доспех",
    "subcategory": "Средний доспех",
    "cost": "50 зм",
    "weight": "45 фнт.",
    "description": "Состоит из кожаной куртки и поножей, покрытых перекрывающимися кусочками металла. Создает помеху на Скрытность.",
    "armor": {
      "category": "Средний доспех",
      "baseAC": 14,
      "dexBonus": true,
      "maxDexBonus": 2,
      "stealthDisadvantage": true,
      "strMinimum": 0
    }
  },
  {
    "name": "Кираса",
    "nameEn": "Breastplate",
    "category": "Доспех",
    "subcategory": "Средний доспех",
    "cost": "400 зм",
    "weight": "20 фнт.",
    "description": "Металлический нагрудник с кожаной подкладкой. Оставляет руки и ноги свободными, не создает помех на скрытность.",
    "armor": {
      "category": "Средний доспех",
      "baseAC": 14,
      "dexBonus": true,
      "maxDexBonus": 2,
      "stealthDisadvantage": false,
      "strMinimum": 0
    }
  },
  {
    "name": "Полулаты",
    "nameEn": "Half Plate Armor",
    "category": "Доспех",
    "subcategory": "Средний доспех",
    "cost": "750 зм",
    "weight": "40 фнт.",
    "description": "Металлические пластины закрывают большую часть тела. Создает помеху на Скрытность.",
    "armor": {
      "category": "Средний доспех",
      "baseAC": 15,
      "dexBonus": true,
      "maxDexBonus": 2,
      "stealthDisadvantage": true,
      "strMinimum": 0
    }
  },
  {
    "name": "Колечный доспех",
    "nameEn": "Ring Mail",
    "category": "Доспех",
    "subcategory": "Тяжёлый доспех",
    "cost": "30 зм",
    "weight": "40 фнт.",
    "description": "Кожаный доспех с нашитыми тяжелыми кольцами. Создает помеху на Скрытность.",
    "armor": {
      "category": "Тяжёлый доспех",
      "baseAC": 14,
      "dexBonus": false,
      "stealthDisadvantage": true,
      "strMinimum": 0
    }
  },
  {
    "name": "Кольчуга",
    "nameEn": "Chain Mail",
    "category": "Доспех",
    "subcategory": "Тяжёлый доспех",
    "cost": "75 зм",
    "weight": "55 фнт.",
    "description": "Полный доспех из переплетенных металлических колец. Требует СИЛ 13, помеха на Скрытность.",
    "armor": {
      "category": "Тяжёлый доспех",
      "baseAC": 16,
      "dexBonus": false,
      "stealthDisadvantage": true,
      "strMinimum": 13
    }
  },
  {
    "name": "Наборный доспех",
    "nameEn": "Splint Armor",
    "category": "Доспех",
    "subcategory": "Тяжёлый доспех",
    "cost": "200 зм",
    "weight": "60 фнт.",
    "description": "Вертикальные полосы металла, приклепанные к кожаной основе. Требует СИЛ 15, помеха на Скрытность.",
    "armor": {
      "category": "Тяжёлый доспех",
      "baseAC": 17,
      "dexBonus": false,
      "stealthDisadvantage": true,
      "strMinimum": 15
    }
  },
  {
    "name": "Латы",
    "nameEn": "Plate Armor",
    "category": "Доспех",
    "subcategory": "Тяжёлый доспех",
    "cost": "1500 зм",
    "weight": "65 фнт.",
    "description": "Полные металлические латы высшего качества. Требуют СИЛ 15, дают КД 18, помеха на Скрытность.",
    "armor": {
      "category": "Тяжёлый доспех",
      "baseAC": 18,
      "dexBonus": false,
      "stealthDisadvantage": true,
      "strMinimum": 15
    }
  },
  {
    "name": "Щит",
    "nameEn": "Shield",
    "category": "Щит",
    "subcategory": "Щит",
    "cost": "10 зм",
    "weight": "6 фнт.",
    "description": "Деревянный или металлический щит. Надевается на одну руку и дает +2 к КД.",
    "armor": {
      "category": "Щит",
      "baseAC": 2,
      "dexBonus": false,
      "stealthDisadvantage": false,
      "strMinimum": 0
    }
  },
  {
    "name": "Боевой посох",
    "nameEn": "Quarterstaff",
    "category": "Оружие",
    "subcategory": "Простое рукопашное",
    "cost": "2 см",
    "weight": "4 фнт.",
    "description": "Деревянный посох. Универсальное (1d8).",
    "weapon": {
      "category": "Простое рукопашное",
      "damageDice": "1d6",
      "damageType": "дробящий",
      "properties": [
        "Универсальное (1d8)"
      ],
      "versatileDice": "1d8"
    }
  },
  {
    "name": "Булава",
    "nameEn": "Mace",
    "category": "Оружие",
    "subcategory": "Простое рукопашное",
    "cost": "5 зм",
    "weight": "4 фнт.",
    "description": "Тяжелое ударное оружие.",
    "weapon": {
      "category": "Простое рукопашное",
      "damageDice": "1d6",
      "damageType": "дробящий",
      "properties": []
    }
  },
  {
    "name": "Дубинка",
    "nameEn": "Club",
    "category": "Оружие",
    "subcategory": "Простое рукопашное",
    "cost": "1 см",
    "weight": "2 фнт.",
    "description": "Простая дубинка. Легкое.",
    "weapon": {
      "category": "Простое рукопашное",
      "damageDice": "1d4",
      "damageType": "дробящий",
      "properties": [
        "Легкое"
      ]
    }
  },
  {
    "name": "Кинжал",
    "nameEn": "Dagger",
    "category": "Оружие",
    "subcategory": "Простое рукопашное",
    "cost": "2 зм",
    "weight": "1 фнт.",
    "description": "Острое короткое лезвие. Фехтовальное, легкое, метательное (20/60).",
    "weapon": {
      "category": "Простое рукопашное",
      "damageDice": "1d4",
      "damageType": "колющий",
      "properties": [
        "Фехтовальное",
        "Легкое",
        "Метательное (дист. 20/60)"
      ],
      "finesse": true,
      "rangeNormal": 20,
      "rangeLong": 60
    }
  },
  {
    "name": "Копье",
    "nameEn": "Spear",
    "category": "Оружие",
    "subcategory": "Простое рукопашное",
    "cost": "1 зм",
    "weight": "3 фнт.",
    "description": "Длинное древко с наконечником. Метательное (20/60), универсальное (1d8).",
    "weapon": {
      "category": "Простое рукопашное",
      "damageDice": "1d6",
      "damageType": "колющий",
      "properties": [
        "Метательное (дист. 20/60)",
        "Универсальное (1d8)"
      ],
      "versatileDice": "1d8",
      "rangeNormal": 20,
      "rangeLong": 60
    }
  },
  {
    "name": "Легкий молот",
    "nameEn": "Light Hammer",
    "category": "Оружие",
    "subcategory": "Простое рукопашное",
    "cost": "2 зм",
    "weight": "2 фнт.",
    "description": "Компактный молот. Легкое, метательное (20/60).",
    "weapon": {
      "category": "Простое рукопашное",
      "damageDice": "1d4",
      "damageType": "дробящий",
      "properties": [
        "Легкое",
        "Метательное (дист. 20/60)"
      ],
      "rangeNormal": 20,
      "rangeLong": 60
    }
  },
  {
    "name": "Метательное копье",
    "nameEn": "Javelin",
    "category": "Оружие",
    "subcategory": "Простое рукопашное",
    "cost": "5 см",
    "weight": "2 фнт.",
    "description": "Облегченное копье для метания (30/120).",
    "weapon": {
      "category": "Простое рукопашное",
      "damageDice": "1d6",
      "damageType": "колющий",
      "properties": [
        "Метательное (дист. 30/120)"
      ],
      "rangeNormal": 30,
      "rangeLong": 120
    }
  },
  {
    "name": "Палица",
    "nameEn": "Greatclub",
    "category": "Оружие",
    "subcategory": "Простое рукопашное",
    "cost": "2 см",
    "weight": "10 фнт.",
    "description": "Тяжелая двуручная дубина.",
    "weapon": {
      "category": "Простое рукопашное",
      "damageDice": "1d8",
      "damageType": "дробящий",
      "properties": [
        "Двуручное"
      ]
    }
  },
  {
    "name": "Ручной топор",
    "nameEn": "Handaxe",
    "category": "Оружие",
    "subcategory": "Простое рукопашное",
    "cost": "5 зм",
    "weight": "2 фнт.",
    "description": "Удобный топор. Легкое, метательное (20/60).",
    "weapon": {
      "category": "Простое рукопашное",
      "damageDice": "1d6",
      "damageType": "рубящий",
      "properties": [
        "Легкое",
        "Метательное (дист. 20/60)"
      ],
      "rangeNormal": 20,
      "rangeLong": 60
    }
  },
  {
    "name": "Серп",
    "nameEn": "Sickle",
    "category": "Оружие",
    "subcategory": "Простое рукопашное",
    "cost": "1 зм",
    "weight": "2 фнт.",
    "description": "Изогнутый клинок. Легкое.",
    "weapon": {
      "category": "Простое рукопашное",
      "damageDice": "1d4",
      "damageType": "рубящий",
      "properties": [
        "Легкое"
      ]
    }
  },
  {
    "name": "Дротик",
    "nameEn": "Dart",
    "category": "Оружие",
    "subcategory": "Простое дальнобойное",
    "cost": "5 мм",
    "weight": "1/4 фнт.",
    "description": "Метательное фехтовальное острие (20/60).",
    "weapon": {
      "category": "Простое дальнобойное",
      "damageDice": "1d4",
      "damageType": "колющий",
      "properties": [
        "Фехтовальное",
        "Метательное (дист. 20/60)"
      ],
      "finesse": true,
      "rangeNormal": 20,
      "rangeLong": 60
    }
  },
  {
    "name": "Короткий лук",
    "nameEn": "Shortbow",
    "category": "Оружие",
    "subcategory": "Простое дальнобойное",
    "cost": "25 зм",
    "weight": "2 фнт.",
    "description": "Двуручный лук (80/320).",
    "weapon": {
      "category": "Простое дальнобойное",
      "damageDice": "1d6",
      "damageType": "колющий",
      "properties": [
        "Боеприпас (дист. 80/320)",
        "Двуручное"
      ],
      "rangeNormal": 80,
      "rangeLong": 320
    }
  },
  {
    "name": "Легкий арбалет",
    "nameEn": "Light Crossbow",
    "category": "Оружие",
    "subcategory": "Простое дальнобойное",
    "cost": "25 зм",
    "weight": "5 фнт.",
    "description": "Простой арбалет (80/320). Перезарядка, двуручное.",
    "weapon": {
      "category": "Простое дальнобойное",
      "damageDice": "1d8",
      "damageType": "колющий",
      "properties": [
        "Боеприпас (дист. 80/320)",
        "Перезарядка",
        "Двуручное"
      ],
      "rangeNormal": 80,
      "rangeLong": 320
    }
  },
  {
    "name": "Праща",
    "nameEn": "Sling",
    "category": "Оружие",
    "subcategory": "Простое дальнобойное",
    "cost": "1 см",
    "weight": "-",
    "description": "Метает камни или пули на 30/120 фт.",
    "weapon": {
      "category": "Простое дальнобойное",
      "damageDice": "1d4",
      "damageType": "дробящий",
      "properties": [
        "Боеприпас (дист. 30/120)"
      ],
      "rangeNormal": 30,
      "rangeLong": 120
    }
  },
  {
    "name": "Алебарда",
    "nameEn": "Halberd",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "20 зм",
    "weight": "6 фнт.",
    "description": "Длинное древковое оружие. Тяжелое, досягаемость, двуручное.",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d10",
      "damageType": "рубящий",
      "properties": [
        "Тяжелое",
        "Досягаемость",
        "Двуручное"
      ]
    }
  },
  {
    "name": "Боевой молот",
    "nameEn": "Warhammer",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "15 зм",
    "weight": "2 фнт.",
    "description": "Универсальный тяжелый молот (1d10 в двух руках).",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d8",
      "damageType": "дробящий",
      "properties": [
        "Универсальное (1d10)"
      ],
      "versatileDice": "1d10"
    }
  },
  {
    "name": "Боевой топор",
    "nameEn": "Battleaxe",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "10 зм",
    "weight": "4 фнт.",
    "description": "Классический топор воинов. Универсальное (1d10).",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d8",
      "damageType": "рубящий",
      "properties": [
        "Универсальное (1d10)"
      ],
      "versatileDice": "1d10"
    }
  },
  {
    "name": "Глефа",
    "nameEn": "Glaive",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "20 зм",
    "weight": "6 фнт.",
    "description": "Длинное рубящее лезвие на древке. Тяжелое, досягаемость, двуручное.",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d10",
      "damageType": "рубящий",
      "properties": [
        "Тяжелое",
        "Досягаемость",
        "Двуручное"
      ]
    }
  },
  {
    "name": "Двуручный меч",
    "nameEn": "Greatsword",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "50 зм",
    "weight": "6 фнт.",
    "description": "Огромный двуручный клинок (2d6). Тяжелое, двуручное.",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "2d6",
      "damageType": "рубящий",
      "properties": [
        "Тяжелое",
        "Двуручное"
      ]
    }
  },
  {
    "name": "Двуручный топор",
    "nameEn": "Greataxe",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "30 зм",
    "weight": "7 фнт.",
    "description": "Массивный топор (1d12). Любимое оружие варваров.",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d12",
      "damageType": "рубящий",
      "properties": [
        "Тяжелое",
        "Двуручное"
      ]
    }
  },
  {
    "name": "Длинный меч",
    "nameEn": "Longsword",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "15 зм",
    "weight": "3 фнт.",
    "description": "Рыцарский меч. Универсальное (1d10).",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d8",
      "damageType": "рубящий",
      "properties": [
        "Универсальное (1d10)"
      ],
      "versatileDice": "1d10"
    }
  },
  {
    "name": "Короткий меч",
    "nameEn": "Shortsword",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "10 зм",
    "weight": "2 фнт.",
    "description": "Быстрый колющий клинок. Фехтовальное, легкое.",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d6",
      "damageType": "колющий",
      "properties": [
        "Фехтовальное",
        "Легкое"
      ],
      "finesse": true
    }
  },
  {
    "name": "Молот (Кувалда)",
    "nameEn": "Maul",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "10 зм",
    "weight": "10 фнт.",
    "description": "Тяжелый двуручный молот (2d6). Двуручное, тяжелое.",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "2d6",
      "damageType": "дробящий",
      "properties": [
        "Тяжелое",
        "Двуручное"
      ]
    }
  },
  {
    "name": "Моргенштерн",
    "nameEn": "Morningstar",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "15 зм",
    "weight": "4 фнт.",
    "description": "Шипастое ударное оружие.",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d8",
      "damageType": "колющий",
      "properties": []
    }
  },
  {
    "name": "Пика",
    "nameEn": "Pike",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "5 зм",
    "weight": "18 фнт.",
    "description": "Сверхдлинное копье (1d10). Тяжелое, досягаемость, двуручное.",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d10",
      "damageType": "колющий",
      "properties": [
        "Тяжелое",
        "Досягаемость",
        "Двуручное"
      ]
    }
  },
  {
    "name": "Рапира",
    "nameEn": "Rapier",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "25 зм",
    "weight": "2 фнт.",
    "description": "Изящный клинок дуэлянтов (1d8). Фехтовальное.",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d8",
      "damageType": "колющий",
      "properties": [
        "Фехтовальное"
      ],
      "finesse": true
    }
  },
  {
    "name": "Скимитар",
    "nameEn": "Scimitar",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "25 зм",
    "weight": "3 фнт.",
    "description": "Изогнутая сабля. Фехтовальное, легкое.",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d6",
      "damageType": "рубящий",
      "properties": [
        "Фехтовальное",
        "Легкое"
      ],
      "finesse": true
    }
  },
  {
    "name": "Трезубец",
    "nameEn": "Trident",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "5 зм",
    "weight": "4 фнт.",
    "description": "Трезубое копье. Метательное (20/60), универсальное (1d8).",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d6",
      "damageType": "колющий",
      "properties": [
        "Метательное (дист. 20/60)",
        "Универсальное (1d8)"
      ],
      "versatileDice": "1d8",
      "rangeNormal": 20,
      "rangeLong": 60
    }
  },
  {
    "name": "Цеп",
    "nameEn": "Flail",
    "category": "Оружие",
    "subcategory": "Воинское рукопашное",
    "cost": "10 зм",
    "weight": "2 фнт.",
    "description": "Шар с шипами на цепи.",
    "weapon": {
      "category": "Воинское рукопашное",
      "damageDice": "1d8",
      "damageType": "дробящий",
      "properties": []
    }
  },
  {
    "name": "Длинный лук",
    "nameEn": "Longbow",
    "category": "Оружие",
    "subcategory": "Воинское дальнобойное",
    "cost": "50 зм",
    "weight": "2 фнт.",
    "description": "Большой боевой лук (150/600). Тяжелое, двуручное.",
    "weapon": {
      "category": "Воинское дальнобойное",
      "damageDice": "1d8",
      "damageType": "колющий",
      "properties": [
        "Боеприпас (дист. 150/600)",
        "Тяжелое",
        "Двуручное"
      ],
      "rangeNormal": 150,
      "rangeLong": 600
    }
  },
  {
    "name": "Ручной арбалет",
    "nameEn": "Hand Crossbow",
    "category": "Оружие",
    "subcategory": "Воинское дальнобойное",
    "cost": "75 зм",
    "weight": "3 фнт.",
    "description": "Одноручный компактный арбалет (30/120). Легкое, перезарядка.",
    "weapon": {
      "category": "Воинское дальнобойное",
      "damageDice": "1d6",
      "damageType": "колющий",
      "properties": [
        "Боеприпас (дист. 30/120)",
        "Легкое",
        "Перезарядка"
      ],
      "rangeNormal": 30,
      "rangeLong": 120
    }
  },
  {
    "name": "Тяжелый арбалет",
    "nameEn": "Heavy Crossbow",
    "category": "Оружие",
    "subcategory": "Воинское дальнобойное",
    "cost": "50 зм",
    "weight": "18 фнт.",
    "description": "Мощный арбалет (100/400, 1d10). Тяжелое, перезарядка, двуручное.",
    "weapon": {
      "category": "Воинское дальнобойное",
      "damageDice": "1d10",
      "damageType": "колющий",
      "properties": [
        "Боеприпас (дист. 100/400)",
        "Тяжелое",
        "Перезарядка",
        "Двуручное"
      ],
      "rangeNormal": 100,
      "rangeLong": 400
    }
  },
  {
    "name": "Зелье лечения",
    "nameEn": "Potion of Healing",
    "category": "Зелье",
    "cost": "50 зм",
    "weight": "0.5 фнт.",
    "description": "Персонаж выпивает зелье и восстанавливает 2d4 + 2 хитов. Жидкость мерцает рубиновым цветом."
  },
  {
    "name": "Зелье большего лечения",
    "nameEn": "Potion of Greater Healing",
    "category": "Зелье",
    "cost": "150 зм",
    "weight": "0.5 фнт.",
    "description": "Восстанавливает 4d4 + 4 хитов."
  },
  {
    "name": "Зелье отличного лечения",
    "nameEn": "Potion of Superior Healing",
    "category": "Зелье",
    "cost": "500 зм",
    "weight": "0.5 фнт.",
    "description": "Восстанавливает 8d4 + 8 хитов."
  },
  {
    "name": "Зелье превосходного лечения",
    "nameEn": "Potion of Supreme Healing",
    "category": "Зелье",
    "cost": "1350 зм",
    "weight": "0.5 фнт.",
    "description": "Восстанавливает 10d4 + 20 хитов."
  },
  {
    "name": "Сумка хранения",
    "nameEn": "Bag of Holding",
    "category": "Магический предмет",
    "cost": "500 зм",
    "weight": "15 фнт.",
    "description": "Вместимость до 500 фунтов веса и 64 кубических футов объема, независимо от реального веса внутри."
  },
  {
    "name": "Плащ защиты",
    "nameEn": "Cloak of Protection",
    "category": "Магический предмет",
    "cost": "400 зм",
    "weight": "1 фнт.",
    "description": "Дает +1 к Классу Доспеха и всем спасброскам при настройке."
  },
  {
    "name": "Набор путешественника",
    "nameEn": "Explorer's Pack",
    "category": "Снаряжение",
    "cost": "10 зм",
    "weight": "59 фнт.",
    "description": "Рюкзак, спальник, столовый набор, трутница, 10 факелов, 10 дней пайков, бурдюк, 50 фт пеньковой веревки."
  },
  {
    "name": "Набор подземелий",
    "nameEn": "Dungeoneer's Pack",
    "category": "Снаряжение",
    "cost": "12 зм",
    "weight": "61.5 фнт.",
    "description": "Рюкзак, лом, молоток, 10 колышков, 10 факелов, трутница, 10 дней пайков, бурдюк, 50 фт веревки."
  },
  {
    "name": "Набор вора",
    "nameEn": "Thieves' Tools",
    "category": "Инструмент",
    "cost": "25 зм",
    "weight": "1 фнт.",
    "description": "Отмычки, зеркальце на стержне, напильник, щипчики. Необходим для взлома замков и деактивации ловушек."
  },
  {
    "name": "Святой символ",
    "nameEn": "Holy Symbol",
    "category": "Снаряжение",
    "cost": "5 зм",
    "weight": "1 фнт.",
    "description": "Амулет, эмблема или реликварий. Служит заклинательной фокусировкой для жрецов и паладинов."
  },
  {
    "name": "Магическая фокусировка (Посох)",
    "nameEn": "Arcane Focus (Staff)",
    "category": "Снаряжение",
    "cost": "5 зм",
    "weight": "4 фнт.",
    "description": "Особый предмет для сотворения волшебных заклинаний волшебников, чародеев и колдунов."
  }
];

export function findItemByName(query: string): CompendiumItem | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  return DND_COMPENDIUM_ITEMS.find(it => 
    it.name.toLowerCase() === q || 
    (it.nameEn && it.nameEn.toLowerCase() === q)
  );
}

export function getArmorItems(): CompendiumItem[] {
  return DND_COMPENDIUM_ITEMS.filter(it => it.category === 'Доспех' || it.category === 'Щит');
}

export function getWeaponItems(): CompendiumItem[] {
  return DND_COMPENDIUM_ITEMS.filter(it => it.category === 'Оружие');
}
