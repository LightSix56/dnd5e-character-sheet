import { CharacterData, AbilityName } from '@/lib/dnd-types';
import { DndSpell } from '@/data/compendium/spells';
import { FightingStyleOption, FIGHTING_STYLES } from '@/components/wizard/wizard-helpers';
import { normalizeClassName } from '@/data/compendium/class-progression';
import {
  WARLOCK_INVOCATIONS,
  WARLOCK_PACT_BOONS,
  GENIE_KINDS,
  WARLOCK_MYSTIC_ARCANUM_SPELLS,
  isInvocationAvailable,
  InvocationDefinition,
  PactBoonDefinition,
  GenieKindDefinition,
} from '@/data/compendium/warlock-choices';

// ── Metamagic Options (Sorcerer) ──

export interface MetamagicOption {
  id: string;
  name: string;
  cost: string;
  description: string;
}

export const METAMAGIC_OPTIONS: MetamagicOption[] = [
  {
    id: 'careful',
    name: 'Тщательное заклинание',
    cost: '1 очко чародейства',
    description: 'Выбранные существа автоматически преуспевают в спасброске против заклинания.'
  },
  {
    id: 'distant',
    name: 'Далёкое заклинание',
    cost: '1 очко чародейства',
    description: 'Удваивает дистанцию заклинания (или дистанция становится 30 футов для заклинаний с дистанцией касания).'
  },
  {
    id: 'empowered',
    name: 'Усиленное заклинание',
    cost: '1 очко чародейства',
    description: 'Переброс до мод. ХАР костей урона (можно совмещать с другими метамагиями).'
  },
  {
    id: 'extended',
    name: 'Продлённое заклинание',
    cost: '1 очко чародейства',
    description: 'Удваивает длительность заклинания (максимум до 24 часов).'
  },
  {
    id: 'heightened',
    name: 'Увеличенное заклинание',
    cost: '3 очка чародейства',
    description: 'Цель получает помеху на первый спасбросок против этого заклинания.'
  },
  {
    id: 'quickened',
    name: 'Быстрое заклинание',
    cost: '2 очка чародейства',
    description: 'Заклинание со временем накладывания 1 действие творится бонусным действием.'
  },
  {
    id: 'subtle',
    name: 'Неуловимое заклинание',
    cost: '1 очко чародейства',
    description: 'Заклинание творится без вербальных и соматических компонентов.'
  },
  {
    id: 'twinned',
    name: 'Удвоенное заклинание',
    cost: 'Очки равны кругу заклинания (1 для заговоров)',
    description: 'Заклинание, нацеливающееся только на одно существо, может нацелиться на второе существо в пределах дистанции.'
  }
];

// ── Eldritch Invocations (Warlock) ──

export interface InvocationOption {
  id: string;
  name: string;
  levelReq: number;
  description: string;
}

export const ELDRITCH_INVOCATIONS: InvocationOption[] = [
  {
    id: 'agonizing-blast',
    name: 'Мучительный взрыв',
    levelReq: 1,
    description: 'Требование: заговор мистический заряд; добавьте мод. ХАР к урону при попадании.'
  },
  {
    id: 'armor-of-shadows',
    name: 'Броня теней',
    levelReq: 1,
    description: 'Вы можете неограниченно творить доспехи мага на себя без траты ячеек заклинаний.'
  },
  {
    id: 'devils-sight',
    name: 'Дьявольский взгляд',
    levelReq: 1,
    description: 'Вы видите нормально как в немагической, так и в магической тьме на 120 футов.'
  },
  {
    id: 'eldritch-sight',
    name: 'Мистический взор',
    levelReq: 1,
    description: 'Вы можете неограниченно творить обнаружение магии без траты ячеек заклинаний.'
  },
  {
    id: 'eyes-of-the-rune-keeper',
    name: 'Глаза хранителя рун',
    levelReq: 1,
    description: 'Вы можете читать любые письменные знаки и тексты.'
  },
  {
    id: 'fiendish-vigor',
    name: 'Дьявольская бодрость',
    levelReq: 1,
    description: 'Вы можете неограниченно творить ложную жизнь на себя как заклинание 1-го круга.'
  },
  {
    id: 'mask-of-many-faces',
    name: 'Маска многих обличий',
    levelReq: 1,
    description: 'Вы можете неограниченно творить маскировку без траты ячеек заклинаний.'
  },
  {
    id: 'repelling-blast',
    name: 'Отталкивающий взрыв',
    levelReq: 1,
    description: 'При попадании мистическим зарядом вы можете оттолкнуть существо на 10 футов по прямой линии.'
  },
  {
    id: 'thirsting-blade',
    name: 'Жаждущий клинок',
    levelReq: 5,
    description: 'Требование: 5-й ур., Договор клинка; вы можете атаковать оружием пакта дважды при действии Атака.'
  }
];

