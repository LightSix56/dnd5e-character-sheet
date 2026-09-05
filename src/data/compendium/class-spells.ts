// D&D 5e Class & Subclass Spell Access Rules and Verification
// Accurately enforces spell lists for all 13 classes, subclasses (Domains, Patrons, Oaths, Circles, etc.),
// as well as Feats (Magic Initiate, Fey Touched, Shadow Touched, Ritual Caster) and Races.

import type { CharacterData } from '@/lib/dnd-types';
import { DND_COMPENDIUM_SPELLS, findSpellByName, type DndSpell } from './spells';
import { getRacialFeaturesForLevel } from './race-progression';
import { getSpellSlotsForClassLevel } from './class-progression';

// ── Subclass Expanded / Bonus Spell Lists ──
// Subclasses granting spells not normally on their class list or granting prepared spells
export const SUBCLASS_EXPANDED_SPELLS: Record<string, string[]> = {
  // ── ЖРЕЦ: Домены ──
  'домен жизни': [
    'Благословение', 'Лечащее слово', 'Духовное оружие', 'Малое восстановление',
    'Возрождение', 'Маяк надежды', 'Защита от смерти', 'Страж веры',
    'Массовое лечащее слово', 'Воскрешение'
  ],
  'домен света': [
    'Пылающие руки', 'Огонь фей', 'Палящий луч', 'Сфера огня',
    'Дневной свет', 'Огненный шар', 'Огненный щит', 'Страж веры',
    'Огненная буря', 'Освящение'
  ],
  'домен бури': [
    'Громовая волна', 'Туманное облако', 'Порыв ветра', 'Раскаленный металл',
    'Призыв молнии', 'Метель', 'Контроль воды', 'Ледяная буря',
    'Волна разрушения', 'Насекомые'
  ],
  'домен обмана': [
    'Очарование личности', 'Маскировка', 'Зеркальное отражение', 'Невидимость',
    'Мерцание', 'Нерассекаемый узор', 'Дверь в измерения', 'Изменение формы',
    'Обманный приказ', 'Модификация памяти'
  ],
  'домен войны': [
    'Божественное благоволение', 'Щит веры', 'Духовное оружие', 'Магическое оружие',
    'Мантия крестоносца', 'Духовные стражи', 'Свобода движений', 'Каменная кожа',
    'Волна разрушения', 'Удержание чудовища'
  ],
  'домен природы': [
    'Дружба с животными', 'Общение с животными', 'Дубовая кожа', 'Шипы',
    'Рост растений', 'Древесный путь', 'Подчинение зверю', 'Хватка лозы',
    'Насекомые', 'Древесный переход'
  ],
  'домен знания': [
    'Приказ', 'Опознание', 'Обнаружение мыслей', 'Внушение',
    'Ясновидение', 'Необнаружимость', 'Тайный сундук Леомунда', 'Определение местоположения существа',
    'Легенды и предания', 'Знание предков'
  ],
  'домен смерти': [
    'Ложное благочестие', 'Луч болезни', 'Слепота/глухота', 'Луч слабости',
    'Оживление мертвецов', 'Прикосновение вампира', 'Ослепляющая вспышка', 'Увядание',
    'Облако смерти', 'Заразное касание'
  ],
  'домен кузни': [
    'Огонь фей', 'Огненное возмездие', 'Раскаленный металл', 'Магическое оружие',
    'Элементальное оружие', 'Защита от стихий', 'Огненный щит', 'Изготовление',
    'Оживить предмет', 'Огненный удар'
  ],
  'домен сумерек': [
    'Огонь фей', 'Сон', 'Лунный луч', 'Видение невидимого',
    'Аура жизненной силы', 'Крошечная хижина Леомунда', 'Аура жизни', 'Высшая невидимость',
    'Круг силы', 'Перерождение'
  ],
  'домен упокоения': [
    'Ложное благочестие', 'Убежище', 'Ослепляющая кара', 'Покой предков',
    'Разговор с мертвыми', 'Призрачный страж', 'Защита от смерти', 'Увядание',
    'Оживить', 'Облако смерти'
  ],

  // ── КОЛДУН: Покровители ──
  'исчадие': [
    'Пылающие руки', 'Командное слово', 'Слепота/глухота', 'Палящий луч',
    'Огненный шар', 'Вонючее облако', 'Огненный щит', 'Стена огня',
    'Огненный удар', 'Освящение'
  ],
  'архифея': [
    'Огонь фей', 'Сон', 'Слепота/глухота', 'Спокойствие',
    'Мерцание', 'Рост растений', 'Доминирование над зверем', 'Дверь в измерения',
    'Обманный приказ', 'Подчинение гуманоида'
  ],
  'великий древний': [
    'Диссонирующий шепот', 'Смех Таши', 'Обнаружение мыслей', 'Фантасмагорическая сила',
    'Ясновидение', 'Послание', 'Доминирование над зверем', 'Черные щупальца Эварда',
    'Доминирование над персоной', 'Телекинез'
  ],
  'небожитель': [
    'Лечащее слово', 'Направляющий луч', 'Огненное пламя', 'Малое восстановление',
    'Дневной свет', 'Возрождение', 'Страж веры', 'Стена огня',
    'Огненный удар', 'Высшее восстановление'
  ],
  'ведьмовской клинок': [
    'Щит', 'Гневная кара', 'Размытый образ', 'Клеймящая кара',
    'Мерцание', 'Элементальное оружие', 'Доспехи ужаса', 'Ошеломляющая кара',
    'Изгнание', 'Конус холода'
  ],
  'нежить': [
    'Ложное благочестие', 'Луч болезни', 'Слепота/глухота', 'Фантасмагорическая сила',
    'Прикосновение вампира', 'Призрачный клинок', 'Защита от смерти', 'Увядание',
    'Облако смерти', 'Перерождение'
  ],
  'джинн': [
    'Обнаружение магии', 'Пылающие руки', 'Туманное облако', 'Громовая волна',
    'Порыв ветра', 'Раскаленный металл', 'Метель', 'Стена огня',
    'Каменная кожа', 'Стена ветра'
  ],

  // ── ПАЛАДИН: Клятвы ──
  'клятва преданности': [
    'Защита от добра и зла', 'Убежище', 'Малое восстановление', 'Зона правды',
    'Маяк надежды', 'Рассеивание магии', 'Свобода движений', 'Страж веры',
    'Освящение', 'Общение'
  ],
  'клятва древних': [
    'Опутывание', 'Разговор с животными', 'Лунный луч', 'Туманный шаг',
    'Защита от стихий', 'Рост растений', 'Каменная кожа', 'Ледяная буря',
    'Общение с природой', 'Древесный путь'
  ],
  'клятва мести': [
    'Охотничья метка', 'Проклятие', 'Туманный шаг', 'Удержание личности',
    'Ускорение', 'Защита от стихий', 'Изгнание', 'Дверь в измерения',
    'Удержание чудовища', 'Очищение разума'
  ],
  'клятва покорения': [
    'Приказ', 'Броня Агатиса', 'Удержание личности', 'Духовное оружие',
    'Страх', 'Одарение', 'Подчинение зверю', 'Каменная кожа',
    'Облако смерти', 'Подчинение гуманоида'
  ],
  'клятвопреступник': [
    'Адское возмездие', 'Нанесение ран', 'Ослепляющая вспышка', 'Тьма',
    'Оживление мертвецов', 'Зловонное облако', 'Увядание', 'Запугивание',
    'Подчинение гуманоида', 'Заразное касание'
  ],

  // ── ДРУИД: Круги ──
  'круг земли': [
    'Паутина', 'Зеркальное отражение', 'Невидимость', 'Шипы',
    'Огненный шар', 'Молния', 'Дневной свет', 'Газообразность',
    'Каменная кожа', 'Ледяная буря', 'Увядание', 'Свобода движений',
    'Конус холода', 'Облако смерти', 'Стена камня'
  ],
  'круг дикого огня': [
    'Пылающие руки', 'Лечащее слово', 'Пламенный клинок', 'Пылающая сфера',
    'Огненный шар', 'Возрождение', 'Аура жизни', 'Огненный щит',
    'Огненный удар', 'Массовое лечащее слово'
  ],
  'круг спор': [
    'Леденящее прикосновение', 'Ослепляющая вспышка', 'Ослепление/оглушение', 'Разговор с мертвыми',
    'Оживление мертвецов', 'Газообразность', 'Увядание', 'Облако смерти'
  ],

  // ── СЛЕДОПЫТ: Архетипы ──
  'сумрачный охотник': [
    'Маскировка', 'Веревочный фокус', 'Страх', 'Высшая невидимость', 'Обман зрения'
  ],
  'странник горизонта': [
    'Защита от зла и добра', 'Туманный шаг', 'Ускорение', 'Изгнание', 'Круг телепортации'
  ],
  'фейский странник': [
    'Очарование личности', 'Туманный шаг', 'Рассеивание магии', 'Дверь в измерения', 'Обман зрения'
  ],

  // ── ИЗОБРЕТАТЕЛЬ: Специализации ──
  'алхимик': [
    'Лечащее слово', 'Луч болезни', 'Палящий луч', 'Кислотная стрела Мельфа',
    'Газообразность', 'Массовое исцеление', 'Увядание', 'Смертельный туман'
  ],
  'артиллерист': [
    'Щит', 'Громовая волна', 'Палящий луч', 'Разрушительная волна',
    'Огненный шар', 'Ветряная стена', 'Ледяная буря', 'Стена огня', 'Конус холода'
  ],
  'боевой кузнец': [
    'Героизм', 'Щит', 'Бренчащая кара', 'Магическое оружие',
    'Аура жизненной силы', 'Элементальное оружие', 'Огненный щит', 'Аура чистоты',
    'Волна разрушения'
  ]
};

