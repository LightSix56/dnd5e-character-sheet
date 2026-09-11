// D&D 5e Race Compendium Type Definitions

export type RaceCategory = 'core' | 'multiverse' | 'setting' | 'spelljammer' | 'lineage';

export type MagicClass = 'wizard' | 'druid' | 'cleric' | 'sorcerer' | 'warlock' | 'bard' | 'artificer' | 'any';
export type ToolCategory = 'artisan' | 'musical' | 'gaming' | 'thieves' | 'dwarf_tools' | 'any';

export interface RaceCantripChoiceConfig {
  class?: MagicClass;
  spellOptions?: string[];                    // Фиксированный список заклинаний (напр., Астральный эльф)
  count?: number;                             // Количество заговоров на выбор (дефолт 1)
  abilityChoice?: ('ИНТ' | 'МДР' | 'ХАР')[]; // Выбор базовой характеристики магии (по MPMM)
}

export interface RaceToolChoiceConfig {
  category?: ToolCategory;
  options?: string[];                         // Конкретные инструменты на выбор
  count?: number;                             // Количество на выбор (дефолт 1)
}

export interface RaceWeaponProfChoiceConfig {
  category?: 'martial' | 'simple' | 'any';
  options?: string[];
  count?: number;
}

export interface RaceCustomFeatureOption {
  id: string;
  name: string;
  description: string;
}

export interface RaceCustomFeatureChoiceConfig {
  featureName: string;                        // Напр. "Животное усиление (Симикский гибрид)", "Сезон фей"
  options: RaceCustomFeatureOption[];
}

export interface RaceChoicesConfig {
  hasFeat?: boolean;                             // Стартовая черта (Вариантный человек, Кастомное происхождение)
  extraSkillsCount?: number;                     // Количество доп. навыков на выбор
  skillChoiceOptions?: string[];                 // Ограниченный список навыков для выбора (если не все)
  cantripChoice?: MagicClass | RaceCantripChoiceConfig; // Заговор заданного класса или расширенная конфигурация
  toolChoice?: ToolCategory | RaceToolChoiceConfig;     // Инструменты или категория
  sizeChoice?: ('Средний' | 'Маленький')[];      // Выбор размера существа (MPMM)
  weaponProfChoice?: RaceWeaponProfChoiceConfig; // Владение оружием
  extraLanguagesCount?: number;                  // Дополнительные языки на выбор
  dragonAncestry?: boolean;                      // Выбор драконьего предка (Драконорождённые)
  customFeatureChoice?: RaceCustomFeatureChoiceConfig; // Уникальные мутации / варианты подрасы
  isFlexibleASI?: boolean;                       // Свободные характеристики (MPMM / Tasha)
}

export interface CompendiumSubrace {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  abilityBonuses: Partial<Record<'СИЛ' | 'ЛОВ' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР', number>>;
  traits: { name: string; description: string }[];
  speed?: number;
  choices?: RaceChoicesConfig;
}

export interface CompendiumRace {
  id: string;
  name: string;
  nameEn: string;
  source: string;
  category: RaceCategory;
  description: string;
  abilityBonuses: Partial<Record<'СИЛ' | 'ЛОВ' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР', number>>;
  speed: number;
  size: 'Средний' | 'Маленький';
  darkvision: number;
  languages: string[];
  traits: { name: string; description: string }[];
  subraces: CompendiumSubrace[];
  choices?: RaceChoicesConfig;
}
