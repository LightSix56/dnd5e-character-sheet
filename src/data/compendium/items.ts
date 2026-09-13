// D&D 5e Items, Armors and Weapons Compendium
import { DND_WEAPONS, weaponToCompendiumItem, findWeaponByName, type DndWeapon } from '../dnd-weapons';

export { DND_WEAPONS, findWeaponByName, type DndWeapon };

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
    damageType: 'колющий' | 'рубящий' | 'дробящий' | 'особое';
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

export const DND_WEAPON_COMPENDIUM_ITEMS: CompendiumItem[] = DND_WEAPONS.map(weaponToCompendiumItem);

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
  ...DND_WEAPON_COMPENDIUM_ITEMS,
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
  const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').trim();
  const q = norm(query);

  // 1. Direct exact match on name or nameEn
  let found = DND_COMPENDIUM_ITEMS.find(it => 
    norm(it.name) === q || 
    (it.nameEn && norm(it.nameEn) === q)
  );
  if (found) return found;

  // 2. Weapon lookup with aliases and normalized variations
  const matchedWeapon = findWeaponByName(query);
  if (matchedWeapon) {
    found = DND_COMPENDIUM_ITEMS.find(it => it.category === 'Оружие' && it.name === matchedWeapon.name);
    if (found) return found;
  }

  // 3. Words subset match
  const words = q.split(/[\s,]+/).filter(w => w.length > 2);
  if (words.length > 0) {
    found = DND_COMPENDIUM_ITEMS.find(it => {
      const itNorm = norm(it.name);
      return words.every(word => itNorm.includes(word));
    });
    if (found) return found;
  }

  // 4. Substring match
  return DND_COMPENDIUM_ITEMS.find(it => {
    const itNorm = norm(it.name);
    return q.includes(itNorm) || itNorm.includes(q);
  });
}

export function getArmorItems(): CompendiumItem[] {
  return DND_COMPENDIUM_ITEMS.filter(it => it.category === 'Доспех' || it.category === 'Щит');
}

export function getWeaponItems(): CompendiumItem[] {
  return DND_COMPENDIUM_ITEMS.filter(it => it.category === 'Оружие');
}
