// Helper functions, generators, and rules engine for Character Creation Wizard
import { AbilityName, ABILITY_NAMES, ALL_SKILLS, calcModifier } from '@/lib/dnd-types';
import { CLASS_TEMPLATES, type ClassTemplate } from '@/lib/dnd-types';
import type { CompendiumRace, CompendiumSubrace } from '@/data/compendium/races';
import { DND_COMPENDIUM_RACES } from '@/data/compendium/races';

// ── Fantasy Name Generator ──

const FANTASY_NAMES: Record<string, { male: string[]; female: string[]; surnames: string[] }> = {
  elf: {
    male: ['Аэрин', 'Эладор', 'Фаэлин', 'Варис', 'Эмиль', 'Сильвас', 'Лиандри', 'Таэлор', 'Исильдур', 'Элрион', 'Фенрис', 'Талион'],
    female: ['Аравель', 'Лираэль', 'Мириэль', 'Сильвиэль', 'Киара', 'Эления', 'Селена', 'Талия', 'Фираэль', 'Элория', 'Алтея'],
    surnames: ['Лунная Тень', 'Звёздный Ветер', 'Серебряный Лист', 'Солнечный Луч', 'Шелест Леса', 'Ледяной Цветок', 'Зелёный Дол']
  },
  dwarf: {
    male: ['Брунор', 'Торин', 'Дагнал', 'Торгрим', 'Балин', 'Хротгар', 'Двалин', 'Моргран', 'Орик', 'Флинто', 'Гимли', 'Бальдур'],
    female: ['Хельга', 'Дис', 'Дагна', 'Мардра', 'Вестра', 'Тордис', 'Брунгильда', 'Криста', 'Хильда', 'Эльдрида'],
    surnames: ['Железный Кулак', 'Золотой Молот', 'Каменный Шлем', 'Огненный Горн', 'Медный Топор', 'Глубокий Камень', 'Стальной Щит']
  },
  human: {
    male: ['Аларик', 'Роланд', 'Годрик', 'Бран', 'Эдвард', 'Валериан', 'Кайл', 'Дариус', 'Морган', 'Люциан', 'Гаррет', 'Виктор'],
    female: ['Элинора', 'Брианна', 'Лилиана', 'Морриган', 'Селеста', 'Гвендолин', 'Алиса', 'Розалина', 'Катарина', 'Изольда'],
    surnames: ['Штормхейвен', 'Блэквуд', 'Райдер', 'Волкодав', 'Старк', 'Грей', 'Фостер', 'Кроу', 'Железнорукий', 'Холмс']
  },
  halfling: {
    male: ['Мерри', 'Пиппин', 'Мило', 'Финдо', 'Альдо', 'Барнаби', 'Оливер', 'Тобиас', 'Корни', 'Берри'],
    female: ['Рози', 'Примула', 'Белла', 'Люсинда', 'Поппи', 'Дейзи', 'Мэй', 'Виллоу', 'Клевер', 'Миртл'],
    surnames: ['Подхолмик', 'Зеленый Холм', 'Чайный Лист', 'Быстроног', 'Яблочкин', 'Тихоступ', 'Светловод']
  },
  dragonborn: {
    male: ['Баласар', 'Клеш', 'Дондар', 'Геш', 'Медрик', 'Надир', 'Торрин', 'Архан', 'Рашар', 'Тархун'],
    female: ['Акра', 'Бири', 'Даида', 'Харачес', 'Миша', 'Нала', 'Перра', 'Сурин', 'Коринна', 'Шава'],
    surnames: ['Клан Ундачеллор', 'Клан Драказис', 'Клан Клеш', 'Клан Огненного Клыка', 'Клан Чешуи Бури']
  },
  tiefling: {
    male: ['Мортос', 'Малахи', 'Азраил', 'Валак', 'Люциус', 'Дамиан', 'Каин', 'Зариэль', 'Бальтазар'],
    female: ['Лилит', 'Морриган', 'Кармилла', 'Калипсо', 'Нерисса', 'Вельвет', 'Астарта', 'Геката'],
    surnames: ['Надежда', 'Скорбь', 'Тайна', 'Пепел', 'Ярость', 'Бездна', 'Свет во Тьме', 'Забвение']
  },
  orc: {
    male: ['Громмаш', 'Тарг', 'Круг', 'Денгар', 'Варлок', 'Багрок', 'Морг', 'Горок', 'Дурзо', 'Харгар'],
    female: ['Багги', 'Эмен', 'Келла', 'Варла', 'Морга', 'Шаута', 'Олга', 'Грета', 'Зулка'],
    surnames: ['Костелом', 'Кровопийца', 'Железный Клык', 'Громовой Удар', 'Чёрный Череп', 'Волчья Стая']
  },
  gnome: {
    male: ['Бим', 'Димбл', 'Финбар', 'Гербо', 'Зигги', 'Кварк', 'Спарки', 'Никл', 'Визл', 'Тинкер'],
    female: ['Бинки', 'Элли', 'Никс', 'Пиппа', 'Тана', 'Трикси', 'Винни', 'Занна', 'Фиджет'],
    surnames: ['Часовщик', 'Искромет', 'Шестеренник', 'Быстромысл', 'Хитрован', 'Меднопал']
  }
};