// Subclasses that grant full access to another class's spell list:
export const SUBCLASS_FULL_CLASS_SPELLS: Record<string, string> = {
  'божественная душа': 'Жрец',        // Чародей Божественной Души может брать ЛЮБЫЕ заклинания Жреца
  'мистический рыцарь': 'Волшебник',    // Воин Мистический рыцарь использует список Волшебника
  'мистический ловкач': 'Волшебник',    // Плут Мистический ловкач использует список Волшебника
};

export interface SpellCheckResult {
  allowed: boolean;
  source: 'class' | 'subclass' | 'feat' | 'race' | 'universal' | 'other';
  sourceLabel: string;
  reason?: string;
}

/**
 * Checks if a spell is allowed for a character by their class, subclass, feats, or race.
 */
export function isSpellAllowedForCharacter(char: CharacterData, spell: DndSpell | string): SpellCheckResult {
  const spellObj = typeof spell === 'string' ? findSpellByName(spell) : spell;
  if (!spellObj) {
    return { allowed: true, source: 'other', sourceLabel: 'Пользовательское' };
  }

  const charClass = (char.className || char.spellcastingClass || '').trim().toLowerCase();
  const charSubclass = (char.subclass || '').trim().toLowerCase();

  // 1. Check primary class spell list
  const spellClasses = (spellObj.classes || []).map(c => c.toLowerCase());
  if (charClass && spellClasses.includes(charClass)) {
    const rawClass = spellObj.classes?.find(c => c.toLowerCase() === charClass) || char.className || 'Класс';
    return {
      allowed: true,
      source: 'class',
      sourceLabel: rawClass
    };
  }

  // 1b. Check Bard Magical Secrets (Тайны магии: 10, 14, 18 levels, or Lore Bard at level 6)
  if (charClass.includes('бард') || charClass.includes('bard')) {
    const isLore = charSubclass.includes('знан') || charSubclass.includes('lore');
    if ((char.level || 1) >= 10 || (isLore && (char.level || 1) >= 6)) {
      return {
        allowed: true,
        source: 'class',
        sourceLabel: 'Бард (Тайны магии)'
      };
    }
  }

  // 2. Check full-class inherited subclasses (e.g. Divine Soul -> Cleric, Eldritch Knight -> Wizard, Arcane Trickster -> Wizard)
  if (charSubclass && SUBCLASS_FULL_CLASS_SPELLS[charSubclass]) {
    const inheritedClass = SUBCLASS_FULL_CLASS_SPELLS[charSubclass].toLowerCase();
    if (spellClasses.includes(inheritedClass)) {
      return {
        allowed: true,
        source: 'subclass',
        sourceLabel: `${char.subclass || ''} (${SUBCLASS_FULL_CLASS_SPELLS[charSubclass]})`
      };
    }
  }

  // 3. Check Subclass Expanded Spells (Domains, Patrons, Oaths, Circles, etc.)
  if (charSubclass) {
    for (const [subKey, bonusSpells] of Object.entries(SUBCLASS_EXPANDED_SPELLS)) {
      if (charSubclass.includes(subKey) || subKey.includes(charSubclass)) {
        const found = bonusSpells.some(s => s.toLowerCase() === spellObj.name.toLowerCase() || (spellObj.nameEn && s.toLowerCase() === spellObj.nameEn.toLowerCase()));
        if (found) {
          return {
            allowed: true,
            source: 'subclass',
            sourceLabel: char.subclass || 'Подкласс'
          };
        }
      }
    }
  }

  // 4. Check Feat sources (Magic Initiate, Fey Touched, Shadow Touched, Ritual Caster)
  const traits = char.traitsList || [];
  const traitNames = traits.map(t => t.name.toLowerCase());

  // Fey Touched (Туманный шаг + 1st level Divination/Enchantment)
  if (traitNames.some(t => t.includes('фейский') || t.includes('fey touched'))) {
    if (spellObj.name.toLowerCase() === 'туманный шаг' || (spellObj.level === 1 && (spellObj.school === 'Прорицание' || spellObj.school === 'Очарование'))) {
      return { allowed: true, source: 'feat', sourceLabel: 'Черта: Фейский коснувшийся' };
    }
  }

  // Shadow Touched (Невидимость + 1st level Illusion/Necromancy)
  if (traitNames.some(t => t.includes('теневой') || t.includes('shadow touched'))) {
    if (spellObj.name.toLowerCase() === 'невидимость' || (spellObj.level === 1 && (spellObj.school === 'Иллюзия' || spellObj.school === 'Некромантия'))) {
      return { allowed: true, source: 'feat', sourceLabel: 'Черта: Теневой коснувшийся' };
    }
  }

  // Magic Initiate (Посвященный в магию: cantrips & 1st level spells of any class)
  if (traitNames.some(t => t.includes('посвященный в магию') || t.includes('magic initiate'))) {
    if (spellObj.level <= 1) {
      return { allowed: true, source: 'feat', sourceLabel: 'Черта: Посвященный в магию' };
    }
  }

  // Ritual Caster (Ритуальный заклинатель: ritual spells)
  if (traitNames.some(t => t.includes('ритуальный') || t.includes('ritual caster'))) {
    if (spellObj.ritual) {
      return { allowed: true, source: 'feat', sourceLabel: 'Черта: Ритуальный заклинатель' };
    }
  }

  // 5. Check Racial sources (Innate spells e.g. Tiefling, Drow, Genasi, Triton)
  for (let lvl = 1; lvl <= (char.level || 1); lvl++) {
    const racialFeats = getRacialFeaturesForLevel(char.race, char.subrace, lvl);
    for (const rf of racialFeats) {
      if (rf.spell && rf.spell.name.toLowerCase() === spellObj.name.toLowerCase()) {
        return { allowed: true, source: 'race', sourceLabel: `Раса: ${char.race}` };
      }
    }
  }

  // If character has no spellcasting class selected yet, treat as open
  if (!charClass) {
    return { allowed: true, source: 'other', sourceLabel: 'Общее' };
  }

  // Not allowed without an external source
  const primaryClassesText = spellObj.classes && spellObj.classes.length > 0 
    ? spellObj.classes.join(', ') 
    : 'Другой класс';

  return {
    allowed: false,
    source: 'other',
    sourceLabel: `⚠️ ${primaryClassesText}`,
    reason: `Заклинание «${spellObj.name}» доступно классам: ${primaryClassesText}. Класс персонажа: «${char.className || 'Без класса'}»${char.subclass ? ` (${char.subclass})` : ''}.`
  };
}

