// D&D 5e Character Sheet — Types, Calculation Engine & Universal Level-Up System

export const ABILITY_NAMES = ['СИЛ', 'ЛОВ', 'ТЕЛ', 'ИНТ', 'МДР', 'ХАР'] as const;
export type AbilityName = typeof ABILITY_NAMES[number];

export const ABILITY_FULL: Record<AbilityName, string> = {
  'СИЛ': 'Сила',
  'ЛОВ': 'Ловкость',
  'ТЕЛ': 'Телосложение',
  'ИНТ': 'Интеллект',
  'МДР': 'Мудрость',
  'ХАР': 'Харизма',
};

export const SKILL_MAP: Record<string, AbilityName> = {
  'Акробатика': 'ЛОВ',
  'Анализ': 'ИНТ',
  'Атлетика': 'СИЛ',
  'Внимательность': 'МДР',
  'Выживание': 'МДР',
  'Выступление': 'ХАР',
  'Запугивание': 'ХАР',
  'История': 'ИНТ',
  'Ловкость рук': 'ЛОВ',
  'Магия': 'ИНТ',
  'Медицина': 'МДР',
  'Обман': 'ХАР',
  'Природа': 'ИНТ',
  'Проницательность': 'МДР',
  'Религия': 'ИНТ',
  'Скрытность': 'ЛОВ',
  'Убеждение': 'ХАР',
  'Уход за животными': 'МДР',
};

export const ALL_SKILLS = Object.keys(SKILL_MAP);

export interface Attack {
  name: string;
  attackBonus: string;
  damageAndType: string;
}

export interface SpellSlotInfo {
  totalSlots: number;
  expendedSlots: number;
}

export interface SpellEntry {
  name: string;
  prepared: boolean;
}

// ── Level-up entry: structured data for all changes ──
export interface TraitItem {
  id: string;
  name: string;
  source?: string;
  summary?: string;
  description?: string;
}

export interface LevelUpEntry {
  level: number;
  hpGained: number;
  asiAbilities: [AbilityName, AbilityName] | null; // which +1 each, or null if no ASI
  notes: string;             // freeform: subclass, new features, etc. → goes to featuresTraits

  // Structured additions (tracked for level-down rollback)
  newCantrips: string[];                              // cantrip names added
  newSpells: { level: number; name: string; prepared: boolean }[];  // spells by level
  newSavingThrowProfs: AbilityName[];                 // new saving throw proficiencies
  newSkillProfs: string[];                            // new skill proficiencies
  newSkillExpertise: string[];                        // new skill expertise
  newAttacks: Attack[];                               // new attacks added
  newProficienciesText: string;                       // text to append to otherProficienciesLanguages
  newEquipmentText: string;                           // text to append to equipment
}

export interface CharacterData {
  // Basic Info
  name: string;
  className: string;
  level: number;
  background: string;
  playerName: string;
  race: string;
  alignment: string;
  experiencePoints: number;
  inspiration: boolean;

  // Ability Scores (base)
  abilityScores: Record<AbilityName, number>;
  // Racial / Other bonuses
  abilityBonuses: Record<AbilityName, number>;
  // ASI bonuses (from level-ups)
  asiBonuses: Record<AbilityName, number>;

  // Saving throw proficiencies
  savingThrowProficiencies: Record<AbilityName, boolean>;

  // Skill proficiencies & expertise
  skillProficiencies: Record<string, boolean>;
  skillExpertise: Record<string, boolean>;

  // Combat
  armorClass: number | null;
  initiativeOverride: number | null;
  speed: number;
  hpMax: number | null;
  hpCurrent: number;
  hpTemp: number;
  hitDice: string;

  // Death saves
  deathSaveSuccesses: number;
  deathSaveFailures: number;

  // Attacks
  attacks: Attack[];

  // Currency
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;

  // Personality
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;

  // Other
  otherProficienciesLanguages: string;
  featuresTraits: string;
  traitsList?: TraitItem[];
  equipment: string;

  // Page 2
  age: string;
  height: string;
  weight: string;
  eyes: string;
  skin: string;
  hair: string;
  appearance: string;
  alliesOrganizations: string;
  additionalFeaturesTraits: string;
  backstory: string;
  treasure: string;

  // Page 3: Spellcasting
  spellcastingClass: string;
  spellcastingAbility: AbilityName | '';
  spellSlots: Record<number, SpellSlotInfo>;
  cantrips: string[];
  spellsByLevel: Record<number, SpellEntry[]>;

  // Level-up history
  levelHistory: LevelUpEntry[];
}

// ── Universal Calculation Functions ──