// ── Ranger Hunter Archetype Choices ──

export const HUNTER_PREY_OPTIONS: { id: string; name: string; description: string }[] = [
  {
    id: 'colossus-slayer',
    name: 'Убийца колоссов',
    description: '+1d8 урона раз в ход существу с неполными хитами при попадании атакой оружием.'
  },
  {
    id: 'giant-killer',
    name: 'Сокрушитель гигантов',
    description: 'Реакцией совершите атаку по Большому или крупнее существу в пределах 5 футов, если оно атаковало вас.'
  },
  {
    id: 'horde-breaker',
    name: 'Ордынщик',
    description: 'Один раз в свой ход совершите дополнительную атаку оружием по другому существу в 5 футах от первой цели.'
  }
];

export const HUNTER_DEFENSE_OPTIONS: { id: string; name: string; description: string }[] = [
  {
    id: 'escape-the-horde',
    name: 'Побег от орды',
    description: 'Провоцированные атаки по вам совершаются с помехой.'
  },
  {
    id: 'multiattack-defense',
    name: 'Защита от мультиатаки',
    description: 'Когда существо попадает по вам атакой, вы получаете бонус +4 к КД против всех последующих атак этого существа до конца хода.'
  },
  {
    id: 'steel-will',
    name: 'Стальная воля',
    description: 'Вы совершаете с преимуществом спасброски от испуга.'
  }
];

export const HUNTER_MULTIATTACK_OPTIONS: { id: string; name: string; description: string }[] = [
  {
    id: 'volley',
    name: 'Залп',
    description: 'Совершите дальнобойную атаку по любому числу существ в пределах 10 футов от выбранной точки при наличии боеприпасов.'
  },
  {
    id: 'whirlwind',
    name: 'Вихревая атака',
    description: 'Совершите рукопашную атаку по любому числу существ в пределах 5 футов от вас.'
  }
];

export const HUNTER_SUPERIOR_DEFENSE_OPTIONS: { id: string; name: string; description: string }[] = [
  {
    id: 'evasion',
    name: 'Уклонение',
    description: 'При успехе спасброска Ловкости от урона вы не получаете урон вовсе, а при провале получаете лишь половину.'
  },
  {
    id: 'stand-against-tide',
    name: 'Противостояние приливу',
    description: 'Когда существо промахивается по вам рукопашной атакой, реакцией заставьте его повторить атаку по другому существу в его досягаемости.'
  },
  {
    id: 'uncanny-dodge',
    name: 'Непоколебимость',
    description: 'Когда видимый противник попадает по вам атакой, реакцией уполовиньте получаемый от неё урон.'
  }
];

// ── Barbarian Totem Warrior Choices ──

export const TOTEM_SPIRIT_OPTIONS: { id: string; name: string; description: string }[] = [
  {
    id: 'bear',
    name: 'Медведь',
    description: 'В ярости вы получаете сопротивление всем видам урона, кроме психического.'
  },
  {
    id: 'eagle',
    name: 'Орёл',
    description: 'В ярости вы можете совершать Рывок бонусным действием, а провоцированные атаки по вам совершаются с помехой.'
  },
  {
    id: 'wolf',
    name: 'Волк',
    description: 'В ярости ваши союзники получают преимущество на броски рукопашных атак по врагам в 5 футах от вас.'
  }
];