export function generateFantasyName(raceId?: string): string {
  const r = (raceId || '').toLowerCase();
  let key = 'human';
  if (r.includes('elf') || r.includes('эльф')) key = 'elf';
  else if (r.includes('dwarf') || r.includes('дворф')) key = 'dwarf';
  else if (r.includes('halfling') || r.includes('полурос')) key = 'halfling';
  else if (r.includes('dragon') || r.includes('дракон')) key = 'dragonborn';
  else if (r.includes('tief') || r.includes('тифл')) key = 'tiefling';
  else if (r.includes('orc') || r.includes('орк')) key = 'orc';
  else if (r.includes('gnome') || r.includes('гном')) key = 'gnome';

  const group = FANTASY_NAMES[key] || FANTASY_NAMES.human;
  const isMale = Math.random() > 0.5;
  const firstNames = isMale ? group.male : group.female;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const surname = group.surnames[Math.floor(Math.random() * group.surnames.length)];

  return `${firstName} ${surname}`;
}

// ── Racial Skills Rules ──

export interface RacialSkillData {
  fixedSkills: string[];
  choiceCount: number;
  choiceOptions?: string[];
  description?: string;
}

export function getRacialSkillData(race: CompendiumRace, subrace?: CompendiumSubrace): RacialSkillData {
  const raceId = (race.id || '').toLowerCase();
  const subraceId = (subrace?.id || '').toLowerCase();

  // Variant Human
  if (subraceId === 'human-variant') {
    return {
      fixedSkills: [],
      choiceCount: 1,
      choiceOptions: ALL_SKILLS.slice(),
      description: 'Человек (Вариантный) получает владение 1 любым навыком на выбор.'
    };
  }

  // Elf (Keen Senses -> Perception)
  if (raceId === 'elf' || raceId.includes('elf') || race.name.toLowerCase().includes('эльф')) {
    return {
      fixedSkills: ['Внимательность'],
      choiceCount: 0,
      description: 'Обострённые чувства: владение навыком Внимательность.'
    };
  }

  // Half-Elf (Skill Versatility -> 2 of choice)
  if (raceId === 'half-elf' || race.name.toLowerCase().includes('полуэльф')) {
    // Check if variant replaced it (e.g. SCAG variant), default has 2 skills
    if (subraceId.includes('wood') || subraceId.includes('high')) {
      // wood/high half-elf variants might keep or swap, standard has 2 skills
      return {
        fixedSkills: [],
        choiceCount: 2,
        choiceOptions: ALL_SKILLS.slice(),
        description: 'Универсальность в навыках: владение 2 любыми навыками на выбор.'
      };
    }
    return {
      fixedSkills: [],
      choiceCount: 2,
      choiceOptions: ALL_SKILLS.slice(),
      description: 'Универсальность в навыках: владение 2 любыми навыками на выбор.'
    };
  }

  // Half-Orc (Menacing -> Intimidation)
  if (raceId === 'half-orc' || race.name.toLowerCase().includes('полуорк')) {
    return {
      fixedSkills: ['Запугивание'],
      choiceCount: 0,
      description: 'Угрожающий вид: владение навыком Запугивание.'
    };
  }

  // Tabaxi (Cat's Talent -> Perception, Stealth)
  if (raceId === 'tabaxi' || race.name.toLowerCase().includes('табакси')) {
    return {
      fixedSkills: ['Внимательность', 'Скрытность'],
      choiceCount: 0,
      description: 'Кошачьи таланты: владение навыками Внимательность и Скрытность.'
    };
  }

  // Satyr (Performance, Persuasion)
  if (raceId === 'satyr' || race.name.toLowerCase().includes('сатир')) {
    return {
      fixedSkills: ['Выступление', 'Убеждение'],
      choiceCount: 0,
      description: 'Праздничный восторг: владение навыками Выступление и Убеждение.'
    };
  }

  // Bugbear (Sneaky -> Stealth)
  if (raceId === 'bugbear' || race.name.toLowerCase().includes('багбир')) {
    return {
      fixedSkills: ['Скрытность'],
      choiceCount: 0,
      description: 'Скрытный: владение навыком Скрытность.'
    };
  }

  // Kenku (Choose 2 of 4)
  if (raceId === 'kenku' || race.name.toLowerCase().includes('кенку')) {
    return {
      fixedSkills: [],
      choiceCount: 2,
      choiceOptions: ['Акробатика', 'Ловкость рук', 'Обман', 'Скрытность'],
      description: 'Врождённые навыки: выберите 2 навыка из списка.'
    };
  }

  // Lizardfolk (Choose 2 of 5)
  if (raceId.includes('lizard') || race.name.toLowerCase().includes('людоящер')) {
    return {
      fixedSkills: [],
      choiceCount: 2,
      choiceOptions: ['Внимательность', 'Выживание', 'Медицина', 'Природа', 'Скрытность'],
      description: 'Охотничья интуиция: выберите 2 навыка из списка.'
    };
  }

  // Changeling (Choose 2 of 4)
  if (raceId === 'changeling' || race.name.toLowerCase().includes('подменыш')) {
    return {
      fixedSkills: [],
      choiceCount: 2,
      choiceOptions: ['Запугивание', 'Обман', 'Проницательность', 'Убеждение'],
      description: 'Инстинкты подменыша: выберите 2 навыка из списка.'
    };
  }

  // Leonin (Choose 1 of 4)
  if (raceId === 'leonin' || race.name.toLowerCase().includes('леонинец')) {
    return {
      fixedSkills: [],
      choiceCount: 1,
      choiceOptions: ['Атлетика', 'Внимательность', 'Выживание', 'Запугивание'],
      description: 'Охотничьи инстинкты: выберите 1 навык из списка.'
    };
  }

  // Tortle (Choose 1 of 5)
  if (raceId === 'tortle' || race.name.toLowerCase().includes('тортл')) {
    return {
      fixedSkills: [],
      choiceCount: 1,
      choiceOptions: ['Внимательность', 'Выживание', 'Медицина', 'Природа', 'Скрытность'],
      description: 'Инстинкты природы: выберите 1 навык из списка.'
    };
  }

  // Default: scan traits for skill keywords
  const fixed: string[] = [];
  const allTraits = [...(race.traits || []), ...(subrace?.traits || [])];
  for (const t of allTraits) {
    const desc = `${t.name} ${t.description}`.toLowerCase();
    for (const skill of ALL_SKILLS) {
      const sLower = skill.toLowerCase();
      if (desc.includes(`владение навыком ${sLower}`) || desc.includes(`владением навыком ${sLower}`) || desc.includes(`навыком ${sLower}`)) {
        if (!fixed.includes(skill)) fixed.push(skill);
      }
    }
  }

  return {
    fixedSkills: fixed,
    choiceCount: 0,
    description: fixed.length > 0 ? `Расовые навыки: ${fixed.join(', ')}` : undefined
  };
}

