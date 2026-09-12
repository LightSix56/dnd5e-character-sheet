// Helper functions, generators, and rules engine for Character Creation Wizard
import { AbilityName, ABILITY_NAMES, ALL_SKILLS, calcModifier } from '@/lib/dnd-types';
import { CLASS_TEMPLATES, type ClassTemplate } from '@/lib/dnd-types';
import type {
  CompendiumRace,
  CompendiumSubrace,
  RaceCantripChoiceConfig,
  RaceToolChoiceConfig,
  RaceWeaponProfChoiceConfig,
  RaceCustomFeatureChoiceConfig,
  MagicClass,
  ToolCategory
} from '@/data/compendium/races';
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
  const raceId = (race?.id || '').toLowerCase();
  const subraceId = (subrace?.id || '').toLowerCase();
  const choice = subrace?.choices || race?.choices;

  // Declarative extra skills configuration
  if (choice?.extraSkillsCount !== undefined && choice.extraSkillsCount > 0) {
    const fixed: string[] = [];
    const allTraits = [...(race?.traits || []), ...(subrace?.traits || [])];
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
      choiceCount: choice.extraSkillsCount,
      choiceOptions: choice.skillChoiceOptions ? [...choice.skillChoiceOptions] : ALL_SKILLS.slice(),
      description: `Дополнительные навыки на выбор: ${choice.extraSkillsCount}.`
    };
  }

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
  const raceId = (race?.id || '').toLowerCase();
  const subraceId = (subrace?.id || '').toLowerCase();
  const choice = subrace?.choices || race?.choices;

  // Combine base and subrace bonuses
  const combined: Partial<Record<AbilityName, number>> = {
    ...(race?.abilityBonuses || {}),
    ...(subrace?.abilityBonuses || {})
  };

  // Declarative flexible ASI (e.g. Custom Lineage or Tasha/MPMM flexible rules)
  if (choice?.isFlexibleASI) {
    return {
      hasCustomBonus: true,
      fixedBonuses: {},
      choiceCount: 2,
      bonusAmount: 1,
      availableAbilities: ABILITY_NAMES.slice() as AbilityName[],
      description: 'Свободное распределение бонусов характеристик (+1 к двум различным характеристикам на выбор).'
    };
  }

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
    const score = scores[ab] ?? 8;
    if (score < 8 || score > 15) return NaN;
    total += POINT_BUY_COST_TABLE[score] ?? 0;
  }
  return total;
}

// ── Standard Array Validator ──

export const STANDARD_ARRAY_VALUES = [15, 14, 13, 12, 10, 8] as const;

export function validateStandardArray(scores: Record<AbilityName, number>): { valid: boolean; error?: string } {
  const vals = ABILITY_NAMES.map(ab => scores[ab] ?? 0).sort((a, b) => b - a);
  const expected = [...STANDARD_ARRAY_VALUES].sort((a, b) => b - a);
  if (vals.length !== expected.length || !vals.every((v, i) => v === expected[i])) {
    return {
      valid: false,
      error: 'В стандартном наборе каждое из значений (15, 14, 13, 12, 10, 8) должно быть назначено ровно один раз без повторений.'
    };
  }
  return { valid: true };
}

// ── Prepared Spells Limit Calculator ──

export function calcPreparedSpellsLimit(className: string, level: number, abilityMod: number): number {
  const norm = className.trim().toLowerCase();
  if (
    norm.includes('волшебник') || norm.includes('wizard') ||
    norm.includes('жрец') || norm.includes('cleric') ||
    norm.includes('друид') || norm.includes('druid')
  ) {
    return Math.max(1, abilityMod + level);
  }
  if (norm.includes('изобретатель') || norm.includes('artificer')) {
    return Math.max(1, abilityMod + Math.floor(level / 2));
  }
  if (norm.includes('паладин') || norm.includes('paladin')) {
    return Math.max(1, abilityMod + Math.floor(level / 2));
  }
  return 0;
}

// ── Dynamic AC Calculator ──