export const TOTEM_ASPECT_OPTIONS: { id: string; name: string; description: string }[] = [
  {
    id: 'bear',
    name: 'Медведь',
    description: 'Грузоподъёмность (включая максимальный вес для подъёма и волочения) удваивается, преимущество на проверки Силы для толкания/подъёма.'
  },
  {
    id: 'eagle',
    name: 'Орёл',
    description: 'Отличное зрение: вы видите детали на расстоянии до 1 мили, тусклый свет не создает помехи на проверки Внимательности.'
  },
  {
    id: 'wolf',
    name: 'Волк',
    description: 'Выслеживание: вы можете идти по следу существ в быстром темпе и перемещаться скрытно в нормальном темпе.'
  }
];

// ── Battle Master Maneuvers (Fighter) ──

export const BATTLE_MASTER_MANEUVERS: { id: string; name: string; description: string }[] = [
  {
    id: 'parry',
    name: 'Парирование',
    description: 'Реакцией при получении урона от рукопашной атаки уменьшите урон на 1d8 + мод. ЛОВ.'
  },
  {
    id: 'riposte',
    name: 'Ответный удар',
    description: 'Реакцией при промахе существа рукопашной атакой по вам совершите контратаку этим оружием (+1d8 к урону).'
  },
  {
    id: 'trip-attack',
    name: 'Сбивание с ног',
    description: 'При попадании оружием добавьте 1d8 к урону; цель Большого или меньшего размера совершает спасбросок Силы или падает ничком.'
  },
  {
    id: 'goading-attack',
    name: 'Провокационная атака',
    description: 'При попадании добавьте 1d8 к урону; цель совершает спасбросок Мудрости или получает помеху на атаки по другим существам до конца вашего след. хода.'
  },
  {
    id: 'maneuvering-attack',
    name: 'Маневрирующая атака',
    description: 'При попадании добавьте 1d8 к урону; один союзник может реакцией переместиться на половину скорости без провокаций от цели.'
  },
  {
    id: 'lunging-attack',
    name: 'Выпад',
    description: 'Увеличивает досягаемость рукопашной атаки на 5 футов; при попадании добавьте 1d8 к урону.'
  },
  {
    id: 'disarming-attack',
    name: 'Обезоруживающая атака',
    description: 'При попадании добавьте 1d8 к урону; цель совершает спасбросок Силы или роняет один предмет на выбор.'
  },
  {
    id: 'precision-attack',
    name: 'Точная атака',
    description: 'Добавьте 1d8 к броску атаки оружием до или после броска, но до применения эффектов.'
  }
];

// ── Configuration Interface ──

export interface LevelUpChoicesConfig {
  needsFightingStyle?: boolean;
  fightingStyleOptions?: FightingStyleOption[];
  needsExpertise?: boolean;
  expertiseCount?: number;
  eligibleSkills?: string[];
  needsMetamagic?: boolean;
  metamagicCount?: number;
  metamagicOptions?: MetamagicOption[];
  needsInvocations?: boolean;
  invocationsCount?: number;
  invocationsOptions?: InvocationOption[];
  eligibleInvocations?: InvocationDefinition[];
  canSwapInvocation?: boolean;
  existingInvocations?: string[];
  needsWarlockPatron?: boolean;
  needsGenieKind?: boolean;
  genieKindOptions?: GenieKindDefinition[];
  needsPactBoon?: boolean;
  pactBoonOptions?: PactBoonDefinition[];
  needsTomeCantrips?: boolean;
  tomeCantripsCount?: number;
  needsMysticArcanum?: boolean;
  arcanumCircle?: number;
  arcanumOptions?: string[];
  needsFiendResilience?: boolean;
  fiendResilienceOptions?: string[];
  needsHunterChoice?: boolean;
  hunterChoiceTitle?: string;
  hunterOptions?: { id: string; name: string; description: string }[];
  needsSavingThrowProficiency?: boolean;
  savingThrowTitle?: string;
  savingThrowOptions?: AbilityName[];
  needsFeyWandererSkill?: boolean;
  feyWandererSkillOptions?: string[];
  needsTotemChoice?: boolean;
  totemChoiceTitle?: string;
  totemOptions?: { id: string; name: string; description: string }[];
  needsManeuvers?: boolean;
  maneuverCount?: number;
  maneuverOptions?: { id: string; name: string; description: string }[];
}