/**
 * Returns the highest spell slot level currently available to the character (1-9), or 0 if no slots.
 */
export function getMaxAvailableSpellSlotLevel(char: CharacterData, customLevel?: number): number {
  let maxSlot = 0;
  // 1. Check char.spellSlots from sheet
  for (let lvl = 1; lvl <= 9; lvl++) {
    if (char.spellSlots && char.spellSlots[lvl] && char.spellSlots[lvl].totalSlots > 0) {
      maxSlot = Math.max(maxSlot, lvl);
    }
  }
  // 2. Also check class progression table for char.className / spellcastingClass and level
  const effectiveClass = char.className || char.spellcastingClass || '';
  const level = customLevel || char.level || 1;
  if (effectiveClass) {
    const classSlots = getSpellSlotsForClassLevel(effectiveClass, level);
    if (classSlots) {
      for (const [lvlStr, count] of Object.entries(classSlots)) {
        if (count > 0) {
          maxSlot = Math.max(maxSlot, Number(lvlStr));
        }
      }
    }
    // Warlock Mystic Arcanum: Warlocks get 6th circle at 11, 7th at 13, 8th at 15, 9th at 17
    const cleanClass = effectiveClass.trim().toLowerCase();
    if (cleanClass.includes('колдун') || cleanClass.includes('warlock')) {
      if (level >= 17) maxSlot = Math.max(maxSlot, 9);
      else if (level >= 15) maxSlot = Math.max(maxSlot, 8);
      else if (level >= 13) maxSlot = Math.max(maxSlot, 7);
      else if (level >= 11) maxSlot = Math.max(maxSlot, 6);
    }

    // Third casters: Eldritch Knight (Мистический рыцарь) / Arcane Trickster (Мистический ловкач)
    const sub = (char.subclass || '').toLowerCase();
    if (sub.includes('мистический рыцарь') || sub.includes('eldritch knight') || sub.includes('мистический ловкач') || sub.includes('arcane trickster')) {
      if (level >= 19) maxSlot = Math.max(maxSlot, 4);
      else if (level >= 13) maxSlot = Math.max(maxSlot, 3);
      else if (level >= 7) maxSlot = Math.max(maxSlot, 2);
      else if (level >= 3) maxSlot = Math.max(maxSlot, 1);
    }
  }
  return maxSlot;
}