// ── Racial Ability Customization (Half-Elf, Variant Human) ──

export interface RacialBonusConfig {
  hasCustomBonus: boolean;
  fixedBonuses: Partial<Record<AbilityName, number>>;
  choiceCount: number;
  bonusAmount: number;
  availableAbilities: AbilityName[];
  description: string;
}

export function getRacialBonusConfig(race: CompendiumRace, subrace?: CompendiumSubrace): RacialBonusConfig {
  const raceId = (race.id || '').toLowerCase();
  const subraceId = (subrace?.id || '').toLowerCase();

  // Combine base and subrace bonuses
  const combined: Partial<Record<AbilityName, number>> = {
    ...(race.abilityBonuses || {}),
    ...(subrace?.abilityBonuses || {})
  };

  // Half-Elf: +2 CHA, +1 to two other distinct abilities
  if (raceId === 'half-elf' || race.name.toLowerCase().includes('полуэльф')) {
    return {
      hasCustomBonus: true,
      fixedBonuses: { 'ХАР': 2 },
      choiceCount: 2,
      bonusAmount: 1,
      availableAbilities: ['СИЛ', 'ЛОВ', 'ТЕЛ', 'ИНТ', 'МДР'],
      description: 'Полуэльф получает +2 к Харизме и по +1 к двум другим характеристикам на выбор.'
    };
  }

  // Variant Human: +1 to two distinct abilities
  if (subraceId === 'human-variant') {
    return {
      hasCustomBonus: true,
      fixedBonuses: {},
      choiceCount: 2,
      bonusAmount: 1,
      availableAbilities: ABILITY_NAMES.slice() as AbilityName[],
      description: 'Вариантный человек получает по +1 к двум различным характеристикам на выбор.'
    };
  }

  return {
    hasCustomBonus: false,
    fixedBonuses: combined,
    choiceCount: 0,
    bonusAmount: 0,
    availableAbilities: [],
    description: Object.entries(combined).map(([k, v]) => `${k} +${v}`).join(', ')
  };
}