// ── Rules Engine for Level-Up Choices ──

export function getLevelUpChoicesConfig(
  char: CharacterData,
  newLevel: number,
  subclassOverride?: string
): LevelUpChoicesConfig {
  const config: LevelUpChoicesConfig = {};
  const normClass = normalizeClassName(char.className || '');
  const rawSubclass = (subclassOverride !== undefined ? subclassOverride : (char.subclass || '')).trim().toLowerCase();

  // 1. Fighting Styles
  // Paladin level 2: Defense, Dueling, Great Weapon Fighting, Protection
  if (normClass === 'Паладин' && newLevel === 2) {
    config.needsFightingStyle = true;
    config.fightingStyleOptions = FIGHTING_STYLES.filter(fs =>
      ['defense', 'dueling', 'great-weapon', 'protection'].includes(fs.id)
    );
  }

  // Ranger level 2: Archery, Defense, Dueling, Two-Weapon Fighting
  if (normClass === 'Следопыт' && newLevel === 2) {
    config.needsFightingStyle = true;
    config.fightingStyleOptions = FIGHTING_STYLES.filter(fs =>
      ['archery', 'defense', 'dueling', 'two-weapon'].includes(fs.id)
    );
  }

  // Fighter (Champion) level 10: Additional Fighting Style from all 6 options
  if (
    normClass === 'Воин' &&
    newLevel === 10 &&
    (rawSubclass.includes('чемпион') || rawSubclass.includes('champion'))
  ) {
    config.needsFightingStyle = true;
    config.fightingStyleOptions = [...FIGHTING_STYLES];
  }

  // 2. Expertise
  // Bard level 3 and level 10
  if (normClass === 'Бард' && (newLevel === 3 || newLevel === 10)) {
    const profs = char.skillProficiencies || {};
    const exps = char.skillExpertise || {};
    config.needsExpertise = true;
    config.expertiseCount = 2;
    config.eligibleSkills = Object.keys(profs).filter(s => Boolean(profs[s]) && !Boolean(exps[s]));
  }

  // Rogue level 6
  if (normClass === 'Плут' && newLevel === 6) {
    const profs = char.skillProficiencies || {};
    const exps = char.skillExpertise || {};
    config.needsExpertise = true;
    config.expertiseCount = 2;
    config.eligibleSkills = Object.keys(profs).filter(s => Boolean(profs[s]) && !Boolean(exps[s]));
  }

  // 3. Metamagic (Sorcerer)
  // Sorcerer level 3: choose 2
  if (normClass === 'Чародей' && newLevel === 3) {
    config.needsMetamagic = true;
    config.metamagicCount = 2;
    config.metamagicOptions = METAMAGIC_OPTIONS;
  }

  // Sorcerer level 10 & 17: choose 1
  if (normClass === 'Чародей' && (newLevel === 10 || newLevel === 17)) {
    config.needsMetamagic = true;
    config.metamagicCount = 1;
    config.metamagicOptions = METAMAGIC_OPTIONS;
  }

  // 4. Warlock Choices (Invocations, Pact Boon, Mystic Arcanum, Subclass Features)
  if (normClass === 'Колдун') {
    // 4.1. Patron at Level 1 (if character has no subclass)
    if (newLevel === 1 && !rawSubclass) {
      config.needsWarlockPatron = true;
    }

    // 4.2. Genie Kind at Level 1 (if patron is Genie)
    if (rawSubclass.includes('джинн') || rawSubclass.includes('genie')) {
      const hasGenieKindInTraits = (char.traitsList || []).some(t =>
        (t.name && t.name.includes('Вид джинна')) || (t.id && t.id.startsWith('genie-'))
      );
      if (newLevel === 1 || !hasGenieKindInTraits) {
        config.needsGenieKind = true;
        config.genieKindOptions = Object.values(GENIE_KINDS);
      }
    }

    // 4.3. Pact Boon at Level 3
    if (newLevel === 3) {
      config.needsPactBoon = true;
      config.pactBoonOptions = Object.values(WARLOCK_PACT_BOONS);
    }

    // Determine current Pact Boon from traits
    let currentPactBoon: string | undefined;
    for (const t of (char.traitsList || [])) {
      const tName = (t.name || '').toLowerCase();
      const tId = (t.id || '').toLowerCase();
      if (tName.includes('договор гримуара') || tName.includes('книга теней') || tId.includes('tome')) currentPactBoon = 'tome';
      else if (tName.includes('договор клинка') || tId.includes('blade')) currentPactBoon = 'blade';
      else if (tName.includes('договор цепи') || tId.includes('chain')) currentPactBoon = 'chain';
      else if (tName.includes('договор талисмана') || tId.includes('talisman')) currentPactBoon = 'talisman';
    }

    // Determine known cantrips from char.cantrips and spellsByLevel[0]
    const knownCantrips = Array.from(new Set([
      ...(char.cantrips || []),
      ...((char.spellsByLevel?.[0] || []).map(s => s.name))
    ]));

    // 4.4. Eldritch Invocations
    // Level 2: choose 2
    if (newLevel === 2) {
      config.needsInvocations = true;
      config.invocationsCount = 2;
      const eligible = WARLOCK_INVOCATIONS.filter(inv =>
        isInvocationAvailable(inv, newLevel, currentPactBoon, knownCantrips)
      );
      config.eligibleInvocations = eligible;
      config.invocationsOptions = WARLOCK_INVOCATIONS
        .filter(inv => inv.levelReq <= newLevel)
        .map(inv => ({
          id: inv.id,
          name: inv.name,
          levelReq: inv.levelReq,
          description: `${inv.prerequisiteDescription ? `[${inv.prerequisiteDescription}] ` : ''}${inv.description}`
        }));
    }

    // Level 5, 7, 9, 12, 15, 18: choose 1
    if ([5, 7, 9, 12, 15, 18].includes(newLevel)) {
      config.needsInvocations = true;
      config.invocationsCount = 1;
      const eligible = WARLOCK_INVOCATIONS.filter(inv =>
        isInvocationAvailable(inv, newLevel, currentPactBoon, knownCantrips)
      );
      config.eligibleInvocations = eligible;
      config.invocationsOptions = WARLOCK_INVOCATIONS
        .filter(inv => inv.levelReq <= newLevel)
        .map(inv => ({
          id: inv.id,
          name: inv.name,
          levelReq: inv.levelReq,
          description: `${inv.prerequisiteDescription ? `[${inv.prerequisiteDescription}] ` : ''}${inv.description}`
        }));
    }

    // Invocation swapping available at level >= 3
    if (newLevel >= 3) {
      config.canSwapInvocation = true;
      config.existingInvocations = (char.traitsList || [])
        .filter(t => (t.id && t.id.startsWith('invocation-')) || (t.name && t.name.startsWith('Таинственное воззвание:')))
        .map(t => t.name.replace('Таинственное воззвание: ', ''));
    }

    // 4.5. Mystic Arcanum (levels 11, 13, 15, 17)
    if ([11, 13, 15, 17].includes(newLevel)) {
      config.needsMysticArcanum = true;
      if (newLevel === 11) {
        config.arcanumCircle = 6;
        config.arcanumOptions = WARLOCK_MYSTIC_ARCANUM_SPELLS[6];
      } else if (newLevel === 13) {
        config.arcanumCircle = 7;
        config.arcanumOptions = WARLOCK_MYSTIC_ARCANUM_SPELLS[7];
      } else if (newLevel === 15) {
        config.arcanumCircle = 8;
        config.arcanumOptions = WARLOCK_MYSTIC_ARCANUM_SPELLS[8];
      } else if (newLevel === 17) {
        config.arcanumCircle = 9;
        config.arcanumOptions = WARLOCK_MYSTIC_ARCANUM_SPELLS[9];
      }
    }

    // 4.6. Fiendish Resilience at level 10 (The Fiend)
    if (newLevel === 10 && (rawSubclass.includes('исчадие') || rawSubclass.includes('fiend'))) {
      config.needsFiendResilience = true;
      config.fiendResilienceOptions = [
        'дробящий', 'колющий', 'рубящий', 'огонь', 'холод', 'электричество', 'звук', 'кислота', 'яд', 'некротический', 'излучение'
      ];
    }
  }

  // 5. Ranger Hunter Choices
  // Level 3: Hunter's Prey
  if (
    normClass === 'Следопыт' &&
    newLevel === 3 &&
    (rawSubclass.includes('охотник') || rawSubclass.includes('hunter'))
  ) {
    config.needsHunterChoice = true;
    config.hunterChoiceTitle = 'Добыча охотника';
    config.hunterOptions = HUNTER_PREY_OPTIONS;
  }

  // Level 7: Defensive Tactics
  if (
    normClass === 'Следопыт' &&
    newLevel === 7 &&
    (rawSubclass.includes('охотник') || rawSubclass.includes('hunter'))
  ) {
    config.needsHunterChoice = true;
    config.hunterChoiceTitle = 'Оборонительная тактика';
    config.hunterOptions = HUNTER_DEFENSE_OPTIONS;
  }

  // Level 11: Multiattack
  if (
    normClass === 'Следопыт' &&
    newLevel === 11 &&
    (rawSubclass.includes('охотник') || rawSubclass.includes('hunter'))
  ) {
    config.needsHunterChoice = true;
    config.hunterChoiceTitle = 'Мультиатака';
    config.hunterOptions = HUNTER_MULTIATTACK_OPTIONS;
  }

  // Level 15: Superior Hunter's Defense
  if (
    normClass === 'Следопыт' &&
    newLevel === 15 &&
    (rawSubclass.includes('охотник') || rawSubclass.includes('hunter'))
  ) {
    config.needsHunterChoice = true;
    config.hunterChoiceTitle = 'Защита охотника';
    config.hunterOptions = HUNTER_SUPERIOR_DEFENSE_OPTIONS;
  }

  // 5b. Gloom Stalker Level 7: Iron Mind (Железный разум)
  if (
    normClass === 'Следопыт' &&
    newLevel === 7 &&
    (rawSubclass.includes('сумрачный') || rawSubclass.includes('gloom'))
  ) {
    config.needsSavingThrowProficiency = true;
    config.savingThrowTitle = 'Железный разум';
    if (!char.savingThrowProficiencies?.['МДР']) {
      config.savingThrowOptions = ['МДР'];
    } else {
      const alt: AbilityName[] = [];
      if (!char.savingThrowProficiencies?.['ИНТ']) alt.push('ИНТ');
      if (!char.savingThrowProficiencies?.['ХАР']) alt.push('ХАР');
      config.savingThrowOptions = alt.length > 0 ? alt : ['ИНТ', 'ХАР'];
    }
  }

  // 5c. Fey Wanderer Level 3: Otherworldly Glamour (Потустороннее очарование)
  if (
    normClass === 'Следопыт' &&
    newLevel === 3 &&
    (rawSubclass.includes('странник фей') || rawSubclass.includes('fey'))
  ) {
    config.needsFeyWandererSkill = true;
    config.feyWandererSkillOptions = ['Обман', 'Выступление', 'Убеждение'];
  }

  // 6. Barbarian Totem Choices
  // Level 3: Totem Spirit
  if (
    normClass === 'Варвар' &&
    newLevel === 3 &&
    (rawSubclass.includes('тотем') || rawSubclass.includes('totem'))
  ) {
    config.needsTotemChoice = true;
    config.totemChoiceTitle = 'Дух тотема';
    config.totemOptions = TOTEM_SPIRIT_OPTIONS;
  }

  // Level 6: Aspect of the Beast
  if (
    normClass === 'Варвар' &&
    newLevel === 6 &&
    (rawSubclass.includes('тотем') || rawSubclass.includes('totem'))
  ) {
    config.needsTotemChoice = true;
    config.totemChoiceTitle = 'Аспект зверя';
    config.totemOptions = TOTEM_ASPECT_OPTIONS;
  }

  // 7. Fighter Battle Master Maneuvers
  // Level 3: Choose 3 maneuvers
  if (
    normClass === 'Воин' &&
    newLevel === 3 &&
    (rawSubclass.includes('мастер') || rawSubclass.includes('battle'))
  ) {
    config.needsManeuvers = true;
    config.maneuverCount = 3;
    config.maneuverOptions = BATTLE_MASTER_MANEUVERS;
  }

  return config;
}