export function calcModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Universal proficiency bonus by level
export function calcProficiencyBonus(level: number): number {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

// Universal ASI levels (standard 5e: 4,8,12,16,19)
export const STANDARD_ASI_LEVELS = [4, 8, 12, 16, 19];

export function isStandardASILevel(level: number): boolean {
  return STANDARD_ASI_LEVELS.includes(level);
}

// Universal milestones by level
export const UNIVERSAL_MILESTONES: Record<number, string[]> = {
  1:  ['Классовые особенности 1-го уровня'],
  2:  ['Классовые особенности 2-го уровня'],
  3:  ['Выбор подкласса / Архетипа'],
  4:  ['Улучшение характеристики (АСИ) или черта'],
  5:  ['Бонус мастерства +3'],
  6:  ['Классовые особенности 6-го уровня'],
  7:  ['Классовые особенности 7-го уровня'],
  8:  ['Улучшение характеристики (АСИ) или черта'],
  9:  ['Бонус мастерства +4'],
  10: ['Классовые особенности 10-го уровня'],
  11: ['Классовые особенности 11-го уровня'],
  12: ['Улучшение характеристики (АСИ) или черта'],
  13: ['Бонус мастерства +5'],
  14: ['Классовые особенности 14-го уровня'],
  15: ['Классовые особенности 15-го уровня'],
  16: ['Улучшение характеристики (АСИ) или черта'],
  17: ['Бонус мастерства +6'],
  18: ['Классовые особенности 18-го уровня'],
  19: ['Улучшение характеристики (АСИ) или черта'],
  20: ['Классовые особенности 20-го уровня (макс.)'],
};

export function getMilestonesAtLevel(level: number): string[] {
  return UNIVERSAL_MILESTONES[level] || [];
}

export function getTotalScore(char: CharacterData, ability: AbilityName): number {
  return (char.abilityScores[ability] || 10) + (char.abilityBonuses[ability] || 0) + (char.asiBonuses[ability] || 0);
}

export function getModifier(char: CharacterData, ability: AbilityName): number {
  return calcModifier(getTotalScore(char, ability));
}

export function getSavingThrow(char: CharacterData, ability: AbilityName): number {
  let mod = getModifier(char, ability);
  if (char.savingThrowProficiencies[ability]) {
    mod += calcProficiencyBonus(char.level);
  }
  return mod;
}

export function getSkillBonus(char: CharacterData, skill: string): number {
  const ability = SKILL_MAP[skill] || 'СИЛ';
  let mod = getModifier(char, ability);
  if (char.skillExpertise[skill]) {
    mod += calcProficiencyBonus(char.level) * 2;
  } else if (char.skillProficiencies[skill]) {
    mod += calcProficiencyBonus(char.level);
  }
  return mod;
}

export function getInitiative(char: CharacterData): number {
  if (char.initiativeOverride !== null) return char.initiativeOverride;
  return getModifier(char, 'ЛОВ');
}

export function getPassivePerception(char: CharacterData): number {
  return 10 + getSkillBonus(char, 'Внимательность');
}

export function getAC(char: CharacterData): number {
  if (char.armorClass !== null) return char.armorClass;
  return 10 + getModifier(char, 'ЛОВ');
}

export function getHPMax(char: CharacterData): number {
  if (char.hpMax !== null) return char.hpMax;
  return 0;
}

export function getSpellSaveDC(char: CharacterData): number {
  if (!char.spellcastingAbility) return 0;
  return 8 + calcProficiencyBonus(char.level) + getModifier(char, char.spellcastingAbility);
}

export function getSpellAttackBonus(char: CharacterData): number {
  if (!char.spellcastingAbility) return 0;
  return calcProficiencyBonus(char.level) + getModifier(char, char.spellcastingAbility);
}

export function getSpellAbilityMod(char: CharacterData): number {
  if (!char.spellcastingAbility) return 0;
  return getModifier(char, char.spellcastingAbility);
}

// ── Hit Dice helpers ──
// Supports both English (1d8) and Russian (1к8) notation
export function getHitDieSize(hitDice: string): number {
  const match = hitDice.match(/[dк](\d+)/i);
  return match ? parseInt(match[1]) : 8;
}

// Returns the dice notation letter used in the hitDice string ('d' or 'к')
export function getHitDiceNotation(hitDice: string): string {
  const match = hitDice.match(/[dк]/i);
  return match ? match[0].toLowerCase() : 'd';
}

// Average = (1 + dieSize) / 2, rounded up (e.g. d8 → (1+8)/2 = 4.5 → 5)
export function getHitDieAverage(hitDice: string): number {
  const size = getHitDieSize(hitDice);
  return Math.ceil((1 + size) / 2);
}

// ── Create empty level-up entry ──
export function createEmptyLevelUpEntry(level: number): LevelUpEntry {
  return {
    level,
    hpGained: 0,
    asiAbilities: null,
    notes: '',
    newCantrips: [],
    newSpells: [],
    newSavingThrowProfs: [],
    newSkillProfs: [],
    newSkillExpertise: [],
    newAttacks: [],
    newProficienciesText: '',
    newEquipmentText: '',
  };
}

// ── Default Character ──

export function createDefaultCharacter(): CharacterData {
  const abilityScores: Record<AbilityName, number> = { 'СИЛ': 10, 'ЛОВ': 10, 'ТЕЛ': 10, 'ИНТ': 10, 'МДР': 10, 'ХАР': 10 };
  const abilityBonuses: Record<AbilityName, number> = { 'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0 };
  const asiBonuses: Record<AbilityName, number> = { 'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0 };
  const savingThrowProficiencies: Record<AbilityName, boolean> = { 'СИЛ': false, 'ЛОВ': false, 'ТЕЛ': false, 'ИНТ': false, 'МДР': false, 'ХАР': false };
  const skillProficiencies: Record<string, boolean> = {};
  const skillExpertise: Record<string, boolean> = {};
  for (const skill of ALL_SKILLS) {
    skillProficiencies[skill] = false;
    skillExpertise[skill] = false;
  }

  return {
    name: '',
    className: '',
    level: 1,
    background: '',
    playerName: '',
    race: '',
    alignment: '',
    experiencePoints: 0,
    inspiration: false,
    abilityScores,
    abilityBonuses,
    asiBonuses,
    savingThrowProficiencies,
    skillProficiencies,
    skillExpertise,
    armorClass: null,
    initiativeOverride: null,
    speed: 30,
    hpMax: null,
    hpCurrent: 0,
    hpTemp: 0,
    hitDice: '',
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    attacks: [{ name: '', attackBonus: '', damageAndType: '' }],
    cp: 0, sp: 0, ep: 0, gp: 0, pp: 0,
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    otherProficienciesLanguages: '',
    featuresTraits: '',
    traitsList: [],
    equipment: '',
    age: '',
    height: '',
    weight: '',
    eyes: '',
    skin: '',
    hair: '',
    appearance: '',
    alliesOrganizations: '',
    additionalFeaturesTraits: '',
    backstory: '',
    treasure: '',
    spellcastingClass: '',
    spellcastingAbility: '',
    spellSlots: {},
    cantrips: [],
    spellsByLevel: {},
    levelHistory: [],
  };
}

// ── Class Templates (Level 1) ──

export interface ClassTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  role: string;            // Роль: Танк, Боец, Контроллер, Целитель и т.д.
  hitDieSize: number;      // 6, 8, 10, 12
  primaryAbility: string;  // Основная характеристика
  savingThrowProfs: AbilityName[];
  skillChoices: number;    // Сколько навыков выбирает из списка
  skillOptions: string[];  // Доступные навыки
  recommendedSkills: string[]; // Рекомендуемые/часто выбираемые
  armorWeaponProfs: string;
  features: string;        // Умения 1-го уровня
  equipment: string;       // Типичное снаряжение
  startingGold: string;    // Стартовое золото
  spellcasting: {
    ability: AbilityName | '';
    isCaster: boolean;
    isPactMagic: boolean;  // Колдун использует Pact Magic
    cantripsKnown: number;
    spellsKnownAt1?: number;
    spellSlotsAt1?: Record<number, number>;
    cantripList?: string[];
    spellListAt1?: string[];
  };
  recommendedScores: Record<AbilityName, number>; // Standard array placement
  typicalAC: number;
  typicalAttacks: Attack[];
}

export const CLASS_TEMPLATES: ClassTemplate[] = [
  {
    id: 'barbarian',
    name: 'Варвар',
    emoji: '🪓',
    description: 'Свирепый воин, черпающий силу в первобытной ярости. Не носит тяжёлые доспехи — полагается на инстинкты и выносливость.',
    role: 'Танк / Боец ближнего боя',
    hitDieSize: 12,
    primaryAbility: 'СИЛ',
    savingThrowProfs: ['СИЛ', 'ТЕЛ'],
    skillChoices: 2,
    skillOptions: ['Атлетика', 'Выживание', 'Запугивание', 'Природа', 'Проницательность', 'Внимательность', 'Уход за животными'],
    recommendedSkills: ['Атлетика', 'Внимательность'],
    armorWeaponProfs: 'Владение: Лёгкие и средние доспехи, щиты, простое и воинское оружие',
    features: 'Ярость (2 раза)\nБез доспехов: КД = 10 + ЛОВ + ТЕЛ (без брони и щита)',
    equipment: 'Вариант A: Длинный меч (1d8/1d10 рубящий), 2 метательных топора (1d6 рубящий), Компонентная сумка\nВариант B: Боевой топор (1d8/1d10 рубящий), Ручной арбалет (20 болтов, 1d6 колющий)\nДополнительно: Кожаный доспех, Набор путешественника, 4 метальных топора',
    startingGold: '2d4 × 10 зм',
    spellcasting: { ability: '', isCaster: false, isPactMagic: false, cantripsKnown: 0 },
    recommendedScores: { 'СИЛ': 15, 'ЛОВ': 14, 'ТЕЛ': 13, 'ИНТ': 8, 'МДР': 12, 'ХАР': 10 },
    typicalAC: 15, // Без доспехов: 10 + 2(ЛОВ) + 2(ТЕЛ) = 14, или кожаный доспех 11+2=13. С Яростью КД выше
    typicalAttacks: [{ name: 'Длинный меч', attackBonus: '+5', damageAndType: '1d8+3 рубящий (1d10 двуручн.)' }],
  },
  {
    id: 'bard',
    name: 'Бард',
    emoji: '🎵',
    description: 'Мастер песен и магии, разносторонний искатель приключений. Магия через музыку и искусство, поддержка группы.',
    role: 'Поддержка / Контроллер / Целитель',
    hitDieSize: 8,
    primaryAbility: 'ХАР',
    savingThrowProfs: ['ЛОВ', 'ХАР'],
    skillChoices: 3,
    skillOptions: ALL_SKILLS.slice(), // Бард выбирает из любых навыков
    recommendedSkills: ['Убеждение', 'Обман', 'Выступление'],
    armorWeaponProfs: 'Владение: Лёгкие доспехи, простое оружие, ручные арбалеты, длинные мечи, рапиры, короткие мечи\nИнструменты: 3 музыкальных инструмента на выбор',
    features: 'Вдохновение барда (d6, столько раз, сколько мод. ХАР за отдых)\nМагия барда (заклинания)\nКомпетентность (удвоенный бонус мастерства на 2 навыка)',
    equipment: 'Рапира (1d8 колющий) ИЛИ длинный меч\nДлинный лук (20 стрел, 1d8 колющий)\nКожаный доспех, Кинжал\nМузыкальный инструмент на выбор\nНабор путешественника',
    startingGold: '5d4 × 5 зм',
    spellcasting: {
      ability: 'ХАР',
      isCaster: true,
      isPactMagic: false,
      cantripsKnown: 2,
      spellsKnownAt1: 4,
      spellSlotsAt1: { 1: 2 },
      cantripList: ['Престидижитация', 'Волшебная рука'],
      spellListAt1: ['Целительное слово', 'Осмеяние Ташы', 'Диссонантный шёпот', 'Лечебное зелье'],
    },
    recommendedScores: { 'ХАР': 15, 'ЛОВ': 14, 'ТЕЛ': 13, 'ИНТ': 10, 'МДР': 12, 'СИЛ': 8 },
    typicalAC: 13,
    typicalAttacks: [{ name: 'Рапира', attackBonus: '+4', damageAndType: '1d8+2 колющий' }],
  },
  {
    id: 'cleric',
    name: 'Жрец',
    emoji: '✝️',
    description: 'Божественный посланник, черпающий силу от божества. Мощный целитель и поддержка с готовностью к бою.',
    role: 'Целитель / Поддержка / Танк (жизнь)',
    hitDieSize: 8,
    primaryAbility: 'МДР',
    savingThrowProfs: ['МДР', 'ХАР'],
    skillChoices: 2,
    skillOptions: ['История', 'Медицина', 'Проницательность', 'Религия', 'Убеждение'],
    recommendedSkills: ['Медицина', 'Проницательность'],
    armorWeaponProfs: 'Владение: Лёгкие и средние доспехи, щиты, простое оружие',
    features: 'Божественная магия (заклинания)\nДомен божества (определяет доп. заклинания и способности)',
    equipment: 'Кольчужная рубаха (КД 13) ИЛИ кожаный доспех\nЩит\nСвятой символ\nПростое оружие на выбор (Булава)\nКомпонентная сумка\nНабор путешественника',
    startingGold: '5d4 × 5 зм',
    spellcasting: {
      ability: 'МДР',
      isCaster: true,
      isPactMagic: false,
      cantripsKnown: 3,
      spellsKnownAt1: 0, // Жрец готовит заклинания
      spellSlotsAt1: { 1: 2 },
      cantripList: ['Свет', 'Священное пламя', 'Тауматургия'],
      spellListAt1: ['Лечебное слово', 'Благословение', 'Щит веры', 'Ведовство'],
    },
    recommendedScores: { 'МДР': 15, 'ТЕЛ': 14, 'СИЛ': 13, 'ХАР': 12, 'ИНТ': 10, 'ЛОВ': 8 },
    typicalAC: 18, // Кольчужная рубаха 13 + щит 2 + ЛОВ(8→-1) = 14... нет, 13+2=15, +1 ЛОВ = 16. С доменом Жизни ещё +1. 16-18
    typicalAttacks: [{ name: 'Булава', attackBonus: '+4', damageAndType: '1d6+2 дробящий' }],
  },
  {
    id: 'druid',
    name: 'Друид',
    emoji: '🌿',
    description: 'Жрец природы, повелевающий стихиями и зверями. Обличье дикого зверя и природная магия.',
    role: 'Контроллер / Целитель / Призыватель',
    hitDieSize: 8,
    primaryAbility: 'МДР',
    savingThrowProfs: ['ИНТ', 'МДР'],
    skillChoices: 2,
    skillOptions: ['Анализ', 'Природа', 'Внимательность', 'Медицина', 'Проницательность', 'Выживание', 'Уход за животными'],
    recommendedSkills: ['Выживание', 'Внимательность'],
    armorWeaponProfs: 'Владение: Лёгкие и средние доспехи (неметаллические), щиты (неметаллические), кинжалы, дротики, посохи, булавы, серпы, арбалеты\nИнструменты: Набор травника',
    features: 'Друидическая магия (заклинания)\nДикий облик (2 раза, CR 1/4)\nДруидский язык',
    equipment: 'Кожаный доспех\nЩит (деревянный)\nПосох ИЛИ серп\nКомпонентная сумка (фокус: друидический фокус)\nНабор путешественника\nНабор травника',
    startingGold: '2d6 × 10 зм',
    spellcasting: {
      ability: 'МДР',
      isCaster: true,
      isPactMagic: false,
      cantripsKnown: 2,
      spellsKnownAt1: 0, // Готовит заклинания
      spellSlotsAt1: { 1: 2 },
      cantripList: ['Опутывание', 'Друидское ремесло'],
      spellListAt1: ['Лечебное слово', 'Громовая волна', 'Обнаружение магии', 'Цепкая лоза'],
    },
    recommendedScores: { 'МДР': 15, 'ТЕЛ': 14, 'ЛОВ': 13, 'ИНТ': 12, 'ХАР': 10, 'СИЛ': 8 },
    typicalAC: 15, // Кожаный доспех 11 + щит 2 + ЛОВ+1 = 14... нет, 11+1+2=14
    typicalAttacks: [{ name: 'Посох', attackBonus: '+2', damageAndType: '1d6 дробящий' }],
  },
  {
    id: 'fighter',
    name: 'Воин',
    emoji: '⚔️',
    description: 'Универсальный мастер боевых искусств. Больше всех атак, восстановление здоровья, боевые стили.',
    role: 'Боец / Танк',
    hitDieSize: 10,
    primaryAbility: 'СИЛ ИЛИ ЛОВ',
    savingThrowProfs: ['СИЛ', 'ТЕЛ'],
    skillChoices: 2,
    skillOptions: ['Акробатика', 'Анализ', 'Внимательность', 'Выживание', 'Запугивание', 'История', 'Атлетика', 'Уход за животными'],
    recommendedSkills: ['Атлетика', 'Внимательность'],
    armorWeaponProfs: 'Владение: Все доспехи, щиты, простое и воинское оружие',
    features: 'Боевой стиль (на выбор: Оборона, Дуэлянт, Дробящий удар, Великий бой, Защита, Стрельба, Двуручное оружие)\nВторое дыхание (восст. 1d10+ур. хитов, 1/короткий отдых)',
    equipment: 'Вариант A: Кольчуга (КД 16), Щит, Длинный меч (1d8/1d10)\nВариант B: Кожаный доспех, Длинный лук (1d8), Рапира (1d8) — для ЛОВ-воина\nДополнительно: Лёгкий арбалет (20 болтов), 2 метательных топора, Набор путешественника',
    startingGold: '5d4 × 10 зм',
    spellcasting: { ability: '', isCaster: false, isPactMagic: false, cantripsKnown: 0 },
    recommendedScores: { 'СИЛ': 15, 'ЛОВ': 14, 'ТЕЛ': 13, 'ИНТ': 10, 'МДР': 12, 'ХАР': 8 },
    typicalAC: 18, // Кольчуга 16 + щит 2
    typicalAttacks: [{ name: 'Длинный меч', attackBonus: '+5', damageAndType: '1d8+3 рубящий (1d10 двуручн.)' }],
  },
  {
    id: 'monk',
    name: 'Монах',
    emoji: '👊',
    description: 'Мастер боевых искусств, использующий энергию ки. Скорость, оголённые удары и мистические способности.',
    role: 'Боец / Скаут',
    hitDieSize: 8,
    primaryAbility: 'ЛОВ и МДР',
    savingThrowProfs: ['СИЛ', 'ЛОВ'],
    skillChoices: 2,
    skillOptions: ['Акробатика', 'Атлетика', 'История', 'Проницательность', 'Религия', 'Скрытность'],
    recommendedSkills: ['Акробатика', 'Проницательность'],
    armorWeaponProfs: 'Владение: Простое оружие, короткие мечи\nИнструменты: Один инструмент или музыкальный инструмент на выбор',
    features: 'Без доспехов: КД = 10 + ЛОВмод + МДРмод\nБоевые искусства (d4 без оружия, бонусное действие: удар, 10 футов скорости)\nКи: 1 очко (бросок за атаку, Уклонение, Шаг ветра)',
    equipment: 'Короткий меч (1d6 колющий)\n10 дротиков (1d4 колющий)\nНабор путешественника\nИнструмент на выбор',
    startingGold: '5d4 зм',
    spellcasting: { ability: '', isCaster: false, isPactMagic: false, cantripsKnown: 0 },
    recommendedScores: { 'ЛОВ': 15, 'МДР': 14, 'СИЛ': 13, 'ТЕЛ': 12, 'ИНТ': 10, 'ХАР': 8 },
    typicalAC: 16, // 10 + 2(ЛОВ) + 2(МДР) при стандартном массиве + расовые бонусы
    typicalAttacks: [{ name: 'Без оружия', attackBonus: '+4', damageAndType: '1d4+2 дробящий' }, { name: 'Короткий меч', attackBonus: '+4', damageAndType: '1d6+2 колющий' }],
  },
  {
    id: 'paladin',
    name: 'Паладин',
    emoji: '🛡️',
    description: 'Святой воин, связанный священной клятвой. Исцеляет прикосновением, бьёт божественной карой.',
    role: 'Танк / Целитель / Боец',
    hitDieSize: 10,
    primaryAbility: 'СИЛ и ХАР',
    savingThrowProfs: ['МДР', 'ХАР'],
    skillChoices: 2,
    skillOptions: ['Атлетика', 'Проницательность', 'Запугивание', 'Медицина', 'Убеждение', 'Религия'],
    recommendedSkills: ['Убеждение', 'Атлетика'],
    armorWeaponProfs: 'Владение: Все доспехи, щиты, простое и воинское оружие',
    features: 'Божественное чувство (60 фт., обнаружение нежити/потусторонних)\nВозложение рук (ХП = уровень паладина × 5)\nБоевой стиль (Оборона, Дуэлянт, Великий бой, Защита)',
    equipment: 'Кольчуга (КД 16)\nЩит\nДлинный меч (1d8/1d10 рубящий) ИЛИ боевой топор\n5 копий (1d6 колющий, метательное)\nСвятой символ\nНабор путешественника',
    startingGold: '5d4 × 10 зм',
    spellcasting: {
      ability: 'ХАР',
      isCaster: true,
      isPactMagic: false,
      cantripsKnown: 0,
      spellsKnownAt1: 0, // Готовит заклинания со 2-го уровня
      spellSlotsAt1: {},
      cantripList: [],
      spellListAt1: [],
    },
    recommendedScores: { 'СИЛ': 15, 'ХАР': 14, 'ТЕЛ': 13, 'МДР': 12, 'ИНТ': 8, 'ЛОВ': 10 },
    typicalAC: 18,
    typicalAttacks: [{ name: 'Длинный меч', attackBonus: '+5', damageAndType: '1d8+3 рубящий' }],
  },
  {
    id: 'ranger',
    name: 'Следопыт',
    emoji: '🏹',
    description: 'Охотник и следопыт, мастер выживания в дикой природе. Боец дальнего боя с природной магией.',
    role: 'Боец дальнего боя / Скаут',
    hitDieSize: 10,
    primaryAbility: 'ЛОВ и МДР',
    savingThrowProfs: ['СИЛ', 'ЛОВ'],
    skillChoices: 3,
    skillOptions: ['Анализ', 'Атлетика', 'Внимательность', 'Выживание', 'Природа', 'Проницательность', 'Скрытность', 'Уход за животными'],
    recommendedSkills: ['Выживание', 'Внимательность', 'Скрытность'],
    armorWeaponProfs: 'Владение: Лёгкие и средние доспехи, щиты, простое и воинское оружие',
    features: 'Излюбленный враг (доп. урон 2d6, преимущество на отслеживание)\nЕстественный странник (трудная местность, затруднённые поиски пищи)\nБоевой стиль (Стрельба, Оборона, Двуручное оружие, Дуэлянт)',
    equipment: 'Длинный лук (20 стрел, 1d8 колющий)\nДва коротких меча (1d6 колющий) ИЛИ две рапиры\nЧешуйчатый доспех (КД 14 + ЛОВмод, макс. 2)\nНабор путешественника\nНабор ловушки',
    startingGold: '5d4 × 10 зм',
    spellcasting: {
      ability: 'МДР',
      isCaster: true,
      isPactMagic: false,
      cantripsKnown: 0, // Со 2-го уровня
      spellsKnownAt1: 0,
      spellSlotsAt1: {},
      cantripList: [],
      spellListAt1: [],
    },
    recommendedScores: { 'ЛОВ': 15, 'МДР': 14, 'ТЕЛ': 13, 'СИЛ': 12, 'ИНТ': 10, 'ХАР': 8 },
    typicalAC: 16, // Чешуйчатый доспех 14 + 2 ЛОВ
    typicalAttacks: [{ name: 'Длинный лук', attackBonus: '+5', damageAndType: '1d8+2 колющий' }, { name: 'Короткий меч', attackBonus: '+5', damageAndType: '1d6+2 колющий' }],
  },
  {
    id: 'rogue',
    name: 'Плут',
    emoji: '🗡️',
    description: 'Мастер скрытности и ловкости. Скрытая атака наносит огромный урон, а навыки открывают любые двери.',
    role: 'Скаут / Боец (скрытность)',
    hitDieSize: 8,
    primaryAbility: 'ЛОВ',
    savingThrowProfs: ['ЛОВ', 'ИНТ'],
    skillChoices: 4,
    skillOptions: ['Акробатика', 'Атлетика', 'Обман', 'Ловкость рук', 'Проницательность', 'Запугивание', 'Анализ', 'Скрытность', 'Внимательность', 'Выступление'],
    recommendedSkills: ['Скрытность', 'Ловкость рук', 'Проницательность', 'Обман'],
    armorWeaponProfs: 'Владение: Лёгкие доспехи, простое оружие, ручные арбалеты, длинные мечи, рапиры, короткие мечи\nИнструменты: Набор вора',
    features: 'Скрытая атака (1d6, преимущество или союзник рядом)\nЖульничество (компетентность на 2 навыка) — уже учтено как экспертиза\nАрсенал вора (вскрытие замков, обезвреживание ловушек)',
    equipment: 'Рапира (1d8 колющий) ИЛИ короткий меч\nКороткий лук (20 стрел, 1d6 колющий) ИЛИ короткий меч\nКожаный доспех\n2 кинжала (1d4 колющий)\nНабор вора\nНабор путешественника',
    startingGold: '4d4 × 10 зм',
    spellcasting: { ability: '', isCaster: false, isPactMagic: false, cantripsKnown: 0 },
    recommendedScores: { 'ЛОВ': 15, 'ТЕЛ': 14, 'ХАР': 13, 'ИНТ': 12, 'МДР': 10, 'СИЛ': 8 },
    typicalAC: 14, // Кожаный доспех 11 + 3(ЛОВ) = 14
    typicalAttacks: [{ name: 'Рапира', attackBonus: '+5', damageAndType: '1d8+3 колющий + 1d6 скрыт.' }],
  },
  {
    id: 'sorcerer',
    name: 'Чародей',
    emoji: '🔮',
    description: 'Прирождённый маг с магией в крови. Меньше заклинаний, но может видоизменять их на лету метамагией.',
    role: 'Контроллер / Боец (магия)',
    hitDieSize: 6,
    primaryAbility: 'ХАР',
    savingThrowProfs: ['ТЕЛ', 'ХАР'],
    skillChoices: 2,
    skillOptions: ['Анализ', 'Магия', 'Обман', 'Запугивание', 'Убеждение', 'Проницательность'],
    recommendedSkills: ['Убеждение', 'Магия'],
    armorWeaponProfs: 'Владение: Простое оружие\nИнструменты: Нет',
    features: 'Источник магии (происхождение: Драконья кровь, Дикий маг, Бурейная магия и др.)\nМагические очки (1 очко)\nГибкое заклинание (очко → ячейка)\nТихое заклинание (очко → без слов/жестов)',
    equipment: '2 кинжала (1d4 колющий)\nКомпонентная сумка ИЛИ магический фокус\nНабор путешественника',
    startingGold: '3d4 × 10 зм',
    spellcasting: {
      ability: 'ХАР',
      isCaster: true,
      isPactMagic: false,
      cantripsKnown: 4,
      spellsKnownAt1: 2,
      spellSlotsAt1: { 1: 2 },
      cantripList: ['Огненный снаряд', 'Престидижитация', 'Луч мороза', 'Маленькая иллюзия'],
      spellListAt1: ['Магический снаряд', 'Щит'],
    },
    recommendedScores: { 'ХАР': 15, 'ТЕЛ': 14, 'ЛОВ': 13, 'МДР': 12, 'ИНТ': 10, 'СИЛ': 8 },
    typicalAC: 13, // Драконья кровь может дать +3 без доспехов, иначе 10+1 ЛОВ
    typicalAttacks: [{ name: 'Огненный снаряд', attackBonus: '+5', damageAndType: '1d10+3 огонь (дальность)' }],
  },
  {
    id: 'warlock',
    name: 'Колдун',
    emoji: '🌑',
    description: 'Маг, заключивший сделку с могущественным патроном. Мало ячеек, но они восстанавливаются после короткого отдыха.',
    role: 'Контроллер / Боец (магия)',
    hitDieSize: 8,
    primaryAbility: 'ХАР',
    savingThrowProfs: ['МДР', 'ХАР'],
    skillChoices: 2,
    skillOptions: ['Анализ', 'Обман', 'История', 'Запугивание', 'Магия', 'Природа', 'Религия'],
    recommendedSkills: ['Запугивание', 'Обман'],
    armorWeaponProfs: 'Владение: Лёгкие доспехи, простое оружие\nИнструменты: Нет',
    features: 'Пакт с покровителем (Архифей, Демон, Великий Древний и др.)\nМагия пакта (заклинания)\nДар покровителя (доп. заклинание)\nМистическое возрождение (ячеек мало, но восстанавливаются после короткого отдыха)',
    equipment: 'Лёгкий арбалет (20 болтов, 1d8 колющий)\nКомпонентная сумка ИЛИ магический фокус\nКожаный доспех\n2 кинжала\nНабор путешественника\nРитуальная книга ИЛИ магический фокус',
    startingGold: '4d4 × 10 зм',
    spellcasting: {
      ability: 'ХАР',
      isCaster: true,
      isPactMagic: true,
      cantripsKnown: 2,
      spellsKnownAt1: 2,
      spellSlotsAt1: { 1: 1 },
      cantripList: ['Мистический заряд', 'Престидижитация'],
      spellListAt1: ['Проклятие гексблейда', 'Чарующий взгляд'],
    },
    recommendedScores: { 'ХАР': 15, 'ЛОВ': 14, 'ТЕЛ': 13, 'ИНТ': 12, 'МДР': 10, 'СИЛ': 8 },
    typicalAC: 13, // Кожаный доспех 11 + 2 ЛОВ
    typicalAttacks: [{ name: 'Лёгкий арбалет', attackBonus: '+4', damageAndType: '1d8 колющий' }],
  },
  {
    id: 'wizard',
    name: 'Волшебник',
    emoji: '📖',
    description: 'Мастер арканы, изучающий магию через книги и свитки. Самый большой список заклинаний, магическая книга.',
    role: 'Контроллер / Боец (магия) / Утилити',
    hitDieSize: 6,
    primaryAbility: 'ИНТ',
    savingThrowProfs: ['ИНТ', 'МДР'],
    skillChoices: 2,
    skillOptions: ['Анализ', 'История', 'Магия', 'Медицина', 'Природа', 'Проницательность', 'Религия'],
    recommendedSkills: ['Магия', 'Анализ'],
    armorWeaponProfs: 'Владение: Кинжалы, дротики, пращи, посохи\nИнструменты: Нет',
    features: 'Восстановление дуги (восст. ячейку уровня ≤ ИНТмод за короткий отдых)\nКнига заклинаний (6 заклинаний 1-го уровня)',
    equipment: 'Посох (1d6 дробящий) ИЛИ кинжал\nКомпонентная сумка ИЛИ магический фокус (посох)\nКнига заклинаний\nНабор учёного ИЛИ набор путешественника',
    startingGold: '4d4 × 10 зм',
    spellcasting: {
      ability: 'ИНТ',
      isCaster: true,
      isPactMagic: false,
      cantripsKnown: 3,
      spellsKnownAt1: 0, // Волшебник готовит из книги
      spellSlotsAt1: { 1: 2 },
      cantripList: ['Огненный снаряд', 'Престидижитация', 'Маленькая иллюзия'],
      spellListAt1: ['Магический снаряд', 'Щит', 'Доспех мага', 'Обнаружение магии', 'Опознание', 'Волна грома'],
    },
    recommendedScores: { 'ИНТ': 15, 'ЛОВ': 14, 'ТЕЛ': 13, 'МДР': 12, 'ХАР': 10, 'СИЛ': 8 },
    typicalAC: 12, // 10 + 2 ЛОВ (без доспехов), Доспех мага временно даёт 13
    typicalAttacks: [{ name: 'Огненный снаряд', attackBonus: '+5', damageAndType: '1d10+3 огонь' }],
  },
];

/** Apply a class template to a fresh character at level 1 */
export function applyClassTemplate(templateId: string): CharacterData {
  const template = CLASS_TEMPLATES.find(t => t.id === templateId);
  if (!template) return createDefaultCharacter();

  const char = createDefaultCharacter();
  char.className = template.name;
  char.hitDice = `1d${template.hitDieSize}`;

  // Ability scores from standard array
  char.abilityScores = { ...template.recommendedScores };

  // Saving throw proficiencies
  for (const ab of template.savingThrowProfs) {
    char.savingThrowProficiencies[ab] = true;
  }

  // Skill proficiencies (recommended)
  for (const skill of template.recommendedSkills) {
    if (skill in char.skillProficiencies) {
      char.skillProficiencies[skill] = true;
    }
  }
  // Rogue expertise at level 1
  if (templateId === 'rogue') {
    for (const skill of template.recommendedSkills.slice(0, 2)) {
      if (skill in char.skillExpertise) {
        char.skillExpertise[skill] = true;
      }
    }
  }

  // Features
  char.featuresTraits = template.features;

  // Equipment
  char.equipment = template.equipment;

  // Proficiencies & languages
  char.otherProficienciesLanguages = template.armorWeaponProfs;

  // AC
  char.armorClass = template.typicalAC;

  // HP: max hit die + CON mod at level 1
  const conMod = calcModifier(char.abilityScores['ТЕЛ']);
  char.hpMax = template.hitDieSize + conMod;
  char.hpCurrent = char.hpMax;

  // Attacks
  char.attacks = template.typicalAttacks.length > 0 ? [...template.typicalAttacks] : [{ name: '', attackBonus: '', damageAndType: '' }];

  // Spellcasting
  if (template.spellcasting.isCaster) {
    char.spellcastingClass = template.name;
    char.spellcastingAbility = template.spellcasting.ability;

    if (template.spellcasting.spellSlotsAt1) {
      const slots: Record<number, SpellSlotInfo> = {};
      for (const [lvl, count] of Object.entries(template.spellcasting.spellSlotsAt1)) {
        slots[Number(lvl)] = { totalSlots: count, expendedSlots: 0 };
      }
      char.spellSlots = slots;
    }

    if (template.spellcasting.cantripList && template.spellcasting.cantripList.length > 0) {
      char.cantrips = [...template.spellcasting.cantripList];
    }

    if (template.spellcasting.spellListAt1 && template.spellcasting.spellListAt1.length > 0) {
      const spells: SpellEntry[] = template.spellcasting.spellListAt1.map(name => ({ name, prepared: true }));
      char.spellsByLevel = { 1: spells };
    }
  }

  return char;
}

// ── Example Characters ──

export function createExampleWarrior(): CharacterData {
  const char = createDefaultCharacter();
  char.name = 'Торин Каменный Щит';
  char.className = 'Воин';
  char.level = 5;
  char.background = 'Солдат';
  char.playerName = 'Алексей';
  char.race = 'Дворф (Горный)';
  char.alignment = 'Законно-добрый';
  char.experiencePoints = 6500;
  char.inspiration = true;
  char.abilityScores = { 'СИЛ': 16, 'ЛОВ': 10, 'ТЕЛ': 14, 'ИНТ': 8, 'МДР': 12, 'ХАР': 10 };
  char.abilityBonuses = { 'СИЛ': 2, 'ЛОВ': 0, 'ТЕЛ': 2, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0 };
  char.asiBonuses = { 'СИЛ': 2, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0 };
  char.savingThrowProficiencies = { 'СИЛ': true, 'ЛОВ': false, 'ТЕЛ': true, 'ИНТ': false, 'МДР': false, 'ХАР': false };
  char.skillProficiencies = {
    'Акробатика': false, 'Анализ': false, 'Атлетика': true,
    'Внимательность': true, 'Выживание': false, 'Выступление': false,
    'Запугивание': true, 'История': false, 'Ловкость рук': false,
    'Магия': false, 'Медицина': false, 'Обман': false,
    'Природа': false, 'Проницательность': false, 'Религия': false,
    'Скрытность': false, 'Убеждение': false, 'Уход за животными': false,
  };
  char.armorClass = 18;
  char.speed = 25;
  char.hpMax = 49;
  char.hpCurrent = 49;
  char.hitDice = '5d10';
  char.attacks = [
    { name: 'Боевой топор +1', attackBonus: '+7', damageAndType: '1d8+4 рубящий' },
    { name: 'Ручной арбалет', attackBonus: '+5', damageAndType: '1d6 колющий' },
  ];
  char.cp = 47; char.sp = 12; char.gp = 85; char.pp = 2;
  char.personalityTraits = 'Я всегда планирую заранее, даже в самых простых ситуациях.';
  char.ideals = 'Честь — превыше всего. Моё слово — закон.';
  char.bonds = 'Я сражаюсь за тех, кто не может постоять за себя.';
  char.flaws = 'Я слишком упрям и редко меняю своё решение.';
  char.otherProficienciesLanguages = 'Владение: Все доспехи, щиты, простое и воинское оружие\nИнструменты: Набор кузнеца\nЯзыки: Общий, Дворфийский';
  char.featuresTraits = 'Боевой стиль (Оборона)\nВторое дыхание\nДейственный удар\nУлучшение характеристики: СИЛ +2\nДополнительная атака\nДворфья выносливость\nЗнание камня';
  char.equipment = 'Кольчуга, Щит, Боевой топор +1, Ручной арбалет (20 болтов), Набор путешественника';
  char.age = '62'; char.height = '135 см'; char.weight = '77 кг';
  char.eyes = 'Карие'; char.skin = 'Загорелая'; char.hair = 'Рыжая';
  char.appearance = 'Коренастый дворф с широкой грудью и мощными руками кузнеца. Рыжая борода заплетена в косы.';
  char.backstory = 'Торин родился в Цитадели Адбар в клане кузнецов. Вместо кузницы выбрал путь воина.';
  char.levelHistory = [
    { level: 2, hpGained: 7, asiAbilities: null, notes: 'Действенный удар', newCantrips: [], newSpells: [], newSavingThrowProfs: [], newSkillProfs: [], newSkillExpertise: [], newAttacks: [], newProficienciesText: '', newEquipmentText: '' },
    { level: 3, hpGained: 7, asiAbilities: null, notes: 'Архетип воина: Мастер боевых искусств', newCantrips: [], newSpells: [], newSavingThrowProfs: [], newSkillProfs: [], newSkillExpertise: [], newAttacks: [], newProficienciesText: '', newEquipmentText: '' },
    { level: 4, hpGained: 7, asiAbilities: ['СИЛ', 'СИЛ'], notes: 'Улучшение характеристики', newCantrips: [], newSpells: [], newSavingThrowProfs: [], newSkillProfs: [], newSkillExpertise: [], newAttacks: [], newProficienciesText: '', newEquipmentText: '' },
    { level: 5, hpGained: 9, asiAbilities: null, notes: 'Дополнительная атака', newCantrips: [], newSpells: [], newSavingThrowProfs: [], newSkillProfs: [], newSkillExpertise: [], newAttacks: [], newProficienciesText: '', newEquipmentText: '' },
  ];
  return char;
}

export function createExampleWizard(): CharacterData {
  const char = createDefaultCharacter();
  char.name = 'Элара Звёздный Ветер';
  char.className = 'Волшебник';
  char.level = 5;
  char.background = 'Мудрец';
  char.playerName = 'Мария';
  char.race = 'Высший эльф';
  char.alignment = 'Хаотично-добрый';
  char.abilityScores = { 'СИЛ': 8, 'ЛОВ': 14, 'ТЕЛ': 12, 'ИНТ': 17, 'МДР': 12, 'ХАР': 10 };
  char.abilityBonuses = { 'СИЛ': 0, 'ЛОВ': 2, 'ТЕЛ': 0, 'ИНТ': 1, 'МДР': 0, 'ХАР': 0 };
  char.asiBonuses = { 'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 2, 'МДР': 0, 'ХАР': 0 };
  char.savingThrowProficiencies = { 'СИЛ': false, 'ЛОВ': false, 'ТЕЛ': false, 'ИНТ': true, 'МДР': true, 'ХАР': false };
  char.skillProficiencies = {
    'Акробатика': false, 'Анализ': true, 'Атлетика': false,
    'Внимательность': false, 'Выживание': false, 'Выступление': false,
    'Запугивание': false, 'История': true, 'Ловкость рук': false,
    'Магия': true, 'Медицина': false, 'Обман': false,
    'Природа': false, 'Проницательность': true, 'Религия': true,
    'Скрытность': false, 'Убеждение': false, 'Уход за животными': false,
  };
  char.armorClass = 12;
  char.speed = 30;
  char.hpMax = 28;
  char.hpCurrent = 28;
  char.hitDice = '5d6';
  char.attacks = [{ name: 'Огненный снаряд', attackBonus: '+7', damageAndType: '1d10+4 огонь' }];
  char.sp = 8; char.gp = 42;
  char.personalityTraits = 'Я одержима знаниями и всегда ищу новые заклинания.';
  char.ideals = 'Знание должно быть свободным.';
  char.bonds = 'Древний гримуар моей наставницы — моя самая ценная вещь.';
  char.flaws = 'Я легко отвлекаюсь на интересные магические феномены.';
  char.otherProficienciesLanguages = 'Кинжалы, дротики, пращи, посохи\nЯзыки: Общий, Эльфийский, Драконий';
  char.featuresTraits = 'Восстановление дуги\nЗачарование\nТрадиция: Школа Воплощения\nУлучшение характеристики: ИНТ +2';
  char.equipment = 'Посох, Компонентная сумка, Книга заклинаний, Набор учёного';
  char.age = '125'; char.height = '170 см'; char.weight = '59 кг';
  char.eyes = 'Серебристые'; char.skin = 'Бледная'; char.hair = 'Чёрная с серебром';
  char.spellcastingClass = 'Волшебник';
  char.spellcastingAbility = 'ИНТ';
  char.spellSlots = { 1: { totalSlots: 4, expendedSlots: 0 }, 2: { totalSlots: 3, expendedSlots: 0 }, 3: { totalSlots: 2, expendedSlots: 0 } };
  char.cantrips = ['Огненный снаряд', 'Маленькая иллюзия', 'Престидижитация', 'Луч мороза'];
  char.spellsByLevel = {
    1: [{ name: 'Опознание', prepared: true }, { name: 'Магический снаряд', prepared: true }, { name: 'Щит', prepared: true }, { name: 'Доспех мага', prepared: true }, { name: 'Обнаружение магии', prepared: true }, { name: 'Волна грома', prepared: false }],
    2: [{ name: 'Невидимость', prepared: true }, { name: 'Паутина', prepared: true }, { name: 'Туманный шаг', prepared: true }],
    3: [{ name: 'Огненный шар', prepared: true }, { name: 'Молния', prepared: true }],
  };
  char.levelHistory = [
    { level: 2, hpGained: 5, asiAbilities: null, notes: 'Традиция волшебства: Школа Воплощения', newCantrips: [], newSpells: [], newSavingThrowProfs: [], newSkillProfs: [], newSkillExpertise: [], newAttacks: [], newProficienciesText: '', newEquipmentText: '' },
    { level: 3, hpGained: 5, asiAbilities: null, notes: 'Заклинания 2 уровня', newCantrips: [], newSpells: [{ level: 2, name: 'Невидимость', prepared: true }, { level: 2, name: 'Паутина', prepared: true }, { level: 2, name: 'Туманный шаг', prepared: true }], newSavingThrowProfs: [], newSkillProfs: [], newSkillExpertise: [], newAttacks: [], newProficienciesText: '', newEquipmentText: '' },
    { level: 4, hpGained: 5, asiAbilities: ['ИНТ', 'ИНТ'], notes: 'Улучшение характеристики', newCantrips: [], newSpells: [], newSavingThrowProfs: [], newSkillProfs: [], newSkillExpertise: [], newAttacks: [], newProficienciesText: '', newEquipmentText: '' },
    { level: 5, hpGained: 5, asiAbilities: null, notes: 'Заклинания 3 уровня', newCantrips: [], newSpells: [{ level: 3, name: 'Огненный шар', prepared: true }, { level: 3, name: 'Молния', prepared: true }], newSavingThrowProfs: [], newSkillProfs: [], newSkillExpertise: [], newAttacks: [], newProficienciesText: '', newEquipmentText: '' },
  ];
  return char;
}