/**
 * Checks if a spell level is supported by the character's available spell slots.
 * Cantrips (level 0) are always allowed.
 * Leveled spells (1-9) require spell slots of that level or higher.
 */
export function isSpellLevelAllowedForCharacter(char: CharacterData, spellLevel: number, customLevel?: number): {
  allowed: boolean;
  maxSlot: number;
  reason?: string;
} {
  if (spellLevel === 0) {
    return { allowed: true, maxSlot: getMaxAvailableSpellSlotLevel(char, customLevel) };
  }
  const maxSlot = getMaxAvailableSpellSlotLevel(char, customLevel);
  if (spellLevel > maxSlot) {
    return {
      allowed: false,
      maxSlot,
      reason: `Заклинание требует ячейки ${spellLevel}-го уровня. У вашего персонажа доступны ячейки только до ${maxSlot || '0 (нет ячеек)'}-го уровня.`
    };
  }
  return { allowed: true, maxSlot };
}

/**
 * Returns filtered list of spells suitable for this character's class, subclass, feats, and race.
 * Optionally also filters strictly by available spell slots.
 */
export function getAvailableSpellsForCharacter(
  char: CharacterData,
  options?: { checkSlots?: boolean; customLevel?: number }
): DndSpell[] {
  const maxSlot = options?.checkSlots ? getMaxAvailableSpellSlotLevel(char, options.customLevel) : 9;
  return DND_COMPENDIUM_SPELLS.filter(s => {
    if (options?.checkSlots && s.level > maxSlot) {
      return false;
    }
    return isSpellAllowedForCharacter(char, s).allowed;
  });
}