// ── Class Skills & Progression Info ──

export interface ClassSkillConfig {
  skillChoices: number;
  skillOptions: string[];
  recommendedSkills: string[];
  savingThrowProfs: AbilityName[];
  hitDieSize: number;
  primaryAbility: string;
  role: string;
  template?: ClassTemplate;
}

export function getClassSkillConfig(className: string): ClassSkillConfig {
  const norm = className.trim().toLowerCase();
  const tmpl = CLASS_TEMPLATES.find(t =>
    t.name.toLowerCase() === norm ||
    t.id.toLowerCase() === norm ||
    norm.includes(t.name.toLowerCase())
  );

  if (tmpl) {
    return {
      skillChoices: tmpl.skillChoices,
      skillOptions: tmpl.skillOptions,
      recommendedSkills: tmpl.recommendedSkills,
      savingThrowProfs: tmpl.savingThrowProfs,
      hitDieSize: tmpl.hitDieSize,
      primaryAbility: tmpl.primaryAbility,
      role: tmpl.role,
      template: tmpl
    };
  }

  // Fallback defaults
  return {
    skillChoices: 2,
    skillOptions: ALL_SKILLS.slice(),
    recommendedSkills: ['Внимательность', 'Атлетика'],
    savingThrowProfs: ['СИЛ', 'ТЕЛ'],
    hitDieSize: 8,
    primaryAbility: 'СИЛ',
    role: 'Искатель приключений'
  };
}

// ── 1st Level Spellcasting Limits ──

export interface ClassSpellcastingLimits {
  isCaster: boolean;
  cantripsLimit: number;
  spellsLimit: number;
  spellcastingAbility: AbilityName | '';
  spellSlotsAt1: Record<number, number>;
  ruleExplanation: string;
  spellbookOnly?: boolean; // For wizard
}