// ── Third-Casters Spell Slots (Eldritch Knight / Arcane Trickster) ──
export function getThirdCasterSpellSlots(level: number): Record<number, number> | null {
  if (level < 3) return null;
  if (level <= 3) return { 1: 2 };
  if (level <= 6) return { 1: 3 };
  if (level <= 8) return { 1: 4, 2: 2 };
  if (level <= 9) return { 1: 4, 2: 2 };
  if (level <= 12) return { 1: 4, 2: 3 };
  if (level <= 15) return { 1: 4, 2: 3, 3: 2 };
  if (level <= 18) return { 1: 4, 2: 3, 3: 3 };
  return { 1: 4, 2: 3, 3: 3, 4: 1 };
}

// ── Known Spells Extraction and Level-Up Spell Filtering ──

export function normalizeSpellName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Returns a Set of normalized lowercase spell names known by the character,
 * including cantrips, leveled spells from spellsByLevel, legacy spells array,
 * and any optional additional spell names (e.g. from auto-spells or racial traits).
 */
export function getKnownSpellNames(
  char?: Partial<CharacterData> | null,
  additionalSpells?: (string | undefined | null)[]
): Set<string> {
  const known = new Set<string>();

  const add = (name?: string | null) => {
    if (!name || typeof name !== 'string') return;
    const norm = normalizeSpellName(name);
    if (norm) known.add(norm);
  };

  if (char) {
    // 1. Cantrips
    if (Array.isArray(char.cantrips)) {
      char.cantrips.forEach(add);
    }

    // 2. Leveled spells
    if (char.spellsByLevel && typeof char.spellsByLevel === 'object') {
      Object.values(char.spellsByLevel).forEach(levelList => {
        if (Array.isArray(levelList)) {
          levelList.forEach(entry => add(entry?.name));
        }
      });
    }

    // 3. Fallback / legacy spells array
    if (Array.isArray((char as unknown as { spells?: unknown }).spells)) {
      const legacySpells = (char as unknown as { spells: unknown[] }).spells;
      legacySpells.forEach((entry: unknown) => {
        if (typeof entry === 'string') add(entry);
        else if (entry && typeof (entry as { name?: unknown }).name === 'string') {
          add((entry as { name: string }).name);
        }
      });
    }
  }

  // 4. Additional spell names (autoSpells, racial spells, sibling choices, etc.)
  if (Array.isArray(additionalSpells)) {
    additionalSpells.forEach(add);
  }

  return known;
}

/**
 * Filters a list of DndSpell objects to exclude any spells whose normalized name
 * is already in the knownSet, while keeping currentSpellName if specified.
 */
export function filterAvailableSpells(
  spells: DndSpell[],
  knownSet: Set<string>,
  currentSpellName?: string | null
): DndSpell[] {
  const currentNorm = currentSpellName ? normalizeSpellName(currentSpellName) : null;
  return spells.filter(spell => {
    const spellNorm = normalizeSpellName(spell.name);
    if (currentNorm && spellNorm === currentNorm) {
      return true;
    }
    return !knownSet.has(spellNorm);
  });
}

