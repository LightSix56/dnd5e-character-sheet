import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcPointBuyTotalSpent,
  POINT_BUY_BUDGET,
  POINT_BUY_COST_TABLE,
  getClassSkillConfig,
  getClassSpellcastingLimits,
  getRacialBonusConfig,
  getRacialSkillData,
  roll4d6DropLowest,
  generateFantasyName,
  validateStandardArray,
  calcPreparedSpellsLimit,
  calculateWizardAC,
  getRacialChoicesConfig
} from '../src/components/wizard/wizard-helpers';
import { DND_COMPENDIUM_SPELLS } from '../src/data/compendium/spells';
import { DND_COMPENDIUM_RACES } from '../src/data/compendium/races';
import { DND_COMPENDIUM_CLASSES } from '../src/data/compendium/classes';
import { DND_COMPENDIUM_BACKGROUNDS } from '../src/data/compendium/backgrounds';

// ── Baseline Tests ──

test('Wizard Engine Baseline: point buy starting cost is 0 for all 8s', () => {
  const base = { 'СИЛ': 8, 'ЛОВ': 8, 'ТЕЛ': 8, 'ИНТ': 8, 'МДР': 8, 'ХАР': 8 };
  assert.equal(calcPointBuyTotalSpent(base), 0);
  assert.equal(POINT_BUY_BUDGET, 27);
});

test('Wizard Engine Baseline: 4d6 roll drops lowest die', () => {
  const roll = roll4d6DropLowest();
  assert.equal(roll.dice.length, 4);
  assert.ok(roll.total >= 3 && roll.total <= 18);
  assert.ok(roll.droppedIndex >= 0 && roll.droppedIndex < 4);
});

// ── RED TEAM ADVERSARIAL STRESS TESTS ──