export function calculateWizardAC(
  className: string,
  equippedArmor: string,
  equippedShield: boolean,
  dexMod: number,
  conMod: number,
  wisMod: number,
  options?: {
    hasDefenseFightingStyle?: boolean;
    isDraconicSorcerer?: boolean;
    raceName?: string;
  }
): number {
  const shieldBonus = equippedShield ? 2 : 0;
  const normClass = className.trim().toLowerCase();
  const normRace = (options?.raceName || '').trim().toLowerCase();

  const isWarforged = normRace.includes('кован') || normRace.includes('warforged');
  const warforgedBonus = isWarforged ? 1 : 0;

  // Racial and class natural/unarmored defenses when not wearing armor
  if (!equippedArmor) {
    if (normRace.includes('тортл') || normRace.includes('tortle')) {
      return 17 + shieldBonus + warforgedBonus;
    }
    if (
      normRace.includes('трикрин') ||
      normRace.includes('thri-kreen') ||
      normRace.includes('людоящер') ||
      normRace.includes('lizardfolk') ||
      normRace.includes('автогном') ||
      normRace.includes('autognome')
    ) {
      return 13 + dexMod + shieldBonus + warforgedBonus;
    }
    if (normRace.includes('локсодон') || normRace.includes('loxodon')) {
      return 12 + conMod + shieldBonus + warforgedBonus;
    }
    if (normRace.includes('локата') || normRace.includes('locathah')) {
      return 12 + dexMod + shieldBonus + warforgedBonus;
    }

    // Draconic Sorcerer Unarmored Defense (13 + DEX, shield allowed)
    if (options?.isDraconicSorcerer) {
      return 13 + dexMod + shieldBonus + warforgedBonus;
    }

    // Barbarian Unarmored Defense (10 + DEX + CON + shield)
    if (normClass.includes('варвар') || normClass.includes('barbarian')) {
      return 10 + dexMod + conMod + shieldBonus + warforgedBonus;
    }
    // Monk Unarmored Defense (10 + DEX + WIS, no shield allowed)
    if ((normClass.includes('монах') || normClass.includes('monk')) && !equippedShield) {
      return 10 + dexMod + wisMod + warforgedBonus;
    }
  }

  let ac = 10 + dexMod + shieldBonus + warforgedBonus;

  if (equippedArmor) {
    const lowerArmor = equippedArmor.toLowerCase();
    // Heavy: Chain Mail / Кольчуга / Латы
    if (lowerArmor.includes('кольчуг') || lowerArmor.includes('chain mail') || lowerArmor.includes('латы') || lowerArmor.includes('наборн') || lowerArmor.includes('колечн')) {
      ac = 16 + shieldBonus + warforgedBonus;
    }
    // Medium: Scale Mail / Чешуйчатый доспех (14 + min(2, max(0, dexMod)))
    else if (lowerArmor.includes('чешуйчат') || lowerArmor.includes('scale mail') || lowerArmor.includes('рубах') || lowerArmor.includes('кирас') || lowerArmor.includes('полулат') || lowerArmor.includes('шкурн')) {
      ac = 14 + Math.min(2, Math.max(0, dexMod)) + shieldBonus + warforgedBonus;
    }
    // Light: Leather / Кожаный доспех (11 + dexMod)
    else if (lowerArmor.includes('кожан') || lowerArmor.includes('leather') || lowerArmor.includes('стеган') || lowerArmor.includes('проклепан')) {
      ac = 11 + dexMod + shieldBonus + warforgedBonus;
    }

    if (options?.hasDefenseFightingStyle) {
      ac += 1;
    }
  }

  return ac;
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

// ── Level 1 Dictionaries & Choice Configurations ──

export interface FightingStyleOption {
  id: string;
  name: string;
  nameEn: string;
  description: string;
}

export const FIGHTING_STYLES: FightingStyleOption[] = [
  {
    id: 'archery',
    name: 'Стрельба',
    nameEn: 'Archery',
    description: 'Вы получаете бонус +2 к броскам атаки дальнобойным оружием.'
  },
  {
    id: 'defense',
    name: 'Оборона',
    nameEn: 'Defense',
    description: 'Пока вы носите доспехи, вы получаете бонус +1 к КД.'
  },
  {
    id: 'dueling',
    name: 'Дуэлянт',
    nameEn: 'Dueling',
    description: 'Когда вы держите рукопашное оружие в одной руке и не держите другого оружия, вы получаете бонус +2 к броскам урона этим оружием.'
  },
  {
    id: 'great-weapon',
    name: 'Бой большим оружием',
    nameEn: 'Great Weapon Fighting',
    description: 'Если у вас выпало 1 или 2 на кости урона двуручного или универсального оружия, вы можете перебросить кость.'
  },
  {
    id: 'protection',
    name: 'Защита',
    nameEn: 'Protection',
    description: 'Когда существо, которое вы видите, атакует цель, отличную от вас и находящуюся в пределах 5 футов, вы можете использовать реакцию со щитом, чтобы создать помеху атакующему.'
  },
  {
    id: 'two-weapon',
    name: 'Оружие в обеих руках',
    nameEn: 'Two-Weapon Fighting',
    description: 'Если вы сражаетесь двумя оружиями, вы можете добавить модификатор характеристики к урону второй атаки.'
  }
];

export interface DragonAncestryOption {
  color: string;
  damageType: string;
  breathShape: string;
  saveAbility: AbilityName;
  description: string;
}

export const DRAGON_ANCESTRIES: DragonAncestryOption[] = [
  {
    color: 'Черный',
    damageType: 'Кислота',
    breathShape: 'Линия 5x30 фт.',
    saveAbility: 'ЛОВ',
    description: 'Кислота, Линия 5x30 фт., спасбросок ЛОВ'
  },
  {
    color: 'Синий',
    damageType: 'Электричество',
    breathShape: 'Линия 5x30 фт.',
    saveAbility: 'ЛОВ',
    description: 'Электричество, Линия 5x30 фт., спасбросок ЛОВ'
  },
  {
    color: 'Латунный',
    damageType: 'Огонь',
    breathShape: 'Линия 5x30 фт.',
    saveAbility: 'ЛОВ',
    description: 'Огонь, Линия 5x30 фт., спасбросок ЛОВ'
  },
  {
    color: 'Бронзовый',
    damageType: 'Электричество',
    breathShape: 'Линия 5x30 фт.',
    saveAbility: 'ЛОВ',
    description: 'Электричество, Линия 5x30 фт., спасбросок ЛОВ'
  },
  {
    color: 'Медный',
    damageType: 'Кислота',
    breathShape: 'Линия 5x30 фт.',
    saveAbility: 'ЛОВ',
    description: 'Кислота, Линия 5x30 фт., спасбросок ЛОВ'
  },
  {
    color: 'Золотой',
    damageType: 'Огонь',
    breathShape: 'Конус 15 фт.',
    saveAbility: 'ЛОВ',
    description: 'Огонь, Конус 15 фт., спасбросок ЛОВ'
  },
  {
    color: 'Зеленый',
    damageType: 'Яд',
    breathShape: 'Конус 15 фт.',
    saveAbility: 'ТЕЛ',
    description: 'Яд, Конус 15 фт., спасбросок ТЕЛ'
  },
  {
    color: 'Красный',
    damageType: 'Огонь',
    breathShape: 'Конус 15 фт.',
    saveAbility: 'ЛОВ',
    description: 'Огонь, Конус 15 фт., спасбросок ЛОВ'
  },
  {
    color: 'Серебряный',
    damageType: 'Холод',
    breathShape: 'Конус 15 фт.',
    saveAbility: 'ТЕЛ',
    description: 'Холод, Конус 15 фт., спасбросок ТЕЛ'
  },
  {
    color: 'Белый',
    damageType: 'Холод',
    breathShape: 'Конус 15 фт.',
    saveAbility: 'ТЕЛ',
    description: 'Холод, Конус 15 фт., спасбросок ТЕЛ'
  }
];

export const DWARF_TOOL_OPTIONS = [
  'Инструменты кузнеца',
  'Инструменты каменщика',
  'Инструменты пивовара'
];

export const ALL_ARTISAN_TOOLS = [
  'Инструменты алхимика',
  'Инструменты гончара',
  'Инструменты жестянщика',
  'Инструменты заточника',
  'Инструменты каменщика',
  'Инструменты картографа',
  'Инструменты кожевника',
  'Инструменты кузнеца',
  'Инструменты маляра',
  'Инструменты пивовара',
  'Инструменты плотника',
  'Инструменты повара',
  'Инструменты резчика по дереву',
  'Инструменты сапожника',
  'Инструменты стеклодува',
  'Инструменты ткача',
  'Инструменты ювелира'
];

export const MUSICAL_INSTRUMENTS = [
  'Барабан',
  'Виола',
  'Волынка',
  'Лютня',
  'Лира',
  'Рог',
  'Свирель',
  'Флейта',
  'Цимбалы',
  'Шалмей'
];

export const GAMING_SETS = [
  'Игральные кости',
  'Кости дракона',
  'Набор для трехдраконьего анте',
  'Шахматы'
];

export const STANDARD_LANGUAGES = [
  'Общий',
  'Дворфийский',
  'Эльфийский',
  'Великаний',
  'Гномий',
  'Гоблинский',
  'Полуросликов',
  'Орочий'
];

export const EXOTIC_LANGUAGES = [
  'Бездны',
  'Небесный',
  'Драконий',
  'Глубинная речь',
  'Инфернальный',
  'Первичный',
  'Сильван',
  'Подземный'
];

export const ALL_DND_LANGUAGES = [...STANDARD_LANGUAGES, ...EXOTIC_LANGUAGES];

export const RANGER_FAVORED_ENEMIES = [
  'Аберрации',
  'Звери',
  'Великаны',
  'Гуманоиды',
  'Драконы',
  'Исчадия',
  'Конструкты',
  'Монстры',
  'Небожители',
  'Нежить',
  'Растения',
  'Слизи',
  'Феи',
  'Элементали'
];

export const RANGER_FAVORED_TERRAINS = [
  'Арктика',
  'Болото',
  'Горы',
  'Лес',
  'Луг',
  'Побережье',
  'Подземье',
  'Пустыня'
];

export interface RacialChoicesConfig {
  needsFeat: boolean;
  needsCantrip: boolean;
  cantripConfig?: RaceCantripChoiceConfig;
  cantripClass?: MagicClass | string;
  needsTool: boolean;
  toolConfig?: RaceToolChoiceConfig;
  toolOptions: string[];
  toolCount: number;
  needsDragonColor: boolean;
  extraLanguageCount: number;
  extraSkillsCount?: number;
  isFlexibleASI?: boolean;
  needsSizeChoice: boolean;
  availableSizes?: ('Средний' | 'Маленький')[];
  needsWeaponProf: boolean;
  weaponProfConfig?: RaceWeaponProfChoiceConfig;
  needsCustomFeature: boolean;
  customFeature?: RaceCustomFeatureChoiceConfig;
}

export function getRacialChoicesConfig(
  race: CompendiumRace,
  subrace?: CompendiumSubrace
): RacialChoicesConfig {
  const raceId = (race?.id || '').toLowerCase();
  const subraceId = (subrace?.id || '').toLowerCase();
  const raceName = (race?.name || '').toLowerCase();
  const subraceName = (subrace?.name || '').toLowerCase();

  // Declarative choices configuration from compendium (highest priority)
  const choice = subrace?.choices || race?.choices;

  // Fallback legacy checks for backward compatibility & safety
  const isVariantHuman = subraceId === 'human-variant' || subraceName.includes('вариантн');
  const isCustomLineage = raceId === 'custom-lineage' || raceName.includes('персонализированн');
  const isHighElf = subraceId === 'elf-high' || raceId === 'elf-high' || subraceName.includes('высший эльф');
  const isDwarf = raceId === 'dwarf' || raceId.includes('dwarf') || raceName.includes('дворф');
  const isDragonborn = raceId === 'dragonborn' || raceId.includes('dragonborn') || raceName.includes('драконорожд');

  const needsFeat = Boolean(choice?.hasFeat ?? (isVariantHuman || isCustomLineage));

  // Cantrips resolution (supports string 'wizard' or object { class: '...', spellOptions: [...] })
  let cantripConfig: RaceCantripChoiceConfig | undefined;
  if (typeof choice?.cantripChoice === 'string') {
    cantripConfig = { class: choice.cantripChoice as MagicClass, count: 1 };
  } else if (choice?.cantripChoice && typeof choice.cantripChoice === 'object') {
    cantripConfig = choice.cantripChoice;
  } else if (isHighElf) {
    cantripConfig = { class: 'wizard', count: 1 };
  }
  const needsCantrip = Boolean(cantripConfig);
  const cantripClass = cantripConfig?.class || (isHighElf ? 'wizard' : undefined);

  // Tools resolution (supports string 'dwarf_tools' | 'artisan' or object)
  let toolConfig: RaceToolChoiceConfig | undefined;
  if (typeof choice?.toolChoice === 'string') {
    toolConfig = { category: choice.toolChoice as ToolCategory, count: 1 };
  } else if (choice?.toolChoice && typeof choice.toolChoice === 'object') {
    toolConfig = choice.toolChoice;
  } else if (isDwarf) {
    toolConfig = { category: 'dwarf_tools', count: 1 };
  }
  const needsTool = Boolean(toolConfig);
  const toolCount = toolConfig?.count || 1;
  let toolOptions: string[] = [];
  if (toolConfig?.options && toolConfig.options.length > 0) {
    toolOptions = [...toolConfig.options];
  } else if (toolConfig?.category === 'dwarf_tools') {
    toolOptions = [...DWARF_TOOL_OPTIONS];
  } else if (toolConfig?.category === 'artisan') {
    toolOptions = [...ALL_ARTISAN_TOOLS];
  } else if (toolConfig?.category === 'musical') {
    toolOptions = [...MUSICAL_INSTRUMENTS];
  } else if (toolConfig?.category === 'gaming') {
    toolOptions = [...GAMING_SETS];
  } else if (toolConfig?.category === 'thieves') {
    toolOptions = ['Воровские инструменты'];
  } else if (toolConfig?.category === 'any') {
    toolOptions = [...ALL_ARTISAN_TOOLS, ...MUSICAL_INSTRUMENTS, ...GAMING_SETS, 'Воровские инструменты'];
  } else if (isDwarf) {
    toolOptions = [...DWARF_TOOL_OPTIONS];
  }

  // Size Choice resolution (MPMM)
  const availableSizes = choice?.sizeChoice;
  const needsSizeChoice = Boolean(availableSizes && availableSizes.length > 1);

  // Weapon proficiencies resolution
  const weaponProfConfig = choice?.weaponProfChoice;
  const needsWeaponProf = Boolean(weaponProfConfig);

  // Custom Feature (Mutations, Seasons, etc.)
  const customFeature = choice?.customFeatureChoice;
  const needsCustomFeature = Boolean(customFeature && customFeature.options?.length > 0);

  // Dragon Ancestry
  const needsDragonColor = Boolean(choice?.dragonAncestry ?? isDragonborn);

  // Extra skills & Flexible ASI
  const extraSkillsCount = choice?.extraSkillsCount ?? (isVariantHuman ? 1 : 0);
  const isFlexibleASI = Boolean(choice?.isFlexibleASI ?? isCustomLineage);

  // Extra languages
  let extraLanguageCount = 0;
  if (choice?.extraLanguagesCount !== undefined) {
    extraLanguageCount = choice.extraLanguagesCount;
  } else if (isVariantHuman || isCustomLineage || isHighElf || raceId === 'half-elf' || raceName.includes('полуэльф')) {
    extraLanguageCount = 1;
  } else if (subrace?.traits?.some(t => t.name.toLowerCase().includes('язык') && t.description.toLowerCase().includes('выбор'))) {
    extraLanguageCount = 1;
  } else if (race?.languages?.some(l => l.toLowerCase().includes('выбор'))) {
    const choiceStr = race.languages.find(l => l.toLowerCase().includes('выбор'))!.toLowerCase();
    extraLanguageCount = (choiceStr.includes('два') || choiceStr.includes('2')) ? 2 : 1;
  }

  return {
    needsFeat,
    needsCantrip,
    cantripConfig,
    cantripClass,
    needsTool,
    toolConfig,
    toolOptions,
    toolCount,
    needsDragonColor,
    extraLanguageCount,
    extraSkillsCount,
    isFlexibleASI,
    needsSizeChoice,
    availableSizes,
    needsWeaponProf,
    weaponProfConfig,
    needsCustomFeature,
    customFeature
  };
}

export interface ClassLevel1ChoicesConfig {
  needsFightingStyle: boolean;
  needsExpertise: boolean;
  expertiseCount: number;
  needsFavoredEnemy: boolean;
  needsFavoredTerrain: boolean;
  needsDraconicAncestor: boolean;
  needsWarlockPatron: boolean;
  needsGenieKind: boolean;
}

export function getClassLevel1ChoicesConfig(
  className: string,
  subclassId?: string
): ClassLevel1ChoicesConfig {
  const normClass = (className || '').trim().toLowerCase();
  const normSubclass = (subclassId || '').trim().toLowerCase();

  const isFighter = normClass.includes('воин') || normClass.includes('fighter');
  const isRogue = normClass.includes('плут') || normClass.includes('rogue');
  const isRanger = normClass.includes('следопыт') || normClass.includes('ranger');
  const isSorcerer = normClass.includes('чародей') || normClass.includes('sorcerer');
  const isDraconicSorcerer = isSorcerer && (normSubclass.includes('draconic') || normSubclass.includes('дракон'));
  const isWarlock = normClass.includes('колдун') || normClass.includes('warlock');
  const isGenieWarlock = isWarlock && (normSubclass.includes('genie') || normSubclass.includes('джинн'));

  return {
    needsFightingStyle: isFighter,
    needsExpertise: isRogue,
    expertiseCount: isRogue ? 2 : 0,
    needsFavoredEnemy: isRanger,
    needsFavoredTerrain: isRanger,
    needsDraconicAncestor: isDraconicSorcerer,
    needsWarlockPatron: isWarlock,
    needsGenieKind: isGenieWarlock
  };
}