export function getClassSpellcastingLimits(
  className: string,
  scores: Record<AbilityName, number>,
  bonuses: Record<AbilityName, number>
): ClassSpellcastingLimits {
  const c = className.trim().toLowerCase();
  const getMod = (ab: AbilityName) => calcModifier((scores[ab] || 10) + (bonuses[ab] || 0));

  // Wizard (Волшебник)
  if (c.includes('волшебник') || c.includes('wizard')) {
    const intMod = getMod('ИНТ');
    const preparedLimit = Math.max(1, intMod + 1);
    return {
      isCaster: true,
      cantripsLimit: 3,
      spellsLimit: 6, // 6 spells chosen for spellbook at level 1
      spellcastingAbility: 'ИНТ',
      spellSlotsAt1: { 1: 2 },
      ruleExplanation: `Волшебник выбирает 3 заговора и записывает 6 заклинаний 1-го уровня в книгу заклинаний (готовит на день: Интеллект (${intMod >= 0 ? '+' : ''}${intMod}) + 1 ур. = ${preparedLimit}).`,
      spellbookOnly: true
    };
  }

  // Sorcerer (Чародей)
  if (c.includes('чародей') || c.includes('sorcerer')) {
    return {
      isCaster: true,
      cantripsLimit: 4,
      spellsLimit: 2,
      spellcastingAbility: 'ХАР',
      spellSlotsAt1: { 1: 2 },
      ruleExplanation: 'Чародей 1-го уровня знает ровно 4 заговора и 2 заклинания 1-го уровня.'
    };
  }

  // Warlock (Колдун)
  if (c.includes('колдун') || c.includes('warlock')) {
    return {
      isCaster: true,
      cantripsLimit: 2,
      spellsLimit: 2,
      spellcastingAbility: 'ХАР',
      spellSlotsAt1: { 1: 1 }, // 1 Pact Slot
      ruleExplanation: 'Колдун 1-го уровня знает ровно 2 заговора и 2 заклинания 1-го уровня (1 ячейка пакта).'
    };
  }

  // Cleric (Жрец)
  if (c.includes('жрец') || c.includes('cleric')) {
    const wisMod = getMod('МДР');
    const prepLimit = Math.max(1, wisMod + 1);
    return {
      isCaster: true,
      cantripsLimit: 3,
      spellsLimit: prepLimit,
      spellcastingAbility: 'МДР',
      spellSlotsAt1: { 1: 2 },
      ruleExplanation: `Жрец 1-го уровня знает 3 заговора и готовит ${prepLimit} заклинаний 1-го уровня (Мудрость (${wisMod >= 0 ? '+' : ''}${wisMod}) + 1 ур.).`
    };
  }

  // Druid (Друид)
  if (c.includes('друид') || c.includes('druid')) {
    const wisMod = getMod('МДР');
    const prepLimit = Math.max(1, wisMod + 1);
    return {
      isCaster: true,
      cantripsLimit: 2,
      spellsLimit: prepLimit,
      spellcastingAbility: 'МДР',
      spellSlotsAt1: { 1: 2 },
      ruleExplanation: `Друид 1-го уровня знает 2 заговора и готовит ${prepLimit} заклинаний 1-го уровня (Мудрость (${wisMod >= 0 ? '+' : ''}${wisMod}) + 1 ур.).`
    };
  }

  // Bard (Бард)
  if (c.includes('бард') || c.includes('bard')) {
    return {
      isCaster: true,
      cantripsLimit: 2,
      spellsLimit: 4,
      spellcastingAbility: 'ХАР',
      spellSlotsAt1: { 1: 2 },
      ruleExplanation: 'Бард 1-го уровня знает ровно 2 заговора и 4 заклинания 1-го уровня.'
    };
  }

  // Artificer (Изобретатель)
  if (c.includes('изобретатель') || c.includes('artificer')) {
    const intMod = getMod('ИНТ');
    const prepLimit = Math.max(1, intMod);
    return {
      isCaster: true,
      cantripsLimit: 2,
      spellsLimit: prepLimit,
      spellcastingAbility: 'ИНТ',
      spellSlotsAt1: { 1: 2 },
      ruleExplanation: `Изобретатель 1-го уровня знает 2 заговора и готовит ${prepLimit} заклинаний 1-го уровня (Интеллект (${intMod >= 0 ? '+' : ''}${intMod})).`
    };
  }

  // Non-casters at level 1: Fighter, Barbarian, Monk, Rogue, Paladin, Ranger
  return {
    isCaster: false,
    cantripsLimit: 0,
    spellsLimit: 0,
    spellcastingAbility: '',
    spellSlotsAt1: {},
    ruleExplanation: `Класс «${className}» не использует заклинания на 1-м уровне.`
  };
}

// ── Point Buy Cost Calculator ──

export const POINT_BUY_BUDGET = 27;

export const POINT_BUY_COST_TABLE: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9
};

export function calcPointBuyTotalSpent(scores: Record<AbilityName, number>): number {
  let total = 0;
  for (const ab of ABILITY_NAMES) {
    const score = Math.max(8, Math.min(15, scores[ab] || 8));
    total += POINT_BUY_COST_TABLE[score] ?? 0;
  }
  return total;
}

// ── Crypto-random 4d6 Drop Lowest Roller ──

export function roll4d6DropLowest(): { dice: number[]; droppedIndex: number; total: number } {
  const dice: number[] = [];
  for (let i = 0; i < 4; i++) {
    const arr = new Uint8Array(1);
    let val: number;
    do {
      crypto.getRandomValues(arr);
      val = arr[0];
    } while (val >= 252);
    dice.push((val % 6) + 1);
  }

  let minVal = 7;
  let minIdx = -1;
  for (let i = 0; i < dice.length; i++) {
    if (dice[i] < minVal) {
      minVal = dice[i];
      minIdx = i;
    }
  }

  const sum = dice.reduce((acc, d, i) => i === minIdx ? acc : acc + d, 0);
  return { dice, droppedIndex: minIdx, total: sum };
}