test('Flaw 1: Artificer spellcaster must have cantrips and 1st-level spells in compendium', () => {
  const limits = getClassSpellcastingLimits('Изобретатель', { 'СИЛ': 8, 'ЛОВ': 10, 'ТЕЛ': 14, 'ИНТ': 16, 'МДР': 12, 'ХАР': 10 }, { 'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0 });
  assert.equal(limits.isCaster, true, 'Artificer must be recognized as a spellcaster');
  assert.ok(limits.cantripsLimit > 0, 'Artificer must have at least 2 cantrips');
  assert.ok(limits.spellsLimit > 0, 'Artificer must prepare at least 1 spell');

  // Filter available spells in compendium for Artificer
  const availableCantrips = DND_COMPENDIUM_SPELLS.filter(s =>
    s.level === 0 && (s.classes || []).some(cls => cls.toLowerCase() === 'изобретатель')
  );
  const availableSpells = DND_COMPENDIUM_SPELLS.filter(s =>
    s.level === 1 && (s.classes || []).some(cls => cls.toLowerCase() === 'изобретатель')
  );

  // STRESS ASSERTION: If compendium lacks Artificer spells, the player is trapped in Step 5!
  assert.ok(
    availableCantrips.length >= limits.cantripsLimit,
    `Compendium must have at least ${limits.cantripsLimit} cantrips for Artificer, but found ${availableCantrips.length}!`
  );
  assert.ok(
    availableSpells.length >= limits.spellsLimit,
    `Compendium must have at least ${limits.spellsLimit} 1st-level spells for Artificer, but found ${availableSpells.length}!`
  );
});

test('Flaw 2: Point Buy calculator must reject illegal out-of-bounds scores (< 8 or > 15)', () => {
  // Scores below 8 or above 15 are strictly illegal in 5e Point Buy (PHB p. 13)
  const illegalScores = { 'СИЛ': 18, 'ЛОВ': 16, 'ТЕЛ': 14, 'ИНТ': 10, 'МДР': 8, 'ХАР': 6 };
  
  // Currently calcPointBuyTotalSpent silently clamps 18 -> 15 and 6 -> 8
  // If silent clamping occurs: 18->9 pts, 16->9 pts, 14->7 pts, 10->2 pts, 8->0 pts, 6->0 pts = 27 pts!
  // This masquerades as a valid 27-budget spend!
  const total = calcPointBuyTotalSpent(illegalScores);
  assert.notEqual(
    total,
    27,
    'Point Buy calculator must NOT silently clamp scores 18 and 6 to appear as exactly 27 points spent!'
  );
});

test('Flaw 3: Standard Array validation function must exist and reject duplicate values', () => {
  assert.equal(typeof validateStandardArray, 'function', 'wizard-helpers must export validateStandardArray');
  
  const all15s = { 'СИЛ': 15, 'ЛОВ': 15, 'ТЕЛ': 15, 'ИНТ': 15, 'МДР': 15, 'ХАР': 15 };
  const res = validateStandardArray(all15s);
  assert.equal(res.valid, false, 'Standard Array with all 15s must be invalid');
  
  const validArray = { 'СИЛ': 15, 'ЛОВ': 14, 'ТЕЛ': 13, 'ИНТ': 12, 'МДР': 10, 'ХАР': 8 };
  assert.equal(validateStandardArray(validArray).valid, true, 'Valid Standard Array permutation must be valid');
});

test('Flaw 4: Wizard spellbook vs prepared spells calculation distinction', () => {
  assert.equal(typeof calcPreparedSpellsLimit, 'function', 'wizard-helpers must export calcPreparedSpellsLimit');

  // Wizard with INT 16 (+3) at Level 1
  const prepLimit = calcPreparedSpellsLimit('Волшебник', 1, 3);
  assert.equal(prepLimit, 4, 'Wizard (INT +3, level 1) must prepare exactly 3 + 1 = 4 spells');

  // Wizard with INT 8 (-1) at Level 1 (minimum 1 spell per PHB p. 114)
  const prepLimitLow = calcPreparedSpellsLimit('Волшебник', 1, -1);
  assert.equal(prepLimitLow, 1, 'Wizard (INT -1, level 1) must prepare at least 1 spell');
});

test('Flaw 5: AC calculation must reflect character actual DEX modifier, not static template', () => {
  assert.equal(typeof calculateWizardAC, 'function', 'wizard-helpers must export calculateWizardAC');

  // Fighter wearing Chain Mail (Кольчуга: base 16, heavy -> no dex)
  assert.equal(calculateWizardAC('Боец', 'Кольчуга', false, 3, 2, 0), 16);
  // Fighter wearing Chain Mail with Shield (+2) -> 18
  assert.equal(calculateWizardAC('Боец', 'Кольчуга', true, 3, 2, 0), 18);

  // Rogue wearing Leather Armor (Кожаный доспех: base 11 + DEX)
  // DEX +4 -> AC 15
  assert.equal(calculateWizardAC('Плут', 'Кожаный доспех', false, 4, 1, 0), 15);
  // DEX +1 -> AC 12 (must NOT be stuck at template typicalAC 14!)
  assert.equal(calculateWizardAC('Плут', 'Кожаный доспех', false, 1, 1, 0), 12);

  // Barbarian Unarmored Defense (10 + DEX + CON)
  // DEX +2, CON +3 -> 15
  assert.equal(calculateWizardAC('Варвар', '', false, 2, 3, 0), 15);
  // Monk Unarmored Defense (10 + DEX + WIS)
  // DEX +3, WIS +2 -> 15
  assert.equal(calculateWizardAC('Монах', '', false, 3, 1, 2), 15);
});

test('Background Search: filters accurately by Russian name, English name, and skills', () => {
  const filterBgs = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return DND_COMPENDIUM_BACKGROUNDS;
    return DND_COMPENDIUM_BACKGROUNDS.filter(bg =>
      bg.name.toLowerCase().includes(q) ||
      (bg.nameEn && bg.nameEn.toLowerCase().includes(q)) ||
      bg.skillProficiencies.some(s => s.toLowerCase().includes(q)) ||
      (bg.description && bg.description.toLowerCase().includes(q))
    );
  };

  // 1. By Russian name
  const soldier = filterBgs('солдат');
  assert.ok(soldier.length >= 1);
  assert.ok(soldier.some(b => b.name === 'Солдат'));

  // 2. By English name
  const acolyte = filterBgs('Acolyte');
  assert.ok(acolyte.length >= 1);
  assert.ok(acolyte.some(b => b.name === 'Аколит'));

  // 3. By skill proficiency
  const stealthBgs = filterBgs('Скрытность');
  assert.ok(stealthBgs.length >= 1);
  assert.ok(stealthBgs.every(b => b.skillProficiencies.some(s => s.toLowerCase().includes('скрытность')) || (b.description && b.description.toLowerCase().includes('скрытность'))));

  // 4. Non-matching query returns empty array
  const empty = filterBgs('НесуществующаяПредысторияXYZ123');
  assert.equal(empty.length, 0);
});

// ── Data-Driven Racial Architecture & Extensibility Tests ──

test('Data-Driven Races: Custom race with choices.hasFeat activates feat selection without hardcoded names', () => {
  const customRace = {
    id: 'alien-construct',
    name: 'Чужеродный конструкт',
    nameEn: 'Alien Construct',
    source: 'Homebrew',
    category: 'multiverse' as const,
    description: 'Тестовая раса',
    abilityBonuses: {},
    speed: 30,
    size: 'Средний' as const,
    darkvision: 60,
    languages: ['Общий'],
    traits: [],
    subraces: [],
    choices: {
      hasFeat: true
    }
  };

  const config = getRacialChoicesConfig(customRace);
  assert.equal(config.needsFeat, true, 'Custom race with choices.hasFeat=true must activate feat selection');
  assert.equal(config.needsCantrip, false);
  assert.equal(config.needsTool, false);
});

test('Data-Driven Races: Custom subrace with choices.cantripChoice activates cantrip selection with specified class', () => {
  const parentRace = {
    id: 'fey-folk',
    name: 'Фейский народ',
    nameEn: 'Fey Folk',
    source: 'Homebrew',
    category: 'core' as const,
    description: 'Тестовая раса',
    abilityBonuses: {},
    speed: 30,
    size: 'Средний' as const,
    darkvision: 60,
    languages: ['Общий'],
    traits: [],
    subraces: []
  };

  const druidSubrace = {
    id: 'fey-druidic',
    name: 'Друидическая фейри',
    nameEn: 'Druidic Fey',
    description: 'Подраса с заговором друида',
    abilityBonuses: {},
    traits: [],
    choices: {
      cantripChoice: 'druid' as const
    }
  };

  const config = getRacialChoicesConfig(parentRace, druidSubrace);
  assert.equal(config.needsCantrip, true, 'Must activate cantrip selection');
  assert.equal(config.cantripClass, 'druid', 'Must specify druid cantrip class');
});

test('Data-Driven Races: Custom race with choices.toolChoice and dragonAncestry', () => {
  const blacksmithRace = {
    id: 'crystal-forged',
    name: 'Кристаллокованный',
    nameEn: 'Crystal Forged',
    source: 'Homebrew',
    category: 'setting' as const,
    description: 'Тестовая раса',
    abilityBonuses: {},
    speed: 30,
    size: 'Средний' as const,
    darkvision: 0,
    languages: ['Общий'],
    traits: [],
    subraces: [],
    choices: {
      toolChoice: 'dwarf_tools' as const,
      dragonAncestry: true
    }
  };

  const config = getRacialChoicesConfig(blacksmithRace);
  assert.equal(config.needsTool, true);
  assert.ok(config.toolOptions.length > 0);
  assert.equal(config.needsDragonColor, true);
});

test('Data-Driven Races: Declarative extraSkillsCount and skillChoiceOptions', () => {
  const skilledRace = {
    id: 'nomad-scout',
    name: 'Кочевник-разведчик',
    nameEn: 'Nomad Scout',
    source: 'Homebrew',
    category: 'core' as const,
    description: 'Тестовая раса',
    abilityBonuses: {},
    speed: 35,
    size: 'Средний' as const,
    darkvision: 0,
    languages: ['Общий'],
    traits: [],
    subraces: [],
    choices: {
      extraSkillsCount: 2,
      skillChoiceOptions: ['Атлетика', 'Выживание', 'Внимательность']
    }
  };

  const skillData = getRacialSkillData(skilledRace);
  assert.equal(skillData.choiceCount, 2, 'Must request 2 skills');
  assert.deepEqual(skillData.choiceOptions, ['Атлетика', 'Выживание', 'Внимательность']);
});

test('Data-Driven Races: Declarative isFlexibleASI activates flexible ability distribution', () => {
  const flexRace = {
    id: 'astral-drifter',
    name: 'Астральный странник',
    nameEn: 'Astral Drifter',
    source: 'Homebrew',
    category: 'multiverse' as const,
    description: 'Тестовая раса',
    abilityBonuses: {},
    speed: 30,
    size: 'Средний' as const,
    darkvision: 0,
    languages: ['Общий'],
    traits: [],
    subraces: [],
    choices: {
      isFlexibleASI: true
    }
  };

  const bonusConfig = getRacialBonusConfig(flexRace);
  assert.equal(bonusConfig.hasCustomBonus, true);
  assert.equal(bonusConfig.choiceCount, 2);
  assert.equal(bonusConfig.bonusAmount, 1);
});

test('Data-Driven Races: Backward compatibility fallback for legacy race objects without choices', () => {
  const legacyHuman = {
    id: 'human',
    name: 'Человек',
    nameEn: 'Human',
    source: 'PHB',
    category: 'core' as const,
    description: 'Legacy human',
    abilityBonuses: {},
    speed: 30,
    size: 'Средний' as const,
    darkvision: 0,
    languages: ['Общий', 'Один язык на выбор'],
    traits: [],
    subraces: []
  };

  const legacyVariant = {
    id: 'human-variant',
    name: 'Человек (Вариантный)',
    nameEn: 'Variant Human',
    description: 'Legacy variant',
    abilityBonuses: {},
    traits: []
  };

  // Even without choices property, legacy fallback must flag needsFeat and extraLanguageCount
  const config = getRacialChoicesConfig(legacyHuman, legacyVariant);
  assert.equal(config.needsFeat, true, 'Legacy human-variant must still need feat via fallback');
  assert.equal(config.extraLanguageCount, 1);
});

test('Data-Driven Races: DND_COMPENDIUM_RACES populated with declarative choices', () => {
  const human = DND_COMPENDIUM_RACES.find(r => r.id === 'human');
  assert.ok(human);
  const variant = human.subraces.find(s => s.id === 'human-variant');
  assert.ok(variant);
  assert.equal(variant.choices?.hasFeat, true);
  assert.equal(variant.choices?.extraSkillsCount, 1);

  const dwarf = DND_COMPENDIUM_RACES.find(r => r.id === 'dwarf');
  assert.ok(dwarf);
  assert.equal(dwarf.choices?.toolChoice, 'dwarf_tools');

  const elf = DND_COMPENDIUM_RACES.find(r => r.id === 'elf');
  assert.ok(elf);
  const highElf = elf.subraces.find(s => s.id === 'elf-high');
  assert.ok(highElf);
  assert.equal(highElf.choices?.cantripChoice, 'wizard');

  const dragonborn = DND_COMPENDIUM_RACES.find(r => r.id === 'dragonborn');
  assert.ok(dragonborn);
  assert.equal(dragonborn.choices?.dragonAncestry, true);

  const customLineage = DND_COMPENDIUM_RACES.find(r => r.id === 'custom-lineage');
  assert.ok(customLineage);
  assert.equal(customLineage.choices?.hasFeat, true);
  assert.equal(customLineage.choices?.isFlexibleASI, true);

  const changeling = DND_COMPENDIUM_RACES.find(r => r.id === 'changeling');
  assert.ok(changeling);
  assert.equal(changeling.choices?.extraSkillsCount, 2);
  assert.deepEqual(changeling.choices?.skillChoiceOptions, ['Запугивание', 'Обман', 'Проницательность', 'Убеждение']);
});

test('Data-Driven Races: Rich cantripConfig with sorcerer class and MPMM abilityChoice', () => {
  const koboldMPMM = {
    id: 'kobold-mpmm',
    name: 'Кобольд (MPMM)',
    nameEn: 'Kobold',
    source: 'MPMM',
    category: 'multiverse' as const,
    description: 'Кобольд с драконьим наследием',
    abilityBonuses: {},
    speed: 30,
    size: 'Маленький' as const,
    darkvision: 60,
    languages: ['Общий', 'Драконий'],
    traits: [],
    subraces: [],
    choices: {
      cantripChoice: {
        class: 'sorcerer' as const,
        count: 1,
        abilityChoice: ['ИНТ' as const, 'МДР' as const, 'ХАР' as const]
      }
    }
  };

  const config = getRacialChoicesConfig(koboldMPMM);
  assert.equal(config.needsCantrip, true);
  assert.equal(config.cantripClass, 'sorcerer');
  assert.equal(config.cantripConfig?.count, 1);
  assert.deepEqual(config.cantripConfig?.abilityChoice, ['ИНТ', 'МДР', 'ХАР']);
});

test('Data-Driven Races: Fixed spellOptions cantrip pool (Astral Elf)', () => {
  const astralElf = {
    id: 'elf-astral',
    name: 'Астральный эльф',
    nameEn: 'Astral Elf',
    source: 'AAG',
    category: 'spelljammer' as const,
    description: 'Эльф Астрального плана',
    abilityBonuses: {},
    speed: 30,
    size: 'Средний' as const,
    darkvision: 60,
    languages: ['Общий'],
    traits: [],
    subraces: [],
    choices: {
      cantripChoice: {
        spellOptions: ['Свет', 'Священное пламя', 'Пляшущие огоньки'],
        abilityChoice: ['ИНТ' as const, 'МДР' as const, 'ХАР' as const]
      }
    }
  };

  const config = getRacialChoicesConfig(astralElf);
  assert.equal(config.needsCantrip, true);
  assert.deepEqual(config.cantripConfig?.spellOptions, ['Свет', 'Священное пламя', 'Пляшущие огоньки']);
});

test('Data-Driven Races: Size choice resolution for MPMM races (Medium or Small)', () => {
  const harengon = {
    id: 'harengon',
    name: 'Харегон',
    nameEn: 'Harengon',
    source: 'MPMM',
    category: 'multiverse' as const,
    description: 'Антропоморфные кролики',
    abilityBonuses: {},
    speed: 30,
    size: 'Средний' as const,
    darkvision: 0,
    languages: ['Общий'],
    traits: [],
    subraces: [],
    choices: {
      sizeChoice: ['Средний' as const, 'Маленький' as const]
    }
  };

  const config = getRacialChoicesConfig(harengon);
  assert.equal(config.needsSizeChoice, true);
  assert.deepEqual(config.availableSizes, ['Средний', 'Маленький']);
});

test('Data-Driven Races: Tool categories (musical instruments, thieves tools)', () => {
  const bardicRace = {
    id: 'satyr-minstrel',
    name: 'Сатир-менестрель',
    nameEn: 'Satyr Minstrel',
    source: 'Homebrew',
    category: 'setting' as const,
    description: 'Музыкальный народ',
    abilityBonuses: {},
    speed: 35,
    size: 'Средний' as const,
    darkvision: 0,
    languages: ['Общий'],
    traits: [],
    subraces: [],
    choices: {
      toolChoice: 'musical' as const
    }
  };

  const rogueRace = {
    id: 'shadow-scamp',
    name: 'Теневой плутишка',
    nameEn: 'Shadow Scamp',
    source: 'Homebrew',
    category: 'multiverse' as const,
    description: 'Вор',
    abilityBonuses: {},
    speed: 30,
    size: 'Маленький' as const,
    darkvision: 60,
    languages: ['Общий'],
    traits: [],
    subraces: [],
    choices: {
      toolChoice: 'thieves' as const
    }
  };

  const bardConfig = getRacialChoicesConfig(bardicRace);
  assert.equal(bardConfig.needsTool, true);
  assert.ok(bardConfig.toolOptions.includes('Лютня'));
  assert.ok(bardConfig.toolOptions.includes('Барабан'));

  const rogueConfig = getRacialChoicesConfig(rogueRace);
  assert.equal(rogueConfig.needsTool, true);
  assert.deepEqual(rogueConfig.toolOptions, ['Воровские инструменты']);
});

test('Data-Driven Races: Custom feature choices (Simic Hybrid animal enhancements)', () => {
  const simicHybrid = {
    id: 'simic-hybrid',
    name: 'Симикский гибрид',
    nameEn: 'Simic Hybrid',
    source: 'GGTR',
    category: 'setting' as const,
    description: 'Биомагический гибрид',
    abilityBonuses: {},
    speed: 30,
    size: 'Средний' as const,
    darkvision: 60,
    languages: ['Общий'],
    traits: [],
    subraces: [],
    choices: {
      customFeatureChoice: {
        featureName: 'Животное усиление (1 уровень)',
        options: [
          { id: 'manta-glide', name: 'Планирующие крылья (Manta Glide)', description: 'Замедляет падение до 100 фт/раунд, снижает урон от падения до 0.' },
          { id: 'nimble-climber', name: 'Лазающие конечности (Nimble Climber)', description: 'Скорость лазания равна вашей базовой скорости.' },
          { id: 'underwater-adaptation', name: 'Подводная адаптация', description: 'Вы можете дышать под водой, скорость плавания равна базовой.' }
        ]
      }
    }
  };

  const config = getRacialChoicesConfig(simicHybrid);
  assert.equal(config.needsCustomFeature, true);
  assert.equal(config.customFeature?.featureName, 'Животное усиление (1 уровень)');
  assert.equal(config.customFeature?.options.length, 3);
  assert.equal(config.customFeature?.options[0].id, 'manta-glide');
});

test('Data-Driven Races: Direct extraLanguagesCount in choices', () => {
  const polyglotRace = {
    id: 'planar-diplomat',
    name: 'Планарный дипломат',
    nameEn: 'Planar Diplomat',
    source: 'Homebrew',
    category: 'multiverse' as const,
    description: 'Знает множество наречий',
    abilityBonuses: {},
    speed: 30,
    size: 'Средний' as const,
    darkvision: 0,
    languages: ['Общий'],
    traits: [],
    subraces: [],
    choices: {
      extraLanguagesCount: 3
    }
  };

  const config = getRacialChoicesConfig(polyglotRace);
  assert.equal(config.extraLanguageCount, 3, 'Must respect direct extraLanguagesCount');
});




